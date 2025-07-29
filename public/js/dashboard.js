// Dashboard functionality
let currentUser = null;
let currentSection = 'dashboard';
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// Global error handlers
window.addEventListener('error', function(e) {
    console.error('Global JavaScript error:', e.error);
    if (typeof showNotification === 'function') {
        showNotification('JavaScript error: ' + e.message, 'error');
    }
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
    if (typeof showNotification === 'function') {
        showNotification('Promise error: ' + e.reason, 'error');
    }
});

document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
});

async function initializeDashboard() {
    // Check authentication
    if (!checkAuth()) {
        window.location.href = '/';
        return;
    }

    // Load user info
    await loadCurrentUser();
    
    // Initialize navigation
    initializeNavigation();
    
    // Update current time
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
    
    // Load initial data
    await loadDashboardData();
    
    // Initialize calendar
    renderCalendar();
}

function checkAuth() {
    const token = localStorage.getItem('authToken');
    return !!token;
}

async function loadCurrentUser() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/auth/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            updateUserInfo();
            
            // Show admin elements if user is admin
            if (currentUser.role === 'admin') {
                document.querySelectorAll('.admin-only').forEach(el => {
                    el.style.display = el.tagName === 'TH' || el.tagName === 'TD' ? 'table-cell' : 'block';
                });
            }
        } else {
            throw new Error('Failed to load user info');
        }
    } catch (error) {
        console.error('Error loading user:', error);
        logout();
    }
}

function updateUserInfo() {
    document.getElementById('currentUsername').textContent = `${currentUser.first_name} ${currentUser.last_name}`;
    document.getElementById('currentRole').textContent = currentUser.role;
}

function initializeNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const section = this.dataset.section;
            showSection(section);
        });
    });
}

function showSection(sectionName) {
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
    
    // Update content
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`${sectionName}Section`).classList.add('active');
    
    // Update page title
    document.getElementById('pageTitle').textContent = sectionName.charAt(0).toUpperCase() + sectionName.slice(1);
    
    currentSection = sectionName;
    
    // Load section-specific data
    switch(sectionName) {
        case 'attendance':
            loadAttendanceRecords();
            break;
        case 'calendar':
            renderCalendar();
            break;
        case 'leaves':
            loadLeaveRequests();
            loadLeaveBalance();
            break;
        case 'users':
            if (currentUser.role === 'admin') {
                loadUsers();
            }
            break;
        case 'reports':
            if (currentUser.role === 'admin') {
                loadReports();
            }
            break;
    }
}

