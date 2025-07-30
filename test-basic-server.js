const express = require('express');
const path = require('path');

console.log('Creating basic Express server...');

const app = express();
const PORT = 3000;

// Basic middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Test route
app.get('/test', (req, res) => {
    res.json({ message: 'Server is working!' });
});

// Basic auth test route
app.post('/api/auth/login', (req, res) => {
    console.log('Login request received:', req.body);
    res.json({ 
        message: 'Test login endpoint working',
        token: 'test-token',
        user: { username: 'test' }
    });
});

// Serve login page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.listen(PORT, () => {
    console.log(`Test server running on port ${PORT}`);
    console.log(`Access: http://localhost:${PORT}`);
});

console.log('Server setup complete.');
