const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/authsuermodel');
const { validateAuth } = require('../middleware/validation');
const { authenticateUser } = require('../middleware/auth');
const { singleImage } = require('../../multer');

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key', {
        expiresIn: process.env.JWT_EXPIRE || '30d'
    });
};

// @desc    Update profile basic info
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', authenticateUser, async (req, res) => {
    try {
        const { name, email, phone } = req.body;
        const user = await User.findById(req.user._id);

        if (name) user.name = name;
        if (email) user.email = email;
        if (phone) user.phone = phone;

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating profile',
            error: error.message
        });
    }
});

// @desc    Update profile photo
// @route   POST /api/auth/profile/photo
// @access  Private
router.post('/profile/photo', authenticateUser, singleImage, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload an image'
            });
        }

        const user = await User.findById(req.user._id);
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const relativePath = req.file.path.replace(/\\/g, '/').split('public/')[1];
        
        user.profilePicture = `${baseUrl}/${relativePath}`;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Profile photo updated successfully',
            profilePicture: user.profilePicture
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating profile photo',
            error: error.message
        });
    }
});

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', validateAuth.register, async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email or phone already exists'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            phone
        });

        // Generate token
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    profilePicture: user.profilePicture || '',
                    enrolledCourses: user.enrolledCourses || []
                },
                token
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error registering user',
            error: error.message
        });
    }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', validateAuth.login, async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Your account has been deactivated'
            });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate token
        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    profilePicture: user.profilePicture || '',
                    enrolledCourses: user.enrolledCourses || []
                },
                token
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error logging in',
            error: error.message
        });
    }
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', authenticateUser, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('enrolledCourses');

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching user',
            error: error.message
        });
    }
});

// @desc    Update password
// @route   PUT /api/auth/password
// @access  Private
router.put('/password', authenticateUser, validateAuth.updatePassword, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;

        // Get user with password
        const user = await User.findById(req.user._id).select('+password');

        // Check old password
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Old password is incorrect'
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating password',
            error: error.message
        });
    }
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
router.post('/forgot-password', validateAuth.forgotPassword, async (req, res) => {
    try {
        const { email } = req.body;

        // Find user
        const user = await User.findOne({ email });
        
        // Always return success message for security (don't reveal if email exists)
        if (!user) {
            return res.status(200).json({
                success: true,
                message: 'If that email exists, a password reset link has been sent'
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        
        // Hash token and set to resetPasswordToken field
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        
        // Set token and expiration (10 minutes)
        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
        
        await user.save({ validateBeforeSave: false });

        // In production, send email with reset link
        // For now, we'll return the token in response (remove this in production)
        const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;

        // TODO: Send email with resetUrl
        // await sendEmail({
        //     email: user.email,
        //     subject: 'Password Reset Request',
        //     message: `Your password reset token is: ${resetToken}\n\nOr click this link: ${resetUrl}`
        // });

        res.status(200).json({
            success: true,
            message: 'Password reset token sent to email',
            // Remove this in production - only for development
            resetToken: resetToken,
            resetUrl: resetUrl
        });
    } catch (error) {
        // Reset token fields if error occurs (only if user was found)
        if (user && user._id) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false });
        }

        res.status(500).json({
            success: false,
            message: 'Error sending password reset email',
            error: error.message
        });
    }
});

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
// @access  Public
router.put('/reset-password/:token', validateAuth.resetPassword, async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        // Hash the token to compare with stored token
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // Find user with this token and check if token hasn't expired
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() }
        }).select('+password');

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Update password and clear reset token fields
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password reset successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error resetting password',
            error: error.message
        });
    }
});

module.exports = router;