async function loadDashboardData() {
    try {
        // Load today's attendance status
        await loadTodayStatus();
        
        // Load stats
        await loadMonthlyStats();
        
        // Load recent activity
        await loadRecentActivity();
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

async function loadTodayStatus() {
    try {
        const response = await apiCall('/api/attendance/today');
        const data = response.data;
        
        const statusElement = document.getElementById('todayStatus');
        const checkInBtn = document.getElementById('checkInBtn');
        const checkOutBtn = document.getElementById('checkOutBtn');
        
        if (data.hasCheckedIn && !data.hasCheckedOut) {
            statusElement.textContent = 'Checked In';
            statusElement.className = 'success';
            checkInBtn.disabled = true;
            checkOutBtn.disabled = false;
        } else if (data.hasCheckedOut) {
            statusElement.textContent = 'Completed';
            statusElement.className = 'success';
            checkInBtn.disabled = true;
            checkOutBtn.disabled = true;
        } else {
            statusElement.textContent = 'Not Checked In';
            statusElement.className = 'error';
            checkInBtn.disabled = false;
            checkOutBtn.disabled = true;
        }
    } catch (error) {
        console.error('Error loading today status:', error);
    }
}

async function loadMonthlyStats() {
    try {
        const startDate = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
        const endDate = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];
        
        const response = await apiCall(`/api/attendance?startDate=${startDate}&endDate=${endDate}`);
        const logs = response.data.logs;
        
        document.getElementById('monthlyAttendance').textContent = logs.length;
        
        // Calculate total hours this week
        const weekStart = getWeekStart(new Date());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        const weeklyLogs = logs.filter(log => {
            const logDate = new Date(log.date);
            return logDate >= weekStart && logDate <= weekEnd;
        });
        
        const totalHours = weeklyLogs.reduce((sum, log) => sum + (log.total_hours || 0), 0);
        document.getElementById('totalHours').textContent = totalHours.toFixed(1);
        
    } catch (error) {
        console.error('Error loading monthly stats:', error);
    }
}

async function loadRecentActivity() {
    try {
        const response = await apiCall('/api/attendance?startDate=' + new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
        const logs = response.data.logs.slice(0, 5);
        
        const activityList = document.getElementById('recentActivity');
        
        if (logs.length === 0) {
            activityList.innerHTML = '<div class="activity-item"><i class="fas fa-info-circle"></i><span>No recent activity</span></div>';
            return;
        }
        
        activityList.innerHTML = logs.map(log => `
            <div class="activity-item">
                <i class="fas fa-clock"></i>
                <span>${formatDate(log.date)}: ${log.check_in_time ? 'Checked in at ' + log.check_in_time : 'No check-in'}</span>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading recent activity:', error);
        document.getElementById('recentActivity').innerHTML = '<div class="activity-item"><i class="fas fa-exclamation-triangle"></i><span>Error loading activity</span></div>';
    }
}

// Attendance functions
async function checkIn() {
    try {
        await apiCall('/api/attendance/checkin', 'POST');
        showNotification('Checked in successfully!', 'success');
        await loadTodayStatus();
        await loadRecentActivity();
    } catch (error) {
        showNotification(error.message || 'Check-in failed', 'error');
    }
}

async function checkOut() {
    try {
        await apiCall('/api/attendance/checkout', 'POST');
        showNotification('Checked out successfully!', 'success');
        await loadTodayStatus();
        await loadRecentActivity();
    } catch (error) {
        showNotification(error.message || 'Check-out failed', 'error');
    }
}

async function loadAttendanceRecords() {
    try {
        const startDate = document.getElementById('attendanceStartDate').value;
        const endDate = document.getElementById('attendanceEndDate').value;
        
        let url = '/api/attendance';
        const params = new URLSearchParams();
        
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        
        if (params.toString()) {
            url += '?' + params.toString();
        }
        
        const response = await apiCall(url);
        const logs = response.data.logs;
        
        const tbody = document.getElementById('attendanceTableBody');
        
        if (logs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No attendance records found</td></tr>';
            return;
        }
        
        tbody.innerHTML = logs.map(log => `
            <tr>
                <td>${formatDate(log.date)}</td>
                <td>${log.check_in_time || '-'}</td>
                <td>${log.check_out_time || '-'}</td>
                <td>${log.total_hours ? log.total_hours.toFixed(2) + 'h' : '-'}</td>
                <td><span class="status-badge status-${log.status}">${log.status}</span></td>
                ${currentUser.role === 'admin' ? `<td>${log.first_name} ${log.last_name}</td>` : ''}
                ${currentUser.role === 'admin' ? `<td><button class="btn btn-sm btn-secondary" onclick="editAttendance(${log.id})">Edit</button></td>` : ''}
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error loading attendance records:', error);
    }
}

// Calendar functions
function renderCalendar() {
    const calendar = document.getElementById('calendarGrid');
    const monthElement = document.getElementById('currentMonth');
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    
    monthElement.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    
    // Clear calendar
    calendar.innerHTML = '';
    
    // Add day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-header';
        dayElement.textContent = day;
        calendar.appendChild(dayElement);
    });
    
    // Get first day of month and number of days
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day';
        calendar.appendChild(emptyDay);
    }
    
    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;
        
        const currentDate = new Date(currentYear, currentMonth, day);
        const today = new Date();
        
        // Mark today
        if (currentDate.toDateString() === today.toDateString()) {
            dayElement.classList.add('today');
        }
        
        // Mark weekends
        if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
            dayElement.classList.add('weekend');
        }
        
        calendar.appendChild(dayElement);
    }
}

function previousMonth() {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar();
}

function nextMonth() {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar();
}

// Calendar Event Functions
function showAddEventModal() {
    try {
        console.log('showAddEventModal called');
        const modal = document.getElementById('addEventModal');
        
        if (!modal) {
            console.error('Event modal element not found');
            showNotification('Event modal not found - please refresh the page', 'error');
            return;
        }
        
        modal.classList.add('show');
        
        // Set default event date to today
        const today = new Date().toISOString().split('T')[0];
        const eventDateField = document.getElementById('eventDate');
        if (eventDateField) {
            eventDateField.value = today;
        }
        
        showNotification('Opening Add Event modal...', 'info');
        
    } catch (error) {
        console.error('Error in showAddEventModal:', error);
        showNotification('Error opening event modal: ' + error.message, 'error');
    }
}

// Handle add event form submission
document.addEventListener('DOMContentLoaded', function() {
    const addEventForm = document.getElementById('addEventForm');
    if (addEventForm) {
        addEventForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            try {
                const formData = new FormData(this);
                const rawData = Object.fromEntries(formData);
                
                // Map form fields to API expected fields
                const eventData = {
                    date: rawData.event_date,
                    title: rawData.title,
                    description: rawData.description,
                    day_type: rawData.event_type,
                    is_working_day: rawData.event_type === 'holiday' ? 0 : 1
                };
                
                console.log('Event data to submit:', eventData);
                
                await apiCall('/api/calendar', 'POST', eventData);
                showNotification('Event added successfully!', 'success');
                closeModal('addEventModal');
                this.reset();
                
                if (currentSection === 'calendar') {
                    renderCalendar();
                }
                
            } catch (error) {
                showNotification(error.message || 'Failed to add event', 'error');
            }
        });
    }
});

