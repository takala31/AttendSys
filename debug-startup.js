console.log('=== AttendSys Server Startup Debug ===');

// Step 1: Check environment
console.log('Step 1: Checking environment...');
require('dotenv').config();
console.log('✅ Environment loaded');
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Step 2: Load dependencies
console.log('\nStep 2: Loading dependencies...');
try {
    const express = require('express');
    console.log('✅ Express loaded');
    
    const session = require('express-session');
    console.log('✅ Express-session loaded');
    
    const cors = require('cors');
    console.log('✅ CORS loaded');
    
    const helmet = require('helmet');
    console.log('✅ Helmet loaded');
    
    const rateLimit = require('express-rate-limit');
    console.log('✅ Rate limit loaded');
    
    const bodyParser = require('body-parser');
    console.log('✅ Body parser loaded');
    
    const path = require('path');
    console.log('✅ Path loaded');
} catch (error) {
    console.error('❌ Error loading dependencies:', error.message);
    process.exit(1);
}

// Step 3: Load routes
console.log('\nStep 3: Loading routes...');
try {
    const authRoutes = require('./routes/auth');
    console.log('✅ Auth routes loaded');
    
    const userRoutes = require('./routes/users');
    console.log('✅ User routes loaded');
    
    const attendanceRoutes = require('./routes/attendance');
    console.log('✅ Attendance routes loaded');
    
    const calendarRoutes = require('./routes/calendar');
    console.log('✅ Calendar routes loaded');
    
    const leaveRoutes = require('./routes/leaves');
    console.log('✅ Leave routes loaded');
    
    const reportsRoutes = require('./routes/reports');
    console.log('✅ Reports routes loaded');
} catch (error) {
    console.error('❌ Error loading routes:', error.message);
    console.error(error.stack);
    process.exit(1);
}

// Step 4: Initialize database
console.log('\nStep 4: Initializing database...');
try {
    const database = require('./config/database');
    console.log('✅ Database module loaded');
    
    // Give database time to initialize
    setTimeout(() => {
        console.log('✅ Database initialization time elapsed');
        startServer();
    }, 2000);
    
} catch (error) {
    console.error('❌ Error initializing database:', error.message);
    console.error(error.stack);
    process.exit(1);
}

function startServer() {
    console.log('\nStep 5: Starting Express server...');
    try {
        // Now load the full server
        require('./server.js');
    } catch (error) {
        console.error('❌ Error starting server:', error.message);
        console.error(error.stack);
    }
}
