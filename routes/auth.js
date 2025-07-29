const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const database = require('../config/database');

const router = express.Router();

// Rate limiting for login attempts
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: { error: 'Too many login attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Login route
router.post('/login', loginLimiter, (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    const db = database.getDB();
    const query = `
        SELECT id, employee_id, username, email, password, first_name, last_name, role, department, position, is_active
        FROM users 
        WHERE (username = ? OR email = ?) AND is_active = 1
    `;

    db.get(query, [username, username], async (err, user) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        try {
            const passwordMatch = await bcrypt.compare(password, user.password);
            
            if (!passwordMatch) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Create JWT token
            const token = jwt.sign(
                { 
                    id: user.id, 
                    username: user.username, 
                    role: user.role,
                    employee_id: user.employee_id 
                },
                process.env.JWT_SECRET || 'jwt_secret_key',
                { expiresIn: '24h' }
            );

            // Set session
            req.session.userId = user.id;
            req.session.userRole = user.role;

            // Remove password from response
            const { password: _, ...userWithoutPassword } = user;

            res.json({
                message: 'Login successful',
                token,
                user: userWithoutPassword
            });

        } catch (error) {
            console.error('Password comparison error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
});

// Logout route
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Could not log out' });
        }
        res.clearCookie('connect.sid');
        res.json({ message: 'Logout successful' });
    });
});

// Check authentication status
router.get('/me', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const db = database.getDB();
    const query = `
        SELECT id, employee_id, username, email, first_name, last_name, role, department, position
        FROM users 
        WHERE id = ? AND is_active = 1
    `;

    db.get(query, [req.session.userId], (err, user) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
    });
});

// Change password route
router.post('/change-password', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    const db = database.getDB();
    
    // Get current user
    db.get('SELECT password FROM users WHERE id = ?', [req.session.userId], async (err, user) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        try {
            const passwordMatch = await bcrypt.compare(currentPassword, user.password);
            
            if (!passwordMatch) {
                return res.status(401).json({ error: 'Current password is incorrect' });
            }

            const hashedNewPassword = await bcrypt.hash(newPassword, 10);

            db.run(
                'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [hashedNewPassword, req.session.userId],
                function(err) {
                    if (err) {
                        console.error('Database error:', err);
                        return res.status(500).json({ error: 'Failed to update password' });
                    }

                    res.json({ message: 'Password changed successfully' });
                }
            );

        } catch (error) {
            console.error('Password hashing error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
});

module.exports = router;