// Leave functions
async function loadLeaveRequests() {
    try {
        const response = await apiCall('/api/leaves');
        const leaves = response.data.leaves;
        
        const tbody = document.getElementById('leavesTableBody');
        
        if (leaves.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No leave requests found</td></tr>';
            return;
        }
        
        tbody.innerHTML = leaves.map(leave => `
            <tr>
                <td>${leave.leave_type.replace('_', ' ')}</td>
                <td>${formatDate(leave.start_date)}</td>
                <td>${formatDate(leave.end_date)}</td>
                <td>${leave.total_days}</td>
                <td><span class="status-badge status-${leave.status}">${leave.status}</span></td>
                ${currentUser.role === 'admin' ? `<td>${leave.first_name} ${leave.last_name}</td>` : ''}
                <td>
                    ${leave.status === 'pending' ? `
                        <button class="btn btn-sm btn-secondary" onclick="editLeave(${leave.id})">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteLeave(${leave.id})">Delete</button>
                        ${currentUser.role === 'admin' ? `
                            <button class="btn btn-sm btn-success" onclick="approveLeave(${leave.id})">Approve</button>
                            <button class="btn btn-sm btn-danger" onclick="rejectLeave(${leave.id})">Reject</button>
                        ` : ''}
                    ` : '-'}
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error loading leave requests:', error);
    }
}

async function loadLeaveBalance() {
    try {
        const response = await apiCall('/api/leaves/balance');
        const summary = response.data.leaveSummary;
        
        const balanceElement = document.getElementById('leaveBalance');
        
        if (summary.length === 0) {
            balanceElement.innerHTML = '<div class="balance-item"><span>No leave data</span><span>-</span></div>';
            return;
        }
        
        balanceElement.innerHTML = summary.map(item => `
            <div class="balance-item">
                <span>${item.leave_type.replace('_', ' ')}</span>
                <span>${item.approved_days || 0} days</span>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading leave balance:', error);
    }
}

function showLeaveRequestModal() {
    document.getElementById('leaveRequestModal').classList.add('show');
    
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('startDate').min = today;
    document.getElementById('endDate').min = today;
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

// Handle leave request form submission
document.getElementById('leaveRequestForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    try {
        const formData = new FormData(this);
        const leaveData = Object.fromEntries(formData);
        
        await apiCall('/api/leaves', 'POST', leaveData);
        showNotification('Leave request submitted successfully!', 'success');
        closeModal('leaveRequestModal');
        this.reset();
        
        if (currentSection === 'leaves') {
            loadLeaveRequests();
            loadLeaveBalance();
        }
        
    } catch (error) {
        showNotification(error.message || 'Failed to submit leave request', 'error');
    }
});

// Leave approval functions (admin only)
async function approveLeave(leaveId) {
    try {
        console.log('Approving leave request:', leaveId);
        
        await apiCall(`/api/leaves/${leaveId}/status`, 'PUT', { status: 'approved' });
        showNotification('Leave request approved successfully!', 'success');
        
        if (currentSection === 'leaves') {
            loadLeaveRequests();
        }
        
    } catch (error) {
        console.error('Error approving leave:', error);
        showNotification(error.message || 'Failed to approve leave request', 'error');
    }
}

async function rejectLeave(leaveId) {
    const reason = prompt('Please provide a reason for rejection:');
    
    if (!reason || reason.trim() === '') {
        showNotification('Rejection reason is required', 'error');
        return;
    }
    
    try {
        console.log('Rejecting leave request:', leaveId, 'Reason:', reason);
        
        await apiCall(`/api/leaves/${leaveId}/status`, 'PUT', { 
            status: 'rejected',
            rejection_reason: reason.trim()
        });
        showNotification('Leave request rejected successfully!', 'success');
        
        if (currentSection === 'leaves') {
            loadLeaveRequests();
        }
        
    } catch (error) {
        console.error('Error rejecting leave:', error);
        showNotification(error.message || 'Failed to reject leave request', 'error');
    }
}

// Utility functions
async function apiCall(url, method = 'GET', data = null) {
    const token = localStorage.getItem('authToken');
    
    const options = {
        method,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };
    
    if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
    }
    
    const response = await fetch(url, options);
    const responseData = await response.json();
    
    if (!response.ok) {
        throw new Error(responseData.error || 'API call failed');
    }
    
    return { data: responseData };
}

function updateCurrentTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
    });
    document.getElementById('currentTime').textContent = timeString;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '15px 20px',
        borderRadius: '8px',
        color: 'white',
        fontWeight: '500',
        zIndex: '3000',
        animation: 'slideIn 0.3s ease-out'
    });
    
    // Set background color based on type
    switch(type) {
        case 'success':
            notification.style.background = '#48bb78';
            break;
        case 'error':
            notification.style.background = '#e53e3e';
            break;
        case 'warning':
            notification.style.background = '#ed8936';
            break;
        default:
            notification.style.background = '#667eea';
    }
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    
    sidebar.classList.toggle('show');
    mainContent.classList.toggle('expanded');
}

async function logout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/';
    }
}

// Set date inputs to current month by default
document.addEventListener('DOMContentLoaded', function() {
    const startDate = document.getElementById('attendanceStartDate');
    const endDate = document.getElementById('attendanceEndDate');
    
    if (startDate && endDate) {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        startDate.value = firstDay.toISOString().split('T')[0];
        endDate.value = lastDay.toISOString().split('T')[0];
    }
});

