const Class = require('../models/Classmodel');
const Enrollment = require('../models/enrollment');

// @desc    Get all classes
// @route   GET /api/classes
// @access  Public
const getAllClasses = async (req, res) => {
    try {
        const {
            courseId,
            batchId,
            classType,
            status,
            isActive,
            page = 1,
            limit = 10
        } = req.query;

        const filter = {};

        if (courseId) filter.courseId = courseId;
        if (batchId) filter.batchId = batchId;
        if (classType) filter.classType = classType;
        if (status) filter.status = status;
        if (isActive !== undefined) filter.isActive = isActive === 'true';

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const classes = await Class.find(filter)
            .populate('courseId', 'title category')
            .populate('batchId', 'title examType')
            .sort({ scheduledDate: 1, startTime: 1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Class.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: classes,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching classes',
            error: error.message
        });
    }
};

// @desc    Get class by ID
// @route   GET /api/classes/:id
// @access  Private
const getClassById = async (req, res) => {
    try {
        const classData = await Class.findById(req.params.id)
            .populate('courseId')
            .populate('batchId')
            .populate('attendees.userId', 'name email');

        if (!classData) {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }

        // Check enrollment for students (optional - only if user is logged in)
        // Try to get user from token if present, but don't require it
        let user = null;
        try {
            const jwt = require('jsonwebtoken');
            const User = require('../models/authsuermodel');
            let token;
            if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
                token = req.headers.authorization.split(' ')[1];
            }
            if (token) {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
                user = await User.findById(decoded.id).select('-password');
            }
        } catch (err) {
            // Token not present or invalid - allow public access
        }

        if (user && user.role === 'student') {
            if (classData.courseId) {
                const enrollment = await Enrollment.findOne({
                    userId: user._id,
                    courseId: classData.courseId,
                    status: 'active'
                });
                // Don't block access, just note if not enrolled
                // You can add enrollment check here if needed
            }
        }

        res.status(200).json({
            success: true,
            data: classData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching class',
            error: error.message
        });
    }
};

// @desc    Create class
// @route   POST /api/classes
// @access  Private (Admin/Instructor)
const createClass = async (req, res) => {
    try {
        if (req.file) {
            req.body.videoFile = req.file.filename;
        }
        const classData = new Class(req.body);
        const savedClass = await classData.save();
        await savedClass.populate('courseId batchId');

        res.status(201).json({
            success: true,
            message: 'Class created successfully',
            data: savedClass
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating class',
            error: error.message
        });
    }
};

// @desc    Update class
// @route   PUT /api/classes/:id
// @access  Private (Admin/Instructor)
const updateClass = async (req, res) => {
    try {
        if (req.file) {
            req.body.videoFile = req.file.filename;
        }
        const classData = await Class.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: Date.now() },
            { new: true, runValidators: true }
        )
            .populate('courseId batchId');

        if (!classData) {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Class updated successfully',
            data: classData
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating class',
            error: error.message
        });
    }
};

// @desc    Delete class
// @route   DELETE /api/classes/:id
// @access  Private (Admin)
const deleteClass = async (req, res) => {
    try {
        const classData = await Class.findByIdAndDelete(req.params.id);

        if (!classData) {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Class deleted successfully',
            data: classData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting class',
            error: error.message
        });
    }
};

// @desc    Join live class
// @route   POST /api/classes/:id/join
// @access  Private
const joinClass = async (req, res) => {
    try {
        const classData = await Class.findById(req.params.id);

        if (!classData) {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }

        // Check if already joined
        const existingAttendee = classData.attendees.find(
            a => a.userId.toString() === req.user._id.toString()
        );

        if (existingAttendee) {
            return res.status(400).json({
                success: false,
                message: 'Already joined this class'
            });
        }

        // Add attendee
        classData.attendees.push({
            userId: req.user._id,
            joinedAt: new Date()
        });

        await classData.save();

        res.status(200).json({
            success: true,
            message: 'Joined class successfully',
            data: classData
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error joining class',
            error: error.message
        });
    }
};

// @desc    Get live classes
// @route   GET /api/classes/live
// @access  Public
const getLiveClasses = async (req, res) => {
    try {
        const now = new Date();
        const liveClasses = await Class.find({
            status: 'live',
            startTime: { $lte: now },
            endTime: { $gte: now }
        })
            .populate('courseId', 'title')
            .populate('batchId', 'title')
            .sort({ startTime: 1 });

        res.status(200).json({
            success: true,
            count: liveClasses.length,
            data: liveClasses
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching live classes',
            error: error.message
        });
    }
};

module.exports = {
    getAllClasses,
    getClassById,
    createClass,
    updateClass,
    deleteClass,
    joinClass,
    getLiveClasses
};

