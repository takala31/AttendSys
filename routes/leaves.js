const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const database = require('../config/database');

const router = express.Router();

// Get leave requests
router.get('/', authenticateToken, (req, res) => {
    const { status, userId, startDate, endDate } = req.query;
    const db = database.getDB();

    let query = `
        SELECT l.*, 
               u.first_name, u.last_name, u.employee_id,
               approver.first_name as approver_first_name, approver.last_name as approver_last_name
        FROM leaves l
        JOIN users u ON l.user_id = u.id
        LEFT JOIN users approver ON l.approved_by = approver.id
        WHERE 1=1
    `;
    const params = [];

    // If not admin, only show own leave requests
    if (req.user.role !== 'admin') {
        query += ' AND l.user_id = ?';
        params.push(req.user.id);
    } else if (userId) {
        query += ' AND l.user_id = ?';
        params.push(userId);
    }

    if (status) {
        query += ' AND l.status = ?';
        params.push(status);
    }

    if (startDate) {
        query += ' AND l.start_date >= ?';
        params.push(startDate);
    }

    if (endDate) {
        query += ' AND l.end_date <= ?';
        params.push(endDate);
    }

    query += ' ORDER BY l.created_at DESC';

    db.all(query, params, (err, leaves) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        res.json({ leaves });
    });
});

// Create leave request
router.post('/', authenticateToken, (req, res) => {
    const { leave_type, start_date, end_date, reason } = req.body;
    const userId = req.user.id;

    if (!leave_type || !start_date || !end_date) {
        return res.status(400).json({ error: 'Leave type, start date, and end date are required' });
    }

    // Validate dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
        return res.status(400).json({ error: 'Start date cannot be in the past' });
    }

    if (endDate < startDate) {
        return res.status(400).json({ error: 'End date cannot be before start date' });
    }

    // Calculate total days
    const timeDiff = endDate.getTime() - startDate.getTime();
    const totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

    const db = database.getDB();

    // Check for overlapping leave requests
    const overlapQuery = `
        SELECT id FROM leaves 
        WHERE user_id = ? 
        AND status IN ('pending', 'approved')
        AND (
            (start_date <= ? AND end_date >= ?) OR
            (start_date <= ? AND end_date >= ?) OR
            (start_date >= ? AND end_date <= ?)
        )
    `;

    db.get(overlapQuery, [userId, start_date, start_date, end_date, end_date, start_date, end_date], (err, overlap) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (overlap) {
            return res.status(400).json({ error: 'Leave request overlaps with existing leave' });
        }

        // Create leave request
        const insertQuery = `
            INSERT INTO leaves (user_id, leave_type, start_date, end_date, total_days, reason)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        db.run(insertQuery, [userId, leave_type, start_date, end_date, totalDays, reason], function(err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to create leave request' });
            }

            res.status(201).json({
                message: 'Leave request created successfully',
                leaveId: this.lastID,
                totalDays
            });
        });
    });
});

// Update leave request status (admin only)
router.put('/:id/status', authenticateToken, requireAdmin, (req, res) => {
    const leaveId = req.params.id;
    const { status, rejection_reason } = req.body;
    const approverId = req.user.userId;

    if (!status || !['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Valid status (approved or rejected) is required' });
    }

    if (status === 'rejected' && !rejection_reason) {
        return res.status(400).json({ error: 'Rejection reason is required when rejecting leave' });
    }

    const db = database.getDB();

    // Check if leave request exists and is pending
    db.get('SELECT * FROM leaves WHERE id = ? AND status = ?', [leaveId, 'pending'], (err, leave) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (!leave) {
            return res.status(404).json({ error: 'Pending leave request not found' });
        }

        const updateQuery = `
            UPDATE leaves 
            SET status = ?, approved_by = ?, approved_date = CURRENT_TIMESTAMP, 
                rejection_reason = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;

        db.run(updateQuery, [status, approverId, rejection_reason || null, leaveId], function(err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to update leave request' });
            }

            res.json({
                message: `Leave request ${status} successfully`,
                status,
                leaveId
            });
        });
    });
});