// Update pending leaves count
async function updatePendingLeavesCount() {
    try {
        const response = await apiCall('/api/leaves?status=pending');
        const pendingCount = response.data.leaves.length;
        document.getElementById('pendingLeaves').textContent = pendingCount;
    } catch (error) {
        console.error('Error loading pending leaves count:', error);
    }
}

// User Management Functions
function showAddUserModal() {
    try {
        console.log('showAddUserModal called'); // Debug log
        const modal = document.getElementById('addUserModal');
        
        if (!modal) {
            console.error('Modal element not found');
            showNotification('Modal not found - please refresh the page', 'error');
            return;
        }
        
        console.log('Adding show class to modal'); // Debug log
        modal.classList.add('show');
        
        // Set default hire date to today
        const today = new Date().toISOString().split('T')[0];
        const hireDateField = document.getElementById('hireDate');
        if (hireDateField) {
            hireDateField.value = today;
        }
        
        console.log('Modal should now be visible'); // Debug log
        
        // Add a notification to confirm the function was called
        showNotification('Opening Add User modal...', 'info');
        
    } catch (error) {
        console.error('Error in showAddUserModal:', error);
        showNotification('Error opening modal: ' + error.message, 'error');
    }
}

async function loadUsers() {
    try {
        const response = await apiCall('/api/users');
        const users = response.data.users;
        
        const tbody = document.getElementById('usersTableBody');
        
        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No users found</td></tr>';
            return;
        }
        
        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.employee_id}</td>
                <td>${user.first_name} ${user.last_name}</td>
                <td>${user.email}</td>
                <td>${user.department || '-'}</td>
                <td><span class="status-badge status-${user.role}">${user.role}</span></td>
                <td><span class="status-badge ${user.is_active ? 'status-approved' : 'status-rejected'}">${user.is_active ? 'Active' : 'Inactive'}</span></td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="editUser(${user.id})">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteUser(${user.id}, '${user.username}')">Delete</button>
                    <button class="btn btn-sm ${user.is_active ? 'btn-warning' : 'btn-success'}" onclick="toggleUserStatus(${user.id}, ${user.is_active})">
                        ${user.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error loading users:', error);
        document.getElementById('usersTableBody').innerHTML = '<tr><td colspan="7" class="text-center">Error loading users</td></tr>';
    }
}

// Handle add user form submission
document.addEventListener('DOMContentLoaded', function() {
    const addUserForm = document.getElementById('addUserForm');
    if (addUserForm) {
        console.log('Adding event listener to addUserForm');
        addUserForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('Add user form submitted');
            
            try {
                const formData = new FormData(this);
                const userData = Object.fromEntries(formData);
                console.log('User data to submit:', userData);
                
                // Check if all required fields are present
                const requiredFields = ['employee_id', 'username', 'email', 'password', 'first_name', 'last_name'];
                const missingFields = requiredFields.filter(field => !userData[field] || userData[field].trim() === '');
                
                if (missingFields.length > 0) {
                    console.log('Missing required fields:', missingFields);
                    showNotification(`Missing required fields: ${missingFields.join(', ')}`, 'error');
                    return;
                }
                
                // Validate password length
                if (userData.password.length < 6) {
                    console.log('Password too short:', userData.password.length);
                    showNotification('Password must be at least 6 characters long', 'error');
                    return;
                }
                
                console.log('Form validation passed, calling API...');
                
                console.log('Calling API to create user...');
                await apiCall('/api/users', 'POST', userData);
                console.log('User created successfully!');
                showNotification('User created successfully!', 'success');
                closeModal('addUserModal');
                this.reset();
                
                if (currentSection === 'users') {
                    loadUsers();
                }
                
            } catch (error) {
                console.error('Error creating user:', error);
                showNotification(error.message || 'Failed to create user', 'error');
            }
        });
    } else {
        console.error('addUserForm element not found!');
    }
    
    // Also check if Add User button exists
    const addUserButton = document.querySelector('button[onclick="showAddUserModal()"]');
    console.log('Add User button found:', addUserButton);
    
    // Handle edit user form submission
    const editUserForm = document.getElementById('editUserForm');
    if (editUserForm) {
        console.log('Adding event listener to editUserForm');
        editUserForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('Edit user form submitted');
            
            try {
                const formData = new FormData(this);
                const userData = Object.fromEntries(formData);
                const userId = userData.id;
                console.log('User data to update:', userData);
                
                // Remove empty password field if not changed
                if (!userData.password || userData.password.trim() === '') {
                    delete userData.password;
                }
                
                // Remove id from userData as it should be in URL
                delete userData.id;
                
                // Check if all required fields are present
                const requiredFields = ['employee_id', 'username', 'email', 'first_name', 'last_name'];
                const missingFields = requiredFields.filter(field => !userData[field] || userData[field].trim() === '');
                
                if (missingFields.length > 0) {
                    console.log('Missing required fields:', missingFields);
                    showNotification(`Missing required fields: ${missingFields.join(', ')}`, 'error');
                    return;
                }
                
                // Validate password length if provided
                if (userData.password && userData.password.length < 6) {
                    console.log('Password too short:', userData.password.length);
                    showNotification('Password must be at least 6 characters long', 'error');
                    return;
                }
                
                console.log('Form validation passed, calling API...');
                
                console.log('Calling API to update user...');
                await apiCall(`/api/users/${userId}`, 'PUT', userData);
                console.log('User updated successfully!');
                showNotification('User updated successfully!', 'success');
                closeModal('editUserModal');
                
                if (currentSection === 'users') {
                    loadUsers();
                }
                
            } catch (error) {
                console.error('Error updating user:', error);
                showNotification(error.message || 'Failed to update user', 'error');
            }
        });
    } else {
        console.error('editUserForm element not found!');
    }
});

