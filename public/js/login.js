 // Login functionality
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    const errorMessage = document.getElementById('errorMessage');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const serverStatus = document.getElementById('serverStatus');
    const statusIcon = document.getElementById('statusIcon');
    const statusText = document.getElementById('statusText');
    const serverInstructions = document.getElementById('serverInstructions');

    // Ensure inputs are enabled and focusable
    usernameInput.disabled = false;
    passwordInput.disabled = false;
    usernameInput.readOnly = false;
    passwordInput.readOnly = false;

    // Simple focus on account ID field
    function setFocusOnAccountId() {
        try {
            usernameInput.focus();
        } catch (e) {
            console.log('Focus failed:', e);
        }
    }
    
    // Set focus after DOM is fully loaded
    setTimeout(setFocusOnAccountId, 50);

    // Check if user is already logged in
    checkAuthStatus();
    
    // Check server status
    checkServerStatus();

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (!username || !password) {
            showError('Please enter both username and password');
            return;
        }

        setLoadingState(true);
        hideError();

        try {
            // Add a timeout to the fetch request
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers.get('content-type'));

            // Check if server is returning HTML (common when server is misconfigured)
            const contentType = response.headers.get('content-type');
            if (!contentType) {
                throw new Error('Server returned no content-type header');
            }
            
            if (contentType.includes('text/html')) {
                throw new Error('Server returned HTML instead of JSON. Server may not be configured correctly.');
            }
            
            if (!contentType.includes('application/json')) {
                throw new Error(`Server returned ${contentType} instead of JSON`);
            }

            const data = await response.json();
            console.log('Response data:', data);

            if (response.ok) {
                // Store token in localStorage
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                // Redirect to dashboard
                window.location.href = '/dashboard';
            } else {
                showError(data.error || `Login failed (${response.status})`);
            }
        } catch (error) {
            console.error('Login error:', error);
            
            // More specific error messages
            if (error.name === 'AbortError') {
                showError('Request timeout. Server is taking too long to respond.');
                showServerInstructions();
            } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
                showError('Cannot connect to server. Please start the server first.');
                showServerInstructions();
            } else if (error.message.includes('HTML instead of JSON')) {
                showError('Server configuration error. Please restart the server.');
                showServerInstructions();
            } else if (error.message.includes('content-type')) {
                showError('Server response error. Check if the server is running correctly.');
                showServerInstructions();
            } else {
                showError(`Error: ${error.message}`);
                showServerInstructions();
            }
        } finally {
            setLoadingState(false);
        }
    });

    async function checkServerStatus() {
        try {
            serverStatus.style.display = 'block';
            statusIcon.textContent = '🟡';
            statusText.textContent = 'Checking server status...';
            
            const response = await fetch('/api/auth/me', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            // Server is responding
            statusIcon.textContent = '🟢';
            statusText.textContent = 'Server is running';
            serverInstructions.style.display = 'none';
            
            // Hide status after 3 seconds if server is running
            setTimeout(() => {
                serverStatus.style.display = 'none';
            }, 3000);
            
        } catch (error) {
            // Server is not responding
            statusIcon.textContent = '🔴';
            statusText.textContent = 'Server is not running';
            serverInstructions.style.display = 'block';
        }
    }

    async function checkAuthStatus() {
        const token = localStorage.getItem('authToken');
        if (token) {
            try {
                const response = await fetch('/api/auth/me', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    window.location.href = '/dashboard';
                }
            } catch (error) {
                // Token is invalid, clear it
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
            }
        }
    }

    function setLoadingState(loading) {
        if (loading) {
            loginBtn.classList.add('loading');
            loginBtn.disabled = true;
        } else {
            loginBtn.classList.remove('loading');
            loginBtn.disabled = false;
        }
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }

    function hideError() {
        errorMessage.style.display = 'none';
    }
    
    function showServerInstructions() {
        serverStatus.style.display = 'block';
        statusIcon.textContent = '🔴';
        statusText.textContent = 'Server is not running';
        serverInstructions.style.display = 'block';
    }
});

function togglePassword() {
    const passwordInput = document.getElementById('password');
    const passwordIcon = document.getElementById('passwordIcon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        passwordIcon.classList.remove('fa-eye');
        passwordIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        passwordIcon.classList.remove('fa-eye-slash');
        passwordIcon.classList.add('fa-eye');
    }
}
