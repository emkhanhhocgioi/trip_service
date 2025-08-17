const jwt = require("jsonwebtoken");

// Middleware to set JWT token in cookie
const setTokenCookie = (req, res, next) => {
    // This middleware will be used after successful login
    // It expects the token to be in res.locals.token
    if (res.locals.token) {
        res.cookie('authToken', res.locals.token, {
            httpOnly: true,        // Prevents XSS attacks
            secure: process.env.NODE_ENV === 'production', // Use HTTPS in production
            sameSite: 'strict',    // CSRF protection
            maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
            path: '/'
        });
    }
    next();
};

// Middleware to verify JWT token from cookie
const verifyTokenFromCookie = (req, res, next) => {
    try {
        const token = req.cookies.authToken;
        
        if (!token) {
            return res.status(401).json({ message: "Access denied. No token provided." });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
        
        // Attach decoded token data to request object
        // This will work for both users and partners based on token content
        if (decoded.userId) {
            req.user = decoded; // User login
        } else if (decoded.partnerId) {
            req.partner = decoded; // Partner login
            req.user = decoded; // Also keep compatibility
        }
        
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: "Token expired" });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: "Invalid token" });
        }
        return res.status(500).json({ message: "Token verification failed" });
    }
};

// Middleware to clear token cookie (for logout)
const clearTokenCookie = (req, res, next) => {
    res.clearCookie('authToken', {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });
    next();
};

module.exports = {
    setTokenCookie,
    verifyTokenFromCookie,
    clearTokenCookie
};
