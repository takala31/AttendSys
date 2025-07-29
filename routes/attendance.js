const express = require('express');
const { requireAuth } = require('../middleware/auth');
const database = require('../config/database');

const router = express.Router();

// Check in
router.post('/checkin', requireAuth, (req, res) => {
    const userId = req.session.userId;
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().split(' ')[0];

    const db = database.getDB();

    // Check if user already checked in today
    db.get(
        'SELECT id, check_in_time FROM attendance_logs WHERE user_id = ? AND date = ?',
        [userId, today],
        (err, existingRecord) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            if (existingRecord && existingRecord.check_in_time) {
                return res.status(400).json({ error: 'Already checked in today' });
            }

            // Insert or update attendance record
            const query = existingRecord
                ? 'UPDATE attendance_logs SET check_in_time = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
                : 'INSERT INTO attendance_logs (user_id, date, check_in_time, status) VALUES (?, ?, ?, ?)';

            const params = existingRecord
                ? [currentTime, 'present', existingRecord.id]
                : [userId, today, currentTime, 'present'];

            db.run(query, params, function(err) {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Failed to record check-in' });
                }

                res.json({
                    message: 'Check-in recorded successfully',
                    checkInTime: currentTime,
                    date: today
                });
            });
        }
    );
});

// Check out
router.post('/checkout', requireAuth, (req, res) => {
    const userId = req.session.userId;
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().split(' ')[0];

    const db = database.getDB();

    // Get today's attendance record
    db.get(
        'SELECT id, check_in_time, check_out_time FROM attendance_logs WHERE user_id = ? AND date = ?',
        [userId, today],
        (err, record) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            if (!record || !record.check_in_time) {
                return res.status(400).json({ error: 'Must check in before checking out' });
            }

            if (record.check_out_time) {
                return res.status(400).json({ error: 'Already checked out today' });
            }

            // Calculate total hours
            const checkInTime = new Date(`${today}T${record.check_in_time}`);
            const checkOutTime = new Date(`${today}T${currentTime}`);
            const totalHours = Math.round(((checkOutTime - checkInTime) / (1000 * 60 * 60)) * 100) / 100;

            db.run(
                'UPDATE attendance_logs SET check_out_time = ?, total_hours = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [currentTime, totalHours, record.id],
                function(err) {
                    if (err) {
                        console.error('Database error:', err);
                        return res.status(500).json({ error: 'Failed to record check-out' });
                    }

                    res.json({
                        message: 'Check-out recorded successfully',
                        checkOutTime: currentTime,
                        totalHours: totalHours,
                        date: today
                    });
                }
            );
        }
    );
});

// Get attendance logs
router.get('/', requireAuth, (req, res) => {
    const { startDate, endDate, userId } = req.query;
    const db = database.getDB();

    let query = `
        SELECT al.*, u.first_name, u.last_name, u.employee_id
        FROM attendance_logs al
        JOIN users u ON al.user_id = u.id
        WHERE 1=1
    `;
    const params = [];

    // If not admin, only show own records
    if (req.session.userRole !== 'admin') {
        query += ' AND al.user_id = ?';
        params.push(req.session.userId);
    } else if (userId) {
        query += ' AND al.user_id = ?';
        params.push(userId);
    }

    if (startDate) {
        query += ' AND al.date >= ?';
        params.push(startDate);
    }

    if (endDate) {
        query += ' AND al.date <= ?';
        params.push(endDate);
    }

    query += ' ORDER BY al.date DESC, al.check_in_time DESC';

    db.all(query, params, (err, logs) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        res.json({ logs });
    });
});

// Get today's attendance status
router.get('/today', requireAuth, (req, res) => {
    const userId = req.session.userId;
    const today = new Date().toISOString().split('T')[0];
    const db = database.getDB();

    db.get(
        'SELECT * FROM attendance_logs WHERE user_id = ? AND date = ?',
        [userId, today],
        (err, record) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            res.json({
                hasCheckedIn: !!(record && record.check_in_time),
                hasCheckedOut: !!(record && record.check_out_time),
                record: record || null
            });
        }
    );
});

// Update attendance (admin only)
router.put('/:id', requireAuth, (req, res) => {
    if (req.session.userRole !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }

    const attendanceId = req.params.id;
    const { check_in_time, check_out_time, status, notes } = req.body;

    const updates = [];
    const values = [];

    if (check_in_time !== undefined) {
        updates.push('check_in_time = ?');
        values.push(check_in_time);
    }

    if (check_out_time !== undefined) {
        updates.push('check_out_time = ?');
        values.push(check_out_time);
    }

    if (status !== undefined) {
        updates.push('status = ?');
        values.push(status);
    }

    if (notes !== undefined) {
        updates.push('notes = ?');
        values.push(notes);
    }

    if (updates.length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
    }

    // Calculate total hours if both times are provided
    if (check_in_time && check_out_time) {
        const checkInTime = new Date(`2000-01-01T${check_in_time}`);
        const checkOutTime = new Date(`2000-01-01T${check_out_time}`);
        const totalHours = Math.round(((checkOutTime - checkInTime) / (1000 * 60 * 60)) * 100) / 100;
        updates.push('total_hours = ?');
        values.push(totalHours);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(attendanceId);

    const db = database.getDB();
    const query = `UPDATE attendance_logs SET ${updates.join(', ')} WHERE id = ?`;

    db.run(query, values, function(err) {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to update attendance' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'Attendance record not found' });
        }

        res.json({ message: 'Attendance updated successfully' });
    });
});

// Delete attendance record (admin only)
router.delete('/:id', requireAuth, (req, res) => {
    if (req.session.userRole !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }

    const attendanceId = req.params.id;
    const db = database.getDB();

    db.run('DELETE FROM attendance_logs WHERE id = ?', [attendanceId], function(err) {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to delete attendance record' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'Attendance record not found' });
        }

        res.json({ message: 'Attendance record deleted successfully' });
    });
});

module.exports = router;
