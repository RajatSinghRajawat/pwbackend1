const Course = require('../models/courses');

// @desc    Get all courses
// @route   GET /api/courses
// @access  Public
const getAllCourses = async (req, res) => {
    try {
        const {
            category,
            isActive,
            isFeatured,
            isPopular,
            search,
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build filter object
        const filter = {};

        if (category) filter.category = category;
        if (isActive !== undefined) filter.isActive = isActive === 'true';
        if (isFeatured !== undefined) filter.isFeatured = isFeatured === 'true';
        if (isPopular !== undefined) filter.isPopular = isPopular === 'true';

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

        // Fetch courses with pagination
        const courses = await Course.find(filter)
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count
        const total = await Course.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: courses,
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
            message: 'Error fetching courses',
            error: error.message
        });
    }
};

// @desc    Get single course by ID
// @route   GET /api/courses/:id
// @access  Public
const getCourseById = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        res.status(200).json({
            success: true,
            data: course
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching course',
            error: error.message
        });
    }
};

// @desc    Create new course
// @route   POST /api/courses
// @access  Private (Admin)
const createCourse = async (req, res) => {
    try {
        // Handle uploaded images
        if (req.files) {
            if (req.files.image && req.files.image[0]) {
                req.body.image = `/Uploads/${req.files.image[0].filename}`;
            }
            if (req.files.thumbnail && req.files.thumbnail[0]) {
                req.body.thumbnail = `/Uploads/${req.files.thumbnail[0].filename}`;
            }
        }

        // Calculate discount percentage if not provided
        if (!req.body.discountPercentage && req.body.price && req.body.originalPrice) {
            req.body.discountPercentage = Math.round(
                ((req.body.originalPrice - req.body.price) / req.body.originalPrice) * 100
            );
        }

        // Set createdBy if admin is authenticated
        if (req.admin && req.admin._id) {
            req.body.createdBy = req.admin._id;
            req.body.updatedBy = req.admin._id;
        }

        const course = new Course(req.body);
        const savedCourse = await course.save();

        res.status(201).json({
            success: true,
            message: 'Course created successfully',
            data: savedCourse
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating course',
            error: error.message
        });
    }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private (Admin)
const updateCourse = async (req, res) => {
    try {
        // Handle uploaded images
        if (req.files) {
            if (req.files.image && req.files.image[0]) {
                req.body.image = `/Uploads/${req.files.image[0].filename}`;
            }
            if (req.files.thumbnail && req.files.thumbnail[0]) {
                req.body.thumbnail = `/Uploads/${req.files.thumbnail[0].filename}`;
            }
        }

        // Calculate discount percentage if price updated
        if (req.body.price && req.body.originalPrice && !req.body.discountPercentage) {
            req.body.discountPercentage = Math.round(
                ((req.body.originalPrice - req.body.price) / req.body.originalPrice) * 100
            );
        }

        // Set updatedBy if admin is authenticated
        if (req.admin && req.admin._id) {
            req.body.updatedBy = req.admin._id;
        }

        const course = await Course.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: Date.now() },
            { new: true, runValidators: true }
        );

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Course updated successfully',
            data: course
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating course',
            error: error.message
        });
    }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private (Admin)
const deleteCourse = async (req, res) => {
    try {
        const course = await Course.findByIdAndDelete(req.params.id);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Course deleted successfully',
            data: course
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting course',
            error: error.message
        });
    }
};

// @desc    Get courses by category
// @route   GET /api/courses/category/:category
// @access  Public
const getCoursesByCategory = async (req, res) => {
    try {
        const courses = await Course.find({
            category: req.params.category,
            isActive: true
        })
            .sort({ rating: -1, students: -1 });

        res.status(200).json({
            success: true,
            count: courses.length,
            data: courses
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching courses by category',
            error: error.message
        });
    }
};

// @desc    Get featured courses
// @route   GET /api/courses/featured
// @access  Public
const getFeaturedCourses = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const courses = await Course.find({
            isActive: true,
            isFeatured: true
        })
            .sort({ rating: -1, students: -1 })
            .limit(limit);

        res.status(200).json({
            success: true,
            count: courses.length,
            data: courses
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching featured courses',
            error: error.message
        });
    }
};

// @desc    Get popular courses
// @route   GET /api/courses/popular
// @access  Public
const getPopularCourses = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const courses = await Course.find({
            isActive: true,
            isPopular: true
        })
            .sort({ students: -1, rating: -1 })
            .limit(limit);

        res.status(200).json({
            success: true,
            count: courses.length,
            data: courses
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching popular courses',
            error: error.message
        });
    }
};

// @desc    Update course rating
// @route   PUT /api/courses/:id/rating
// @access  Private
const updateCourseRating = async (req, res) => {
    try {
        const { rating, ratingCount } = req.body;

        if (rating < 0 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 0 and 5'
            });
        }

        const course = await Course.findByIdAndUpdate(
            req.params.id,
            { rating, ratingCount: ratingCount || 0 },
            { new: true, runValidators: true }
        );

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Course rating updated successfully',
            data: course
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating course rating',
            error: error.message
        });
    }
};

// @desc    Increment student count
// @route   PUT /api/courses/:id/students
// @access  Private
const incrementStudentCount = async (req, res) => {
    try {
        const { count = 1 } = req.body;

        const course = await Course.findByIdAndUpdate(
            req.params.id,
            { $inc: { students: count } },
            { new: true }
        );

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Student count updated successfully',
            data: course
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating student count',
            error: error.message
        });
    }
};

module.exports = {
    getAllCourses,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse,
    getCoursesByCategory,
    getFeaturedCourses,
    getPopularCourses,
    updateCourseRating,
    incrementStudentCount
};