// Update own leave request (only if pending)
router.put('/:id', authenticateToken, (req, res) => {
    const leaveId = req.params.id;
    const { leave_type, start_date, end_date, reason } = req.body;
    const userId = req.session.userId;

    const db = database.getDB();

    // Check if leave request exists and belongs to user and is pending
    let checkQuery = 'SELECT * FROM leaves WHERE id = ? AND status = ?';
    let checkParams = [leaveId, 'pending'];

    if (req.session.userRole !== 'admin') {
        checkQuery += ' AND user_id = ?';
        checkParams.push(userId);
    }

    db.get(checkQuery, checkParams, (err, leave) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (!leave) {
            return res.status(404).json({ error: 'Pending leave request not found or access denied' });
        }

        const updates = [];
        const values = [];

        if (leave_type !== undefined) {
            updates.push('leave_type = ?');
            values.push(leave_type);
        }

        if (start_date !== undefined) {
            updates.push('start_date = ?');
            values.push(start_date);
        }

        if (end_date !== undefined) {
            updates.push('end_date = ?');
            values.push(end_date);
        }

        if (reason !== undefined) {
            updates.push('reason = ?');
            values.push(reason);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        // Recalculate total days if dates are updated
        if (start_date !== undefined || end_date !== undefined) {
            const startDate = new Date(start_date || leave.start_date);
            const endDate = new Date(end_date || leave.end_date);
            const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1;
            
            updates.push('total_days = ?');
            values.push(totalDays);
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(leaveId);

        const updateQuery = `UPDATE leaves SET ${updates.join(', ')} WHERE id = ?`;

        db.run(updateQuery, values, function(err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to update leave request' });
            }

            res.json({ message: 'Leave request updated successfully' });
        });
    });
});

// Delete leave request (own pending requests only, or admin)
router.delete('/:id', authenticateToken, (req, res) => {
    const leaveId = req.params.id;
    const userId = req.session.userId;
    const db = database.getDB();

    let query = 'SELECT * FROM leaves WHERE id = ?';
    let params = [leaveId];

    if (req.session.userRole !== 'admin') {
        query += ' AND user_id = ? AND status = ?';
        params.push(userId, 'pending');
    }

    db.get(query, params, (err, leave) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (!leave) {
            return res.status(404).json({ error: 'Leave request not found or cannot be deleted' });
        }

        db.run('DELETE FROM leaves WHERE id = ?', [leaveId], function(err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to delete leave request' });
            }

            res.json({ message: 'Leave request deleted successfully' });
        });
    });
});

// Get leave balance/summary for a user
router.get('/balance/:userId', authenticateToken, (req, res) => {
    const userId = req.params.userId;
    
    // Check permissions
    if (req.session.userRole !== 'admin' && req.session.userId != userId) {
        return res.status(403).json({ error: 'Access denied' });
    }

    const db = database.getDB();
    const currentYear = new Date().getFullYear();

    const query = `
        SELECT 
            leave_type,
            COUNT(*) as total_requests,
            SUM(total_days) as total_days_taken,
            SUM(CASE WHEN status = 'approved' THEN total_days ELSE 0 END) as approved_days,
            SUM(CASE WHEN status = 'pending' THEN total_days ELSE 0 END) as pending_days,
            SUM(CASE WHEN status = 'rejected' THEN total_days ELSE 0 END) as rejected_days
        FROM leaves 
        WHERE user_id = ? 
        AND strftime('%Y', start_date) = ?
        GROUP BY leave_type
    `;

    db.all(query, [userId, currentYear.toString()], (err, summary) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        res.json({
            year: currentYear,
            leaveSummary: summary || []
        });
    });
});

// Get leave balance for current user
router.get('/balance', authenticateToken, (req, res) => {
    const userId = req.session.userId;

    const db = database.getDB();
    const currentYear = new Date().getFullYear();

    const query = `
        SELECT 
            leave_type,
            COUNT(*) as total_requests,
            SUM(total_days) as total_days_taken,
            SUM(CASE WHEN status = 'approved' THEN total_days ELSE 0 END) as approved_days,
            SUM(CASE WHEN status = 'pending' THEN total_days ELSE 0 END) as pending_days,
            SUM(CASE WHEN status = 'rejected' THEN total_days ELSE 0 END) as rejected_days
        FROM leaves 
        WHERE user_id = ? 
        AND strftime('%Y', start_date) = ?
        GROUP BY leave_type
    `;

    db.all(query, [userId, currentYear.toString()], (err, summary) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        res.json({
            year: currentYear,
            leaveSummary: summary || []
        });
    });
});

module.exports = router;