async function editUser(userId) {
    try {
        console.log('Attempting to edit user with ID:', userId);
        
        // Check if all required DOM elements exist
        const requiredElements = ['editUserId', 'editEmployeeId', 'editUsername', 'editEmail', 'editPassword', 'editFirstName', 'editLastName', 'editUserRole', 'editDepartment', 'editPosition', 'editHireDate'];
        const missingElements = requiredElements.filter(id => !document.getElementById(id));
        
        if (missingElements.length > 0) {
            throw new Error(`Missing DOM elements: ${missingElements.join(', ')}`);
        }
        
        const response = await apiCall(`/api/users/${userId}`);
        console.log('API response:', response);
        const user = response.data.user;
        console.log('User data:', user);
        
        if (!user) {
            throw new Error('User data not found in response');
        }
        
        // Populate edit form
        document.getElementById('editUserId').value = user.id;
        document.getElementById('editEmployeeId').value = user.employee_id;
        document.getElementById('editUsername').value = user.username;
        document.getElementById('editEmail').value = user.email;
        document.getElementById('editPassword').value = ''; // Leave password empty
        document.getElementById('editFirstName').value = user.first_name;
        document.getElementById('editLastName').value = user.last_name;
        document.getElementById('editUserRole').value = user.role;
        document.getElementById('editDepartment').value = user.department || '';
        document.getElementById('editPosition').value = user.position || '';
        document.getElementById('editHireDate').value = user.hire_date ? user.hire_date.split('T')[0] : '';
        
        console.log('Form populated successfully');
        
        // Show edit modal
        const modal = document.getElementById('editUserModal');
        if (!modal) {
            throw new Error('Edit user modal not found');
        }
        modal.classList.add('show');
        
    } catch (error) {
        console.error('Error in editUser function:', error);
        showNotification('Error loading user details: ' + error.message, 'error');
    }
}

async function deleteUser(userId, username) {
    if (!confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
        return;
    }
    
    try {
        await apiCall(`/api/users/${userId}`, 'DELETE');
        showNotification('User deleted successfully!', 'success');
        
        if (currentSection === 'users') {
            loadUsers();
        }
        
    } catch (error) {
        showNotification(error.message || 'Failed to delete user', 'error');
    }
}

async function toggleUserStatus(userId, currentStatus) {
    const action = currentStatus ? 'deactivate' : 'activate';
    
    if (!confirm(`Are you sure you want to ${action} this user?`)) {
        return;
    }
    
    try {
        await apiCall(`/api/users/${userId}`, 'PUT', { is_active: !currentStatus });
        showNotification(`User ${action}d successfully!`, 'success');
        
        if (currentSection === 'users') {
            loadUsers();
        }
        
    } catch (error) {
        showNotification(error.message || `Failed to ${action} user`, 'error');
    }
}

// Reports Functions (Admin only)
async function loadReports() {
    try {
        // Use the new reports API endpoint
        const response = await apiCall('/api/reports/stats');
        const stats = response.data;
        
        // Update attendance statistics
        document.getElementById('totalEmployees').textContent = stats.attendance.totalEmployees;
        document.getElementById('presentToday').textContent = stats.attendance.presentToday;
        document.getElementById('absentToday').textContent = stats.attendance.absentToday;
        document.getElementById('avgHoursPerDay').textContent = stats.attendance.avgHoursPerDay;
        
        // Update leave statistics
        document.getElementById('pendingRequests').textContent = stats.leaves.pendingRequests;
        document.getElementById('approvedThisMonth').textContent = stats.leaves.approvedThisMonth;
        document.getElementById('totalLeaveDays').textContent = stats.leaves.totalLeaveDays;
        
        // Update monthly statistics
        document.getElementById('workingDays').textContent = stats.monthly.workingDays;
        document.getElementById('totalHours').textContent = stats.monthly.totalHours;
        document.getElementById('overtimeHours').textContent = stats.monthly.overtimeHours;
        
    } catch (error) {
        console.error('Error loading reports:', error);
        showNotification('Error loading report statistics', 'error');
    }
}

async function generateReport() {
    showNotification('Report generation feature can be implemented to export data as PDF/Excel', 'info');
}

