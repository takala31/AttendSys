// Fixed AttendSys Server with proper error handling
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

console.log('Starting AttendSys Server...');

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false,
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use(limiter);

// CORS
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? 'your-domain.com' : 'http://localhost:3000',
    credentials: true
}));

// Body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'attendance_tracking_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Import routes with error handling
let authRoutes, userRoutes, attendanceRoutes, calendarRoutes, leaveRoutes, reportsRoutes;

try {
    authRoutes = require('./routes/auth');
    userRoutes = require('./routes/users');
    attendanceRoutes = require('./routes/attendance');
    calendarRoutes = require('./routes/calendar');
    leaveRoutes = require('./routes/leaves');
    reportsRoutes = require('./routes/reports');
    console.log('✅ All routes loaded successfully');
} catch (error) {
    console.error('❌ Error loading routes:', error.message);
    
    // Create fallback auth route
    authRoutes = express.Router();
    authRoutes.post('/login', (req, res) => {
        res.status(500).json({ 
            error: 'Server configuration error. Routes not loaded properly.',
            details: error.message 
        });
    });
}

// Routes
app.use('/api/auth', authRoutes);
if (userRoutes) app.use('/api/users', userRoutes);
if (attendanceRoutes) app.use('/api/attendance', attendanceRoutes);
if (calendarRoutes) app.use('/api/calendar', calendarRoutes);
if (leaveRoutes) app.use('/api/leaves', leaveRoutes);
if (reportsRoutes) app.use('/api/reports', reportsRoutes);

// Serve login page as default
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Serve main dashboard
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err.stack);
    res.status(500).json({ 
        error: 'Internal server error',
        message: err.message 
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Initialize database
try {
    const database = require('./config/database');
    console.log('✅ Database module loaded');
} catch (error) {
    console.error('❌ Database error:', error.message);
}

// Start server
app.listen(PORT, () => {
    console.log(`✅ AttendSys Server running on port ${PORT}`);
    console.log(`🌐 Access: http://localhost:${PORT}`);
    console.log(`📋 Demo credentials:`);
    console.log(`   Admin: admin / admin123`);
    console.log(`   Employee: jdoe / employee123`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down gracefully...');
    process.exit(0);
});
