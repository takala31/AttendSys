#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('🗄️  AttendSys Database Query Tool');
console.log('==================================\n');

const dbPath = path.join(__dirname, 'database', 'attendance.db');

// Check if database exists
const fs = require('fs');
if (!fs.existsSync(dbPath)) {
    console.error('❌ Database not found at:', dbPath);
    console.log('💡 Make sure the server has been started at least once to create the database.');
    process.exit(1);
}

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        process.exit(1);
    }
    console.log('✅ Connected to AttendSys database\n');
    
    // Run some sample queries
    runSampleQueries();
});

function runSampleQueries() {
    console.log('📊 Sample Queries:\n');
    
    // 1. Show all tables
    console.log('1️⃣  Available Tables:');
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
        if (err) {
            console.error('Error:', err.message);
            return;
        }
        rows.forEach(row => {
            console.log(`   📋 ${row.name}`);
        });
        console.log();
        
        // 2. Show users
        showUsers();
    });
}

function showUsers() {
    console.log('2️⃣  Users in System:');
    db.all("SELECT employee_id, username, email, first_name, last_name, role, department FROM users", (err, rows) => {
        if (err) {
            console.error('Error:', err.message);
            return;
        }
        
        if (rows.length === 0) {
            console.log('   ⚠️  No users found');
        } else {
            rows.forEach(user => {
                console.log(`   👤 ${user.employee_id} | ${user.username} | ${user.first_name} ${user.last_name} | ${user.role} | ${user.department}`);
            });
        }
        console.log();
        
        // 3. Show attendance logs
        showAttendance();
    });
}

function showAttendance() {
    console.log('3️⃣  Recent Attendance Logs:');
    db.all(`
        SELECT al.date, u.username, al.check_in_time, al.check_out_time, al.status 
        FROM attendance_logs al 
        JOIN users u ON al.user_id = u.id 
        ORDER BY al.date DESC 
        LIMIT 10
    `, (err, rows) => {
        if (err) {
            console.error('Error:', err.message);
            return;
        }
        
        if (rows.length === 0) {
            console.log('   📅 No attendance records found');
        } else {
            rows.forEach(log => {
                console.log(`   📅 ${log.date} | ${log.username} | In: ${log.check_in_time || 'N/A'} | Out: ${log.check_out_time || 'N/A'} | ${log.status}`);
            });
        }
        console.log();
        
        // 4. Show calendar events
        showCalendar();
    });
}

function showCalendar() {
    console.log('4️⃣  Calendar Events:');
    db.all("SELECT date, title, day_type FROM calendar ORDER BY date", (err, rows) => {
        if (err) {
            console.error('Error:', err.message);
            return;
        }
        
        if (rows.length === 0) {
            console.log('   🗓️  No calendar events found');
        } else {
            rows.forEach(event => {
                console.log(`   🗓️  ${event.date} | ${event.title} | ${event.day_type}`);
            });
        }
        console.log();
        
        closeDatabase();
    });
}

function closeDatabase() {
    console.log('💡 To run custom queries, you can:');
    console.log('   1. Use: sqlite3 database/attendance.db');
    console.log('   2. Or modify this script with your own queries');
    console.log('   3. Or use a GUI tool like DB Browser for SQLite');
    console.log();
    
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('✅ Database connection closed');
        }
    });
}
