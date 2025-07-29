const express = require('express');
const bcrypt = require('bcryptjs');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const database = require('../config/database');

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticateToken, requireAdmin, (req, res) => {
    const db = database.getDB();
    const query = `
        SELECT id, employee_id, username, email, first_name, last_name, role, department, position, hire_date, is_active, created_at
        FROM users 
        ORDER BY created_at DESC
    `;

    db.all(query, [], (err, users) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        res.json({ users });
    });
});

// Get user by ID
router.get('/:id', authenticateToken, (req, res) => {
    const userId = req.params.id;
    const db = database.getDB();

    // Check if user is requesting their own data or is admin
    if (req.user.id != userId && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }

    const query = `
        SELECT id, employee_id, username, email, first_name, last_name, role, department, position, hire_date, is_active, created_at
        FROM users 
        WHERE id = ?
    `;

    db.get(query, [userId], (err, user) => {
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

// Create new user (admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    console.log('=== POST /api/users called ===');
    console.log('Request body:', req.body);
    console.log('User making request:', req.user);
    
    const { employee_id, username, email, password, first_name, last_name, role, department, position, hire_date } = req.body;

    console.log('Extracted fields:', { employee_id, username, email, first_name, last_name, role, department, position, hire_date });

    // Validation
    if (!employee_id || !username || !email || !password || !first_name || !last_name) {
        console.log('Validation failed: Missing required fields');
        return res.status(400).json({ error: 'All required fields must be provided' });
    }

    if (password.length < 6) {
        console.log('Validation failed: Password too short');
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    console.log('Validation passed, proceeding with user creation...');

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('Password hashed successfully');
        
        const db = database.getDB();

        const query = `
            INSERT INTO users (employee_id, username, email, password, first_name, last_name, role, department, position, hire_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        console.log('Executing database query...');
        console.log('Query:', query);
        console.log('Values:', [employee_id, username, email, '[HIDDEN]', first_name, last_name, role || 'employee', department, position, hire_date || new Date().toISOString().split('T')[0]]);

        db.run(query, [
            employee_id, username, email, hashedPassword, first_name, last_name, 
            role || 'employee', department, position, hire_date || new Date().toISOString().split('T')[0]
        ], function(err) {
            if (err) {
                console.log('Database error occurred:', err);
                if (err.message.includes('UNIQUE constraint failed')) {
                    console.log('Unique constraint violation');
                    return res.status(400).json({ error: 'Employee ID, username, or email already exists' });
                }
                console.error('Other database error:', err);
                return res.status(500).json({ error: 'Failed to create user' });
            }

            console.log('User created successfully with ID:', this.lastID);
            res.status(201).json({ 
                message: 'User created successfully', 
                userId: this.lastID 
            });
        });

    } catch (error) {
        console.error('Password hashing error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update user (admin only or own profile)
router.put('/:id', authenticateToken, async (req, res) => {
    const userId = req.params.id;
    const { employee_id, username, first_name, last_name, email, password, department, position, role, is_active, hire_date } = req.body;

    // Check permissions
    if (req.user.id != userId && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }

    // Only admin can change role, is_active status, employee_id, and username
    const allowedFields = ['first_name', 'last_name', 'email', 'department', 'position', 'hire_date'];
    if (req.user.role === 'admin') {
        allowedFields.push('role', 'is_active', 'employee_id', 'username');
    }

    const updates = [];
    const values = [];

    // Handle password separately if provided
    if (password && password.trim() !== '') {
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            updates.push('password = ?');
            values.push(hashedPassword);
        } catch (error) {
            console.error('Password hashing error:', error);
            return res.status(500).json({ error: 'Failed to process password' });
        }
    }

    Object.keys(req.body).forEach(key => {
        if (allowedFields.includes(key) && req.body[key] !== undefined && key !== 'password') {
            updates.push(`${key} = ?`);
            values.push(req.body[key]);
        }
    });

    if (updates.length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(userId);

    const db = database.getDB();
    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;

    db.run(query, values, function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                if (err.message.includes('username')) {
                    return res.status(400).json({ error: 'Username already exists' });
                } else if (err.message.includes('email')) {
                    return res.status(400).json({ error: 'Email already exists' });
                } else if (err.message.includes('employee_id')) {
                    return res.status(400).json({ error: 'Employee ID already exists' });
                }
            }
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to update user' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User updated successfully' });
    });
});

// Delete user (admin only)
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
    const userId = req.params.id;

    // Prevent admin from deleting themselves
    if (req.user.id == userId) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const db = database.getDB();
    const query = 'DELETE FROM users WHERE id = ?';

    db.run(query, [userId], function(err) {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to delete user' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    });
});

module.exports = router;