// Enhanced Report Generation Functions
async function refreshReportStats() {
    try {
        showNotification('Refreshing report statistics...', 'info');
        await loadReports();
        showNotification('Statistics refreshed successfully!', 'success');
    } catch (error) {
        console.error('Error refreshing stats:', error);
        showNotification('Failed to refresh statistics', 'error');
    }
}

function updateReportOptions() {
    const reportType = document.getElementById('reportType').value;
    const employeeFilter = document.getElementById('employeeFilter');
    
    // Show/hide employee filter based on report type
    if (reportType === 'attendance' || reportType === 'timesheet') {
        employeeFilter.style.display = 'block';
        loadEmployeeOptions();
    } else {
        employeeFilter.style.display = 'none';
    }
}

function updateDateRange() {
    const period = document.getElementById('reportPeriod').value;
    const customRange = document.getElementById('customDateRange');
    const startDateInput = document.getElementById('reportStartDate');
    const endDateInput = document.getElementById('reportEndDate');
    
    if (period === 'custom') {
        customRange.style.display = 'block';
    } else {
        customRange.style.display = 'none';
        
        // Set predefined date ranges
        const today = new Date();
        let startDate, endDate;
        
        switch (period) {
            case 'today':
                startDate = endDate = today.toISOString().split('T')[0];
                break;
            case 'week':
                const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
                const weekEnd = new Date(today.setDate(today.getDate() - today.getDay() + 6));
                startDate = weekStart.toISOString().split('T')[0];
                endDate = weekEnd.toISOString().split('T')[0];
                break;
            case 'month':
                startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
                endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
                break;
            case 'quarter':
                const quarter = Math.floor(today.getMonth() / 3);
                startDate = new Date(today.getFullYear(), quarter * 3, 1).toISOString().split('T')[0];
                endDate = new Date(today.getFullYear(), quarter * 3 + 3, 0).toISOString().split('T')[0];
                break;
            case 'year':
                startDate = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
                endDate = new Date(today.getFullYear(), 11, 31).toISOString().split('T')[0];
                break;
        }
        
        startDateInput.value = startDate;
        endDateInput.value = endDate;
    }
}

