const Batch = require('../models/batch');

// @desc    Get all batches
// @route   GET /api/batches
// @access  Public
const getAllBatches = async (req, res) => {
    try {
        const {
            examType,
            batchType,
            status,
            courseId,
            instructorId,
            isFeatured,
            isPopular,
            mode,
            search,
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build filter object
        const filter = {};

        if (examType) filter.examType = examType;
        if (batchType) filter.batchType = batchType;
        if (status) filter.status = status;
        if (courseId) filter.courseId = courseId;
        if (instructorId) filter.instructorId = instructorId;
        if (isFeatured !== undefined) filter.isFeatured = isFeatured === 'true';
        if (isPopular !== undefined) filter.isPopular = isPopular === 'true';
        if (mode) filter.mode = mode;

        // Search functionality
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Sort options
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Fetch batches with pagination
        const batches = await Batch.find(filter)
            .populate('courseId', 'title category')
            .populate('instructorId', 'name email')
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count
        const total = await Batch.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: batches,
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
            message: 'Error fetching batches',
            error: error.message
        });
    }
};

// @desc    Get single batch by ID
// @route   GET /api/batches/:id
// @access  Public
const getBatchById = async (req, res) => {
    try {
        const batch = await Batch.findById(req.params.id)
            .populate('courseId', 'title category')
            .populate('instructorId', 'name email');

        if (!batch) {
            return res.status(404).json({
                success: false,
                message: 'Batch not found'
            });
        }

        res.status(200).json({
            success: true,
            data: batch
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching batch',
            error: error.message
        });
    }
};

// @desc    Create new batch
// @route   POST /api/batches
// @access  Private (Admin)
const createBatch = async (req, res) => {
    try {
        // Calculate discount percentage if not provided
        if (!req.body.discountPercentage && req.body.price && req.body.originalPrice) {
            req.body.discountPercentage = Math.round(
                ((req.body.originalPrice - req.body.price) / req.body.originalPrice) * 100
            );
        }

        const batch = new Batch(req.body);
        const savedBatch = await batch.save();

        // Populate references
        await savedBatch.populate('courseId', 'title category');
        await savedBatch.populate('instructorId', 'name email');

        res.status(201).json({
            success: true,
            message: 'Batch created successfully',
            data: savedBatch
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating batch',
            error: error.message
        });
    }
};

// @desc    Update batch
// @route   PUT /api/batches/:id
// @access  Private (Admin)
const updateBatch = async (req, res) => {
    try {
        // Calculate discount percentage if price updated
        if (req.body.price && req.body.originalPrice && !req.body.discountPercentage) {
            req.body.discountPercentage = Math.round(
                ((req.body.originalPrice - req.body.price) / req.body.originalPrice) * 100
            );
        }

        const batch = await Batch.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: Date.now() },
            { new: true, runValidators: true }
        )
            .populate('courseId', 'title category')
            .populate('instructorId', 'name email');

        if (!batch) {
            return res.status(404).json({
                success: false,
                message: 'Batch not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Batch updated successfully',
            data: batch
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating batch',
            error: error.message
        });
    }
};

// @desc    Delete batch
// @route   DELETE /api/batches/:id
// @access  Private (Admin)
const deleteBatch = async (req, res) => {
    try {
        const batch = await Batch.findByIdAndDelete(req.params.id);

        if (!batch) {
            return res.status(404).json({
                success: false,
                message: 'Batch not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Batch deleted successfully',
            data: batch
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting batch',
            error: error.message
        });
    }
};

// @desc    Get batches by exam type
// @route   GET /api/batches/exam/:examType
// @access  Public
const getBatchesByExamType = async (req, res) => {
    try {
        const batches = await Batch.findByExamType(req.params.examType)
            .populate('courseId instructorId')
            .sort({ priority: -1, createdAt: -1 });

        res.status(200).json({
            success: true,
            count: batches.length,
            data: batches
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching batches by exam type',
            error: error.message
        });
    }
};

// @desc    Get featured batches
// @route   GET /api/batches/featured
// @access  Public
const getFeaturedBatches = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const batches = await Batch.findFeatured(limit)
            .populate('courseId instructorId');

        res.status(200).json({
            success: true,
            count: batches.length,
            data: batches
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching featured batches',
            error: error.message
        });
    }
};

// @desc    Get popular batches
// @route   GET /api/batches/popular
// @access  Public
const getPopularBatches = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const batches = await Batch.findPopular(limit)
            .populate('courseId instructorId');

        res.status(200).json({
            success: true,
            count: batches.length,
            data: batches
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching popular batches',
            error: error.message
        });
    }
};

