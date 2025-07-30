// Database initialization script
const database = require('./config/database');

console.log('Initializing database...');

// Give it some time to initialize
setTimeout(() => {
    console.log('Database initialization completed');
    console.log('Demo users should now be available:');
    console.log('- Admin: admin / admin123');
    console.log('- Employee: jdoe / employee123');
    
    // Check if database file exists
    const fs = require('fs');
    const path = require('path');
    const dbPath = path.join(__dirname, 'database', 'attendance.db');
    
    if (fs.existsSync(dbPath)) {
        console.log('✅ Database file created successfully at:', dbPath);
    } else {
        console.log('❌ Database file not found at:', dbPath);
    }
    
    process.exit(0);
}, 3000);
