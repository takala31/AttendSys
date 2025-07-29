const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    console.log('=== authenticateToken middleware called ===');
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    console.log('Auth header:', authHeader);
    console.log('Extracted token:', token ? 'Present' : 'Missing');

    if (!token) {
        console.log('No token provided');
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'jwt_secret_key', (err, user) => {
        if (err) {
            console.log('Token verification failed:', err.message);
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        console.log('Token verified successfully for user:', user);
        req.user = user;
        next();
    });
};

const requireAdmin = (req, res, next) => {
    console.log('=== requireAdmin middleware called ===');
    console.log('User role:', req.user?.role);
    if (req.user.role !== 'admin') {
        console.log('Access denied: User is not admin');
        return res.status(403).json({ error: 'Admin access required' });
    }
    console.log('Admin access granted');
    next();
};

const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    next();
};

module.exports = {
    authenticateToken,
    requireAdmin,
    requireAuth
};
