const jwt = require("jsonwebtoken");

// Middleware to verify JWT token from cookie or header
const verifyToken = (req, res, next) => {
    try {
        // Try to get token from cookie first, then from Authorization header
        let token = req.cookies?.authToken;
        
        if (!token) {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
        }
        
        if (!token) {
            return res.status(401).json({ 
                success: false,
                message: "Access denied. No token provided." 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
        
        // Attach decoded token data to request object
        req.user = decoded;
        
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false,
                message: "Token expired" 
            });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false,
                message: "Invalid token" 
            });
        }
        return res.status(500).json({ 
            success: false,
            message: "Token verification failed" 
        });
    }
};

// Middleware to verify admin role
const verifyAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ 
            success: false,
            message: "Access denied. Authentication required." 
        });
    }

    // Check if user has admin role
    if (req.user.role !== 'admin') {
        return res.status(403).json({ 
            success: false,
            message: "Access denied. Admin role required." 
        });
    }

    next();
};

// Optional middleware - doesn't fail if no token
const optionalAuth = (req, res, next) => {
    try {
        let token = req.cookies?.authToken;
        
        if (!token) {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
        }
        
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
            req.user = decoded;
        }
        
        next();
    } catch (error) {
        // Don't fail on optional auth, just proceed without user
        next();
    }
};

module.exports = {
    verifyToken,
    verifyAdmin,
    optionalAuth
};