// @desc    Get active batches
// @route   GET /api/batches/active
// @access  Public
const getActiveBatches = async (req, res) => {
    try {
        const batches = await Batch.findActive()
            .populate('courseId instructorId')
            .sort({ startDate: 1 });

        res.status(200).json({
            success: true,
            count: batches.length,
            data: batches
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching active batches',
            error: error.message
        });
    }
};

// @desc    Update batch rating
// @route   PUT /api/batches/:id/rating
// @access  Private
const updateBatchRating = async (req, res) => {
    try {
        const { rating, ratingCount } = req.body;

        if (rating < 0 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 0 and 5'
            });
        }

        const batch = await Batch.findByIdAndUpdate(
            req.params.id,
            { rating, ratingCount: ratingCount || 0 },
            { new: true, runValidators: true }
        );

        if (!batch) {
            return res.status(404).json({
                success: false,
                message: 'Batch not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Batch rating updated successfully',
            data: batch
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating batch rating',
            error: error.message
        });
    }
};

// @desc    Enroll student in batch
// @route   POST /api/batches/:id/enroll
// @access  Private
const enrollStudent = async (req, res) => {
    try {
        const batch = await Batch.findById(req.params.id);

        if (!batch) {
            return res.status(404).json({
                success: false,
                message: 'Batch not found'
            });
        }

        if (batch.isFull) {
            return res.status(400).json({
                success: false,
                message: 'Batch is full'
            });
        }

        if (batch.status !== 'active' && batch.status !== 'upcoming') {
            return res.status(400).json({
                success: false,
                message: 'Enrollment is not open for this batch'
            });
        }

        await batch.incrementEnrolled(1);

        res.status(200).json({
            success: true,
            message: 'Enrolled successfully',
            data: {
                batchId: batch._id,
                enrolledStudents: batch.enrolledStudents,
                availableSeats: batch.availableSeats
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error enrolling student',
            error: error.message
        });
    }
};

// @desc    Update batch enrollment count
// @route   PUT /api/batches/:id/enrollment
// @access  Private (Admin)
const updateEnrollment = async (req, res) => {
    try {
        const { action, count = 1 } = req.body; // action: 'increment' or 'decrement'

        const batch = await Batch.findById(req.params.id);

        if (!batch) {
            return res.status(404).json({
                success: false,
                message: 'Batch not found'
            });
        }

        if (action === 'increment') {
            if (batch.enrolledStudents + count > batch.maxStudents) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot enroll more students. Batch is full'
                });
            }
            await batch.incrementEnrolled(count);
        } else if (action === 'decrement') {
            await batch.decrementEnrolled(count);
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid action. Use "increment" or "decrement"'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Enrollment updated successfully',
            data: {
                batchId: batch._id,
                enrolledStudents: batch.enrolledStudents,
                availableSeats: batch.availableSeats
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating enrollment',
            error: error.message
        });
    }
};

// @desc    Get batch statistics
// @route   GET /api/batches/:id/statistics
// @access  Private (Admin)
const getBatchStatistics = async (req, res) => {
    try {
        const batch = await Batch.findById(req.params.id)
            .populate('courseId', 'title category')
            .populate('instructorId', 'name email');

        if (!batch) {
            return res.status(404).json({
                success: false,
                message: 'Batch not found'
            });
        }

        const statistics = {
            batchId: batch._id,
            title: batch.title,
            course: batch.courseId?.title,
            instructor: batch.instructorId?.name,
            totalStudents: batch.maxStudents,
            enrolledStudents: batch.enrolledStudents,
            availableSeats: batch.availableSeats,
            totalClasses: batch.totalClasses,
            rating: batch.rating,
            ratingCount: batch.ratingCount,
            status: batch.status,
            startDate: batch.startDate,
            endDate: batch.endDate,
            price: batch.price,
            originalPrice: batch.originalPrice,
            discountPercentage: batch.discountPercentage
        };

        res.status(200).json({
            success: true,
            data: statistics
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching batch statistics',
            error: error.message
        });
    }
};

module.exports = {
    getAllBatches,
    getBatchById,
    createBatch,
    updateBatch,
    deleteBatch,
    getBatchesByExamType,
    getFeaturedBatches,
    getPopularBatches,
    getActiveBatches,
    updateBatchRating,
    enrollStudent,
    updateEnrollment,
    getBatchStatistics
};