async function loadEmployeeOptions() {
    try {
        const response = await apiCall('/api/users');
        const employees = response.data.users;
        const select = document.getElementById('reportEmployee');
        
        // Clear existing options except "All Employees"
        select.innerHTML = '<option value="">All Employees</option>';
        
        employees.forEach(emp => {
            const option = document.createElement('option');
            option.value = emp.id;
            option.textContent = `${emp.first_name} ${emp.last_name} (${emp.employee_id})`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading employees:', error);
    }
}

async function generateReport(format) {
    const reportType = document.getElementById('reportType').value;
    const period = document.getElementById('reportPeriod').value;
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;
    const employeeId = document.getElementById('reportEmployee').value;
    const department = document.getElementById('reportDepartment').value;
    
    if (!startDate || !endDate) {
        showNotification('Please select a valid date range', 'error');
        return;
    }
    
    try {
        showNotification(`Generating ${format.toUpperCase()} report...`, 'info');
        
        // Get report data based on type
        let reportData;
        switch (reportType) {
            case 'attendance':
                reportData = await generateAttendanceReport(startDate, endDate, employeeId, department);
                break;
            case 'employee':
                reportData = await generateEmployeeReport(department);
                break;
            case 'leaves':
                reportData = await generateLeaveReport(startDate, endDate, employeeId, department);
                break;
            case 'summary':
                reportData = await generateSummaryReport(startDate, endDate, department);
                break;
            case 'timesheet':
                reportData = await generateTimesheetReport(startDate, endDate, employeeId, department);
                break;
            default:
                throw new Error('Invalid report type');
        }
        
        if (format === 'pdf') {
            await downloadPDFReport(reportData, reportType);
        } else if (format === 'excel') {
            await downloadExcelReport(reportData, reportType);
        }
        
        showNotification(`${format.toUpperCase()} report generated successfully!`, 'success');
        
    } catch (error) {
        console.error('Error generating report:', error);
        showNotification(`Failed to generate ${format} report: ${error.message}`, 'error');
    }
}

async function previewReport() {
    const reportType = document.getElementById('reportType').value;
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;
    const employeeId = document.getElementById('reportEmployee').value;
    const department = document.getElementById('reportDepartment').value;
    
    if (!startDate || !endDate) {
        showNotification('Please select a valid date range', 'error');
        return;
    }
    
    try {
        showNotification('Generating report preview...', 'info');
        
        // Show loading in preview
        const previewContent = document.getElementById('reportPreviewContent');
        previewContent.innerHTML = `
            <div class="report-loading">
                <div class="spinner"></div>
                <p>Loading report preview...</p>
            </div>
        `;
        document.getElementById('reportPreview').style.display = 'block';
        
        // Get report data
        let reportData;
        switch (reportType) {
            case 'attendance':
                reportData = await generateAttendanceReport(startDate, endDate, employeeId, department);
                break;
            case 'employee':
                reportData = await generateEmployeeReport(department);
                break;
            case 'leaves':
                reportData = await generateLeaveReport(startDate, endDate, employeeId, department);
                break;
            case 'summary':
                reportData = await generateSummaryReport(startDate, endDate, department);
                break;
            case 'timesheet':
                reportData = await generateTimesheetReport(startDate, endDate, employeeId, department);
                break;
        }
        
        // Display preview
        displayReportPreview(reportData, reportType);
        showNotification('Report preview loaded successfully!', 'success');
        
    } catch (error) {
        console.error('Error generating preview:', error);
        showNotification(`Failed to generate preview: ${error.message}`, 'error');
        document.getElementById('reportPreview').style.display = 'none';
    }
}

function closeReportPreview() {
    document.getElementById('reportPreview').style.display = 'none';
}

// Report Data Generation Functions
async function generateAttendanceReport(startDate, endDate, employeeId, department) {
    const params = new URLSearchParams({
        startDate,
        endDate
    });
    
    if (employeeId) params.append('employeeId', employeeId);
    if (department) params.append('department', department);
    
    const response = await apiCall(`/api/reports/attendance?${params}`);
    return response.data;
}

async function generateEmployeeReport(department) {
    const params = new URLSearchParams();
    if (department) params.append('department', department);
    
    const response = await apiCall(`/api/reports/employees?${params}`);
    return response.data;
}

async function generateLeaveReport(startDate, endDate, employeeId, department) {
    const params = new URLSearchParams({
        startDate,
        endDate
    });
    
    if (employeeId) params.append('employeeId', employeeId);
    if (department) params.append('department', department);
    
    const response = await apiCall(`/api/reports/leaves?${params}`);
    return response.data;
}

async function generateSummaryReport(startDate, endDate, department) {
    // Get data from multiple endpoints and combine
    const [attendanceResp, employeeResp, leaveResp] = await Promise.all([
        apiCall(`/api/reports/attendance?startDate=${startDate}&endDate=${endDate}${department ? '&department=' + department : ''}`),
        apiCall(`/api/reports/employees${department ? '?department=' + department : ''}`),
        apiCall(`/api/reports/leaves?startDate=${startDate}&endDate=${endDate}${department ? '&department=' + department : ''}`)
    ]);
    
    const attendanceData = attendanceResp.data;
    const employeeData = employeeResp.data;
    const leaveData = leaveResp.data;
    
    // Create department-wise summary
    const departments = {};
    
    employeeData.data.forEach(emp => {
        const dept = emp.department;
        if (!departments[dept]) {
            departments[dept] = {
                employees: 0,
                present: 0,
                totalHours: 0,
                leaves: 0
            };
        }
        departments[dept].employees++;
    });
    
    attendanceData.data.forEach(att => {
        const dept = att.department;
        if (departments[dept]) {
            if (att.status !== 'Absent') {
                departments[dept].present++;
            }
            departments[dept].totalHours += parseFloat(att.totalHours || 0);
        }
    });
    
    leaveData.data.forEach(leave => {
        const dept = leave.department;
        if (departments[dept]) {
            departments[dept].leaves++;
        }
    });
    
    const summaryData = Object.entries(departments).map(([dept, stats]) => ({
        department: dept,
        totalEmployees: stats.employees,
        attendanceDays: stats.present,
        totalHours: stats.totalHours.toFixed(2),
        leavesTaken: stats.leaves,
        avgHoursPerEmployee: (stats.totalHours / stats.employees).toFixed(2)
    }));
    
    return {
        title: 'Summary Report',
        period: `${startDate} to ${endDate}`,
        data: summaryData,
        summary: {
            totalEmployees: employeeData.summary.totalEmployees,
            totalAttendanceDays: attendanceData.summary.presentDays,
            totalHours: attendanceData.summary.totalHours,
            totalLeaves: leaveData.summary.totalRequests
        }
    };
}

async function generateTimesheetReport(startDate, endDate, employeeId, department) {
    // Timesheet is essentially detailed attendance report
    return await generateAttendanceReport(startDate, endDate, employeeId, department);
}

// Report Display and Download Functions
function displayReportPreview(reportData, reportType) {
    const content = document.getElementById('reportPreviewContent');
    
    let html = `
        <div class="report-header">
            <h1>${reportData.title}</h1>
            <div class="report-meta">
                <p>Period: ${reportData.period}</p>
                <p>Generated: ${new Date().toLocaleString()}</p>
            </div>
        </div>
    `;
    
    // Add summary if available
    if (reportData.summary) {
        html += '<div class="report-summary">';
        for (const [key, value] of Object.entries(reportData.summary)) {
            const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            html += `
                <div class="summary-card">
                    <div class="value">${value}</div>
                    <div class="label">${label}</div>
                </div>
            `;
        }
        html += '</div>';
    }
    
    // Add data table
    if (reportData.data && reportData.data.length > 0) {
        html += '<table class="report-table"><thead><tr>';
        
        // Generate headers
        const headers = Object.keys(reportData.data[0]);
        headers.forEach(header => {
            const displayHeader = header.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            html += `<th>${displayHeader}</th>`;
        });
        html += '</tr></thead><tbody>';
        
        // Generate rows
        reportData.data.forEach(row => {
            html += '<tr>';
            headers.forEach(header => {
                html += `<td>${row[header] || 'N/A'}</td>`;
            });
            html += '</tr>';
        });
        html += '</tbody></table>';
    } else {
        html += '<p>No data available for the selected criteria.</p>';
    }
    
    content.innerHTML = html;
}

async function downloadPDFReport(reportData, reportType) {
    // For now, we'll create a simple PDF using the browser's print functionality
    // In a production environment, you'd want to use a proper PDF library
    
    const printWindow = window.open('', '_blank');
    const printContent = generatePrintableReport(reportData, reportType);
    
    printWindow.document.write(`
        <html>
            <head>
                <title>${reportData.title}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .report-header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
                    .report-summary { display: flex; justify-content: space-around; margin-bottom: 30px; }
                    .summary-card { text-align: center; padding: 10px; border: 1px solid #ddd; }
                    .summary-card .value { font-size: 24px; font-weight: bold; }
                    .summary-card .label { font-size: 12px; color: #666; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f5f5f5; font-weight: bold; }
                    tr:nth-child(even) { background-color: #f9f9f9; }
                    @media print { 
                        body { margin: 0; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>${printContent}</body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
}

async function downloadExcelReport(reportData, reportType) {
    // Create CSV format for Excel compatibility
    let csvContent = `${reportData.title}\n`;
    csvContent += `Period: ${reportData.period}\n`;
    csvContent += `Generated: ${new Date().toLocaleString()}\n\n`;
    
    // Add summary
    if (reportData.summary) {
        csvContent += "Summary:\n";
        for (const [key, value] of Object.entries(reportData.summary)) {
            const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            csvContent += `${label},${value}\n`;
        }
        csvContent += "\n";
    }
    
    // Add data
    if (reportData.data && reportData.data.length > 0) {
        const headers = Object.keys(reportData.data[0]);
        csvContent += headers.map(h => h.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())).join(',') + '\n';
        
        reportData.data.forEach(row => {
            csvContent += headers.map(header => `"${row[header] || ''}"`).join(',') + '\n';
        });
    }
    
    // Download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

function generatePrintableReport(reportData, reportType) {
    let html = `
        <div class="report-header">
            <h1>${reportData.title}</h1>
            <p>Period: ${reportData.period}</p>
            <p>Generated: ${new Date().toLocaleString()}</p>
        </div>
    `;
    
    if (reportData.summary) {
        html += '<div class="report-summary">';
        for (const [key, value] of Object.entries(reportData.summary)) {
            const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            html += `
                <div class="summary-card">
                    <div class="value">${value}</div>
                    <div class="label">${label}</div>
                </div>
            `;
        }
        html += '</div>';
    }
    
    if (reportData.data && reportData.data.length > 0) {
        html += '<table><thead><tr>';
        const headers = Object.keys(reportData.data[0]);
        headers.forEach(header => {
            const displayHeader = header.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            html += `<th>${displayHeader}</th>`;
        });
        html += '</tr></thead><tbody>';
        
        reportData.data.forEach(row => {
            html += '<tr>';
            headers.forEach(header => {
                html += `<td>${row[header] || 'N/A'}</td>`;
            });
            html += '</tr>';
        });
        html += '</tbody></table>';
    }
    
    return html;
}

// Initialize report options on page load
document.addEventListener('DOMContentLoaded', function() {
    // Set default dates
    updateDateRange();
    updateReportOptions();
});

// Debug function to test modal functionality
window.debugModal = function() {
    console.log('=== Modal Debug Test ===');
    
    // Check if modal element exists
    const modal = document.getElementById('addUserModal');
    console.log('Modal element:', modal);
    
    if (!modal) {
        console.error('Modal element not found!');
        return;
    }
    
    // Check modal current classes
    console.log('Modal classes before:', modal.className);
    
    // Try to show modal
    modal.classList.add('show');
    console.log('Modal classes after adding show:', modal.className);
    
    // Check computed styles
    const styles = window.getComputedStyle(modal);
    console.log('Modal display style:', styles.display);
    console.log('Modal z-index:', styles.zIndex);
    
    // Test showAddUserModal function
    try {
        showAddUserModal();
        console.log('showAddUserModal() executed successfully');
    } catch (error) {
        console.error('Error in showAddUserModal():', error);
    }
    
    console.log('=== End Debug Test ===');
};

// Test function to check user creation API
window.testUserCreation = async function() {
    console.log('=== Testing User Creation API ===');
    
    const testUserData = {
        employee_id: 'TEST001',
        username: 'testuser' + Date.now(),
        email: 'test@example.com',
        password: 'password123',
        first_name: 'Test',
        last_name: 'User',
        role: 'employee',
        department: 'IT',
        position: 'Developer'
    };
    
    try {
        console.log('Sending test user data:', testUserData);
        const response = await apiCall('/api/users', 'POST', testUserData);
        console.log('User creation successful:', response);
        showNotification('Test user created successfully!', 'success');
    } catch (error) {
        console.error('User creation failed:', error);
        showNotification('Test user creation failed: ' + error.message, 'error');
    }
    
    console.log('=== End User Creation Test ===');
};
