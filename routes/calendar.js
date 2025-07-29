const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const database = require('../config/database');

const router = express.Router();

// Get calendar events
router.get('/', authenticateToken, (req, res) => {
    const { startDate, endDate, month, year } = req.query;
    const db = database.getDB();

    let query = 'SELECT * FROM calendar WHERE 1=1';
    const params = [];

    if (startDate && endDate) {
        query += ' AND date BETWEEN ? AND ?';
        params.push(startDate, endDate);
    } else if (month && year) {
        const startOfMonth = `${year}-${month.padStart(2, '0')}-01`;
        const endOfMonth = `${year}-${month.padStart(2, '0')}-31`;
        query += ' AND date BETWEEN ? AND ?';
        params.push(startOfMonth, endOfMonth);
    }

    query += ' ORDER BY date ASC';

    db.all(query, params, (err, events) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        res.json({ events });
    });
});

// Create calendar event (admin only)
router.post('/', authenticateToken, requireAdmin, (req, res) => {
    const { date, title, description, day_type, is_working_day } = req.body;

    if (!date || !title) {
        return res.status(400).json({ error: 'Date and title are required' });
    }

    const db = database.getDB();
    const query = `
        INSERT INTO calendar (date, title, description, day_type, is_working_day)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.run(query, [
        date, 
        title, 
        description || null, 
        day_type || 'working_day', 
        is_working_day !== undefined ? is_working_day : 1
    ], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: 'Calendar event already exists for this date' });
            }
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to create calendar event' });
        }

        res.status(201).json({
            message: 'Calendar event created successfully',
            eventId: this.lastID
        });
    });
});

// Update calendar event (admin only)
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
    const eventId = req.params.id;
    const { title, description, day_type, is_working_day } = req.body;

    const updates = [];
    const values = [];

    if (title !== undefined) {
        updates.push('title = ?');
        values.push(title);
    }

    if (description !== undefined) {
        updates.push('description = ?');
        values.push(description);
    }

    if (day_type !== undefined) {
        updates.push('day_type = ?');
        values.push(day_type);
    }

    if (is_working_day !== undefined) {
        updates.push('is_working_day = ?');
        values.push(is_working_day);
    }

    if (updates.length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(eventId);

    const db = database.getDB();
    const query = `UPDATE calendar SET ${updates.join(', ')} WHERE id = ?`;

    db.run(query, values, function(err) {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to update calendar event' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'Calendar event not found' });
        }

        res.json({ message: 'Calendar event updated successfully' });
    });
});

// Delete calendar event (admin only)
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
    const eventId = req.params.id;
    const db = database.getDB();

    db.run('DELETE FROM calendar WHERE id = ?', [eventId], function(err) {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to delete calendar event' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'Calendar event not found' });
        }

        res.json({ message: 'Calendar event deleted successfully' });
    });
});

// Get working days count for a date range
router.get('/working-days', authenticateToken, (req, res) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const db = database.getDB();
    
    // Get all dates between start and end date
    const query = `
        WITH RECURSIVE date_series(date) AS (
            SELECT date(?) as date
            UNION ALL
            SELECT date(date, '+1 day')
            FROM date_series
            WHERE date < date(?)
        )
        SELECT 
            ds.date,
            COALESCE(c.is_working_day, 
                CASE 
                    WHEN strftime('%w', ds.date) IN ('0', '6') THEN 0 
                    ELSE 1 
                END
            ) as is_working_day
        FROM date_series ds
        LEFT JOIN calendar c ON ds.date = c.date
    `;

    db.all(query, [startDate, endDate], (err, dates) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        const workingDays = dates.filter(d => d.is_working_day === 1).length;
        const totalDays = dates.length;

        res.json({
            totalDays,
            workingDays,
            nonWorkingDays: totalDays - workingDays,
            dates
        });
    });
});

module.exports = router;
