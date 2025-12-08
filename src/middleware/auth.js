const jwt = require('jsonwebtoken');
const User = require('../models/authsuermodel');
const Admin = require('../models/Admin');
const Instructor = require('../models/instructor');

// Authenticate user
const authenticateUser = async (req, res, next) => {
    try {
        let token;

        // Check for token in headers
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route'
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

            // Get user from token
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user || !req.user.isActive) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found or inactive'
                });
            }

            next();
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Authentication error',
            error: error.message
        });
    }
};

// Authenticate admin
const authenticateAdmin = async (req, res, next) => {
    try {
        let token;

        // Check for token in headers
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.cookies && req.cookies.adminToken) {
            token = req.cookies.adminToken;
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route'
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

            // Get admin from token
            req.admin = await Admin.findById(decoded.id).select('-password');

            if (!req.admin || !req.admin.isActive) {
                return res.status(401).json({
                    success: false,
                    message: 'Admin not found or inactive'
                });
            }

            next();
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Authentication error',
            error: error.message
        });
    }
};

// Authorize roles for user
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to access this route'
            });
        }
        next();
    };
};

// Authenticate instructor
const authenticateInstructor = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.cookies && req.cookies.instructorToken) {
            token = req.cookies.instructorToken;
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route'
            });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            req.instructor = await Instructor.findById(decoded.id).select('-password');

            if (!req.instructor || !req.instructor.isActive) {
                return res.status(401).json({
                    success: false,
                    message: 'Instructor not found or inactive'
                });
            }

            next();
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Authentication error',
            error: error.message
        });
    }
};

// Check if user owns resource or is admin
const authorizeOwnerOrAdmin = (resourceUserId) => {
    return (req, res, next) => {
        if (req.user.role === 'admin' || req.user._id.toString() === resourceUserId.toString()) {
            return next();
        }
        return res.status(403).json({
            success: false,
            message: 'Not authorized to access this resource'
        });
    };
};

module.exports = {
    authenticateUser,
    authenticateAdmin,
    authenticateInstructor,
    authorize,
    authorizeOwnerOrAdmin
};

