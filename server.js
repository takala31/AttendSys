const express = require('express');
const session = require('express-session');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const attendanceRoutes = require('./routes/attendance');
const calendarRoutes = require('./routes/calendar');
const leaveRoutes = require('./routes/leaves');
const reportsRoutes = require('./routes/reports');

// Initialize database
const database = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false, // Disable for development and Railway
    crossOriginEmbedderPolicy: false // Allow Railway deployment
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS - Allow Railway domain and development
app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Allow Railway domains and localhost
        if (origin.includes('railway.app') || 
            origin.includes('localhost') || 
            origin.includes('127.0.0.1')) {
            return callback(null, true);
        }
        
        // For production, you can add your custom domain here
        return callback(null, true); // Allow all for now
    },
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
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/reports', reportsRoutes);

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
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down gracefully...');
    database.close();
    process.exit(0);
});

app.listen(PORT, () => {
    console.log(`Attendance Tracking Server running on port ${PORT}`);
    console.log(`Access the application at: http://localhost:${PORT}`);
});
