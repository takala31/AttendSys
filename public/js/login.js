// Login functionality
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    const errorMessage = document.getElementById('errorMessage');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');

    // Ensure inputs are enabled and focusable
    usernameInput.disabled = false;
    passwordInput.disabled = false;
    usernameInput.readOnly = false;
    passwordInput.readOnly = false;

    // Focus on username field
    setTimeout(() => {
        usernameInput.focus();
    }, 100);

    // Check if user is already logged in
    checkAuthStatus();

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
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Store token in localStorage
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                // Redirect to dashboard
                window.location.href = '/dashboard';
            } else {
                showError(data.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            showError('Network error. Please try again.');
        } finally {
            setLoadingState(false);
        }
    });

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
