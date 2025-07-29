const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const database = require('../config/database');

const router = express.Router();

// Get report statistics
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const db = database.getDB();
        
        // Get total users
        const totalUsers = await new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM users WHERE is_active = 1', (err, result) => {
                if (err) reject(err);
                else resolve(result.count);
            });
        });
        
        // Get today's attendance
        const today = new Date().toISOString().split('T')[0];
        const todayAttendance = await new Promise((resolve, reject) => {
            db.all(`
                SELECT u.id, u.first_name, u.last_name, u.department,
                       a.check_in_time, a.check_out_time, a.total_hours
                FROM users u
                LEFT JOIN attendance a ON u.id = a.user_id AND DATE(a.date) = ?
                WHERE u.is_active = 1
            `, [today], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
        
        const presentToday = todayAttendance.filter(record => record.check_in_time).length;
        const absentToday = totalUsers - presentToday;
        const totalHoursToday = todayAttendance.reduce((sum, record) => sum + (record.total_hours || 0), 0);
        const avgHoursPerDay = presentToday > 0 ? (totalHoursToday / presentToday) : 0;
        
        // Get leave statistics
        const leaveStats = await new Promise((resolve, reject) => {
            const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
            const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];
            
            db.all(`
                SELECT status, COUNT(*) as count, SUM(days_requested) as total_days
                FROM leaves
                WHERE DATE(start_date) >= ? AND DATE(end_date) <= ?
                GROUP BY status
            `, [startOfMonth, endOfMonth], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
        
        const pendingRequests = leaveStats.find(stat => stat.status === 'pending')?.count || 0;
        const approvedThisMonth = leaveStats.find(stat => stat.status === 'approved')?.count || 0;
        const totalLeaveDays = leaveStats.find(stat => stat.status === 'approved')?.total_days || 0;
        
        // Get monthly attendance statistics
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
        const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];
        
        const monthlyStats = await new Promise((resolve, reject) => {
            db.all(`
                SELECT DATE(date) as work_date, COUNT(*) as present_count, SUM(total_hours) as daily_hours
                FROM attendance
                WHERE DATE(date) >= ? AND DATE(date) <= ? AND check_in_time IS NOT NULL
                GROUP BY DATE(date)
            `, [startOfMonth, endOfMonth], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
        
        const workingDays = monthlyStats.length;
        const totalHours = monthlyStats.reduce((sum, day) => sum + (day.daily_hours || 0), 0);
        const standardHours = workingDays * 8 * totalUsers;
        const overtimeHours = Math.max(0, totalHours - standardHours);
        
        res.json({
            attendance: {
                totalEmployees: totalUsers,
                presentToday,
                absentToday,
                avgHoursPerDay: avgHoursPerDay.toFixed(1)
            },
            leaves: {
                pendingRequests,
                approvedThisMonth,
                totalLeaveDays
            },
            monthly: {
                workingDays,
                totalHours: totalHours.toFixed(1),
                overtimeHours: overtimeHours.toFixed(1)
            }
        });
        
    } catch (error) {
        console.error('Error fetching report stats:', error);
        res.status(500).json({ error: 'Failed to fetch report statistics' });
    }
});

// Generate attendance report data
router.get('/attendance', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { startDate, endDate, employeeId, department } = req.query;
        
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }
        
        const db = database.getDB();
        
        let query = `
            SELECT u.id, u.employee_id, u.first_name, u.last_name, u.department,
                   a.date, a.check_in_time, a.check_out_time, a.total_hours
            FROM users u
            LEFT JOIN attendance a ON u.id = a.user_id 
                AND DATE(a.date) >= ? AND DATE(a.date) <= ?
            WHERE u.is_active = 1
        `;
        
        const params = [startDate, endDate];
        
        if (employeeId) {
            query += ' AND u.id = ?';
            params.push(employeeId);
        }
        
        if (department) {
            query += ' AND u.department = ?';
            params.push(department);
        }
        
        query += ' ORDER BY a.date DESC, u.last_name, u.first_name';
        
        const attendanceData = await new Promise((resolve, reject) => {
            db.all(query, params, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
        
        const formattedData = attendanceData.map(record => ({
            date: record.date ? new Date(record.date).toLocaleDateString() : 'N/A',
            employeeId: record.employee_id,
            employeeName: `${record.first_name} ${record.last_name}`,
            department: record.department || 'N/A',
            checkIn: record.check_in_time ? new Date(record.check_in_time).toLocaleTimeString() : 'Not checked in',
            checkOut: record.check_out_time ? new Date(record.check_out_time).toLocaleTimeString() : 'Not checked out',
            totalHours: (record.total_hours || 0).toFixed(2),
            status: record.check_in_time ? (record.check_out_time ? 'Complete' : 'Incomplete') : 'Absent'
        }));
        
        const summary = {
            totalRecords: formattedData.length,
            presentDays: formattedData.filter(d => d.status !== 'Absent').length,
            absentDays: formattedData.filter(d => d.status === 'Absent').length,
            totalHours: formattedData.reduce((sum, d) => sum + parseFloat(d.totalHours), 0).toFixed(2)
        };
        
        res.json({
            title: 'Attendance Report',
            period: `${startDate} to ${endDate}`,
            data: formattedData,
            summary
        });
        
    } catch (error) {
        console.error('Error generating attendance report:', error);
        res.status(500).json({ error: 'Failed to generate attendance report' });
    }
});

// Generate employee report data
router.get('/employees', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { department } = req.query;
        const db = database.getDB();
        
        let query = `
            SELECT employee_id, first_name, last_name, email, department, position, role, hire_date, is_active
            FROM users
        `;
        
        const params = [];
        
        if (department) {
            query += ' WHERE department = ?';
            params.push(department);
        }
        
        query += ' ORDER BY last_name, first_name';
        
        const employees = await new Promise((resolve, reject) => {
            db.all(query, params, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
        
        const formattedData = employees.map(emp => ({
            employeeId: emp.employee_id,
            name: `${emp.first_name} ${emp.last_name}`,
            email: emp.email,
            department: emp.department || 'N/A',
            position: emp.position || 'N/A',
            role: emp.role,
            hireDate: emp.hire_date ? new Date(emp.hire_date).toLocaleDateString() : 'N/A',
            status: emp.is_active ? 'Active' : 'Inactive'
        }));
        
        const summary = {
            totalEmployees: formattedData.length,
            activeEmployees: formattedData.filter(e => e.status === 'Active').length,
            departments: [...new Set(formattedData.map(e => e.department))].length
        };
        
        res.json({
            title: 'Employee Report',
            period: 'Current',
            data: formattedData,
            summary
        });
        
    } catch (error) {
        console.error('Error generating employee report:', error);
        res.status(500).json({ error: 'Failed to generate employee report' });
    }
});

// Generate leave report data
router.get('/leaves', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { startDate, endDate, employeeId, department } = req.query;
        
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }
        
        const db = database.getDB();
        
        let query = `
            SELECT l.*, u.employee_id, u.first_name, u.last_name, u.department
            FROM leaves l
            JOIN users u ON l.user_id = u.id
            WHERE DATE(l.start_date) >= ? AND DATE(l.end_date) <= ?
        `;
        
        const params = [startDate, endDate];
        
        if (employeeId) {
            query += ' AND l.user_id = ?';
            params.push(employeeId);
        }
        
        if (department) {
            query += ' AND u.department = ?';
            params.push(department);
        }
        
        query += ' ORDER BY l.created_at DESC';
        
        const leaves = await new Promise((resolve, reject) => {
            db.all(query, params, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
        
        const formattedData = leaves.map(leave => ({
            employeeId: leave.employee_id,
            employeeName: `${leave.first_name} ${leave.last_name}`,
            department: leave.department || 'N/A',
            leaveType: leave.leave_type,
            startDate: new Date(leave.start_date).toLocaleDateString(),
            endDate: new Date(leave.end_date).toLocaleDateString(),
            days: leave.days_requested,
            reason: leave.reason,
            status: leave.status,
            appliedDate: new Date(leave.created_at).toLocaleDateString()
        }));
        
        const summary = {
            totalRequests: formattedData.length,
            approved: formattedData.filter(l => l.status === 'approved').length,
            pending: formattedData.filter(l => l.status === 'pending').length,
            rejected: formattedData.filter(l => l.status === 'rejected').length,
            totalDays: formattedData.reduce((sum, l) => sum + l.days, 0)
        };
        
        res.json({
            title: 'Leave Report',
            period: `${startDate} to ${endDate}`,
            data: formattedData,
            summary
        });
        
    } catch (error) {
        console.error('Error generating leave report:', error);
        res.status(500).json({ error: 'Failed to generate leave report' });
    }
});

module.exports = router;
