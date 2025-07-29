const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

class Database {
    constructor() {
        this.dbPath = path.join(__dirname, '../database/attendance.db');
        this.db = null;
        this.init();
    }

    init() {
        // Create database directory if it doesn't exist
        const fs = require('fs');
        const dbDir = path.dirname(this.dbPath);
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }

        this.db = new sqlite3.Database(this.dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err);
            } else {
                console.log('Connected to SQLite database');
                this.createTables();
            }
        });
    }

    createTables() {
        // Users table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                employee_id VARCHAR(50) UNIQUE NOT NULL,
                username VARCHAR(100) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                role VARCHAR(20) DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
                department VARCHAR(100),
                position VARCHAR(100),
                hire_date DATE,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Attendance log table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS attendance_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                date DATE NOT NULL,
                check_in_time TIME,
                check_out_time TIME,
                break_start_time TIME,
                break_end_time TIME,
                total_hours DECIMAL(4,2),
                status VARCHAR(20) DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'half_day')),
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                UNIQUE(user_id, date)
            )
        `);

        // Calendar table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS calendar (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date DATE NOT NULL UNIQUE,
                day_type VARCHAR(20) DEFAULT 'working_day' CHECK (day_type IN ('working_day', 'weekend', 'holiday', 'company_event')),
                title VARCHAR(255),
                description TEXT,
                is_working_day BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Leaves table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS leaves (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                leave_type VARCHAR(20) NOT NULL CHECK (leave_type IN ('sick', 'vacation', 'personal', 'emergency', 'maternity', 'paternity')),
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                total_days INTEGER NOT NULL,
                reason TEXT,
                status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
                approved_by INTEGER,
                approved_date DATETIME,
                rejection_reason TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                FOREIGN KEY (approved_by) REFERENCES users (id)
            )
        `, (err) => {
            if (err) {
                console.error('Error creating leaves table:', err);
            } else {
                this.seedDefaultData();
            }
        });
    }

    async seedDefaultData() {
        // Create default admin user
        const adminPassword = await bcrypt.hash('admin123', 10);
        
        this.db.run(`
            INSERT OR IGNORE INTO users (
                employee_id, username, email, password, first_name, last_name, role, department, position, hire_date
            ) VALUES (
                'EMP001', 'admin', 'admin@company.com', ?, 'Admin', 'User', 'admin', 'IT', 'System Administrator', date('now')
            )
        `, [adminPassword]);

        // Create sample employee
        const employeePassword = await bcrypt.hash('employee123', 10);
        
        this.db.run(`
            INSERT OR IGNORE INTO users (
                employee_id, username, email, password, first_name, last_name, role, department, position, hire_date
            ) VALUES (
                'EMP002', 'jdoe', 'john.doe@company.com', ?, 'John', 'Doe', 'employee', 'Sales', 'Sales Representative', date('now', '-30 days')
            )
        `, [employeePassword]);

        // Add some calendar entries for holidays
        const holidays = [
            { date: '2025-01-01', title: 'New Year\'s Day', day_type: 'holiday', is_working_day: 0 },
            { date: '2025-07-04', title: 'Independence Day', day_type: 'holiday', is_working_day: 0 },
            { date: '2025-12-25', title: 'Christmas Day', day_type: 'holiday', is_working_day: 0 }
        ];

        holidays.forEach(holiday => {
            this.db.run(`
                INSERT OR IGNORE INTO calendar (date, title, day_type, is_working_day)
                VALUES (?, ?, ?, ?)
            `, [holiday.date, holiday.title, holiday.day_type, holiday.is_working_day]);
        });
    }

    getDB() {
        return this.db;
    }

    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err);
                } else {
                    console.log('Database connection closed');
                }
            });
        }
    }
}

module.exports = new Database();
