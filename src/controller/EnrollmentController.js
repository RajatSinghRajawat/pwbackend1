const Enrollment = require('../models/enrollment');
const Course = require('../models/courses');
const Batch = require('../models/batch');
const User = require('../models/authsuermodel');

// @desc    Get all enrollments
// @route   GET /api/enrollments
// @access  Private (Admin)
const getAllEnrollments = async (req, res) => {
    try {
        const {
            userId,
            courseId,
            batchId,
            status,
            paymentStatus,
            enrollmentType,
            page = 1,
            limit = 10
        } = req.query;

        const filter = {};

        if (userId) filter.userId = userId;
        if (courseId) filter.courseId = courseId;
        if (batchId) filter.batchId = batchId;
        if (status) filter.status = status;
        if (paymentStatus) filter.paymentStatus = paymentStatus;
        if (enrollmentType) filter.enrollmentType = enrollmentType;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const enrollments = await Enrollment.find(filter)
            .populate('userId', 'name email phone')
            .populate('courseId', 'title category')
            .populate('batchId', 'title examType')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Enrollment.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: enrollments,
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
            message: 'Error fetching enrollments',
            error: error.message
        });
    }
};

// @desc    Get enrollment by ID
// @route   GET /api/enrollments/:id
// @access  Private
const getEnrollmentById = async (req, res) => {
    try {
        const enrollment = await Enrollment.findById(req.params.id)
            .populate('userId', 'name email phone')
            .populate('courseId')
            .populate('batchId');

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                message: 'Enrollment not found'
            });
        }

        // Check if user is authorized (owner or admin)
        if (req.user.role !== 'admin' && enrollment.userId._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access this enrollment'
            });
        }

        res.status(200).json({
            success: true,
            data: enrollment
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching enrollment',
            error: error.message
        });
    }
};

// @desc    Create enrollment
// @route   POST /api/enrollments
// @access  Private
const createEnrollment = async (req, res) => {
    try {
        const { courseId, batchId, enrollmentType, paymentId, amount } = req.body;
        const userId = req.user._id;

        // Validate enrollment type
        if (!enrollmentType || !['course', 'batch'].includes(enrollmentType)) {
            return res.status(400).json({
                success: false,
                message: 'Valid enrollment type is required (course or batch)'
            });
        }

        // Check if already enrolled
        const existingFilter = { userId };
        if (enrollmentType === 'course' && courseId) {
            existingFilter.courseId = courseId;
            existingFilter.enrollmentType = 'course';
        } else if (enrollmentType === 'batch' && batchId) {
            existingFilter.batchId = batchId;
            existingFilter.enrollmentType = 'batch';
        }

        const existingEnrollment = await Enrollment.findOne({
            ...existingFilter,
            status: { $in: ['active', 'pending'] }
        });

        if (existingEnrollment) {
            return res.status(400).json({
                success: false,
                message: 'Already enrolled in this course/batch'
            });
        }

        // Get course or batch details
        let item, expiryDate;
        if (enrollmentType === 'course' && courseId) {
            item = await Course.findById(courseId);
            if (!item) {
                return res.status(404).json({
                    success: false,
                    message: 'Course not found'
                });
            }
        } else if (enrollmentType === 'batch' && batchId) {
            item = await Batch.findById(batchId);
            if (!item) {
                return res.status(404).json({
                    success: false,
                    message: 'Batch not found'
                });
            }
            expiryDate = item.endDate;
        }

        // Calculate amounts
        const finalAmount = amount || item.price || 0;
        const discount = item.originalPrice - finalAmount || 0;

        // Create enrollment
        const enrollment = new Enrollment({
            userId,
            courseId: enrollmentType === 'course' ? courseId : null,
            batchId: enrollmentType === 'batch' ? batchId : null,
            enrollmentType,
            status: paymentId ? 'active' : 'pending',
            paymentStatus: paymentId ? 'paid' : 'pending',
            paymentId,
            amount: finalAmount,
            discount,
            finalAmount,
            expiryDate
        });

        await enrollment.save();

        // Populate references
        await enrollment.populate('userId courseId batchId');

        // Update course/batch enrolled students count and user's enrolledCourses
        if (enrollmentType === 'course' && courseId) {
            await Course.findByIdAndUpdate(courseId, { $inc: { students: 1 } });
            await User.findByIdAndUpdate(userId, { $addToSet: { enrolledCourses: courseId } });
        } else if (enrollmentType === 'batch' && batchId) {
            await Batch.findByIdAndUpdate(batchId, { $inc: { enrolledStudents: 1 } });
            // Note: If you want to track batches in the same array, you might want a separate array or just push the ID
            // For now, let's keep it focussed on courses or add batches too
            await User.findByIdAndUpdate(userId, { $addToSet: { enrolledCourses: batchId } });
        }

        res.status(201).json({
            success: true,
            message: 'Enrollment created successfully',
            data: enrollment
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating enrollment',
            error: error.message
        });
    }
};

// @desc    Update enrollment
// @route   PUT /api/enrollments/:id
// @access  Private (Admin)
const updateEnrollment = async (req, res) => {
    try {
        const enrollment = await Enrollment.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: Date.now() },
            { new: true, runValidators: true }
        )
            .populate('userId courseId batchId');

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                message: 'Enrollment not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Enrollment updated successfully',
            data: enrollment
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating enrollment',
            error: error.message
        });
    }
};

// @desc    Delete enrollment
// @route   DELETE /api/enrollments/:id
// @access  Private (Admin)
const deleteEnrollment = async (req, res) => {
    try {
        const enrollment = await Enrollment.findByIdAndDelete(req.params.id);

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                message: 'Enrollment not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Enrollment deleted successfully',
            data: enrollment
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting enrollment',
            error: error.message
        });
    }
};

// @desc    Get user enrollments
// @route   GET /api/enrollments/user/my-enrollments
// @access  Private
const getMyEnrollments = async (req, res) => {
    try {
        const { status, enrollmentType, page = 1, limit = 10 } = req.query;

        const filter = { userId: req.user._id };
        if (status) filter.status = status;
        if (enrollmentType) filter.enrollmentType = enrollmentType;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const enrollments = await Enrollment.find(filter)
            .populate('courseId', 'title category image rating')
            .populate('batchId', 'title examType image rating')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Enrollment.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: enrollments,
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
            message: 'Error fetching enrollments',
            error: error.message
        });
    }
};

// @desc    Update enrollment progress
// @route   PUT /api/enrollments/:id/progress
// @access  Private
const updateProgress = async (req, res) => {
    try {
        const { progress } = req.body;
        const enrollmentId = req.params.id;

        if (progress < 0 || progress > 100) {
            return res.status(400).json({
                success: false,
                message: 'Progress must be between 0 and 100'
            });
        }

        const enrollment = await Enrollment.findById(enrollmentId);

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                message: 'Enrollment not found'
            });
        }

        // Check if user is authorized
        if (req.user.role !== 'admin' && enrollment.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this enrollment'
            });
        }

        enrollment.progress = progress;
        enrollment.lastAccessed = new Date();

        if (progress === 100) {
            enrollment.status = 'completed';
            enrollment.completedAt = new Date();
        }

        await enrollment.save();

        res.status(200).json({
            success: true,
            message: 'Progress updated successfully',
            data: enrollment
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating progress',
            error: error.message
        });
    }
};

module.exports = {
    getAllEnrollments,
    getEnrollmentById,
    createEnrollment,
    updateEnrollment,
    deleteEnrollment,
    getMyEnrollments,
    updateProgress
};

