const BookDemo = require('../models/bookdemo');
const Course = require('../models/courses');
const Centre = require('../models/Centremodel');

// @desc    Create a new demo booking
// @route   POST /api/bookdemo
// @access  Public
const createBookDemo = async (req, res) => {
    try {
        const { name, email, phone, course, centre, preferredDate, preferredTime, message } = req.body;

        // Validate required fields
        if (!name || !email || !phone || !course || !centre || !preferredDate || !preferredTime || !message) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Validate course exists
        const courseExists = await Course.findById(course);
        if (!courseExists) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Validate centre exists
        const centreExists = await Centre.findById(centre);
        if (!centreExists) {
            return res.status(404).json({
                success: false,
                message: 'Centre not found'
            });
        }

        // Validate date is in the future
        const selectedDate = new Date(preferredDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate <= today) {
            return res.status(400).json({
                success: false,
                message: 'Preferred date must be in the future'
            });
        }

        // Create booking
        const bookDemo = new BookDemo({
            name,
            email,
            phone,
            course,
            centre,
            preferredDate: selectedDate,
            preferredTime,
            message
        });

        await bookDemo.save();

        // Populate course and centre for response
        await bookDemo.populate('course', 'title category');
        await bookDemo.populate('centre', 'name address');

        res.status(201).json({
            success: true,
            message: 'Demo class booked successfully',
            data: bookDemo
        });
    } catch (error) {
        console.error('Error creating book demo:', error);
        res.status(500).json({
            success: false,
            message: 'Error booking demo class',
            error: error.message
        });
    }
};

// @desc    Get all demo bookings
// @route   GET /api/bookdemo
// @access  Private (Admin)
const getAllBookDemos = async (req, res) => {
    try {
        const {
            course,
            centre,
            status,
            page = 1,
            limit = 10,
            startDate,
            endDate
        } = req.query;

        const filter = {};

        if (course) filter.course = course;
        if (centre) filter.centre = centre;
        
        // Date range filter
        if (startDate || endDate) {
            filter.preferredDate = {};
            if (startDate) filter.preferredDate.$gte = new Date(startDate);
            if (endDate) filter.preferredDate.$lte = new Date(endDate);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const bookDemos = await BookDemo.find(filter)
            .populate('course', 'title category')
            .populate('centre', 'name address')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await BookDemo.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: bookDemos,
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
            message: 'Error fetching demo bookings',
            error: error.message
        });
    }
};

// @desc    Get demo booking by ID
// @route   GET /api/bookdemo/:id
// @access  Private (Admin)
const getBookDemoById = async (req, res) => {
    try {
        const bookDemo = await BookDemo.findById(req.params.id)
            .populate('course', 'title category description')
            .populate('centre', 'name address phone email');

        if (!bookDemo) {
            return res.status(404).json({
                success: false,
                message: 'Demo booking not found'
            });
        }

        res.status(200).json({
            success: true,
            data: bookDemo
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching demo booking',
            error: error.message
        });
    }
};

// @desc    Update demo booking status
// @route   PUT /api/bookdemo/:id
// @access  Private (Admin)
const updateBookDemo = async (req, res) => {
    try {
        const { status, notes } = req.body;

        const bookDemo = await BookDemo.findById(req.params.id);

        if (!bookDemo) {
            return res.status(404).json({
                success: false,
                message: 'Demo booking not found'
            });
        }

        // Update fields if provided
        if (status) bookDemo.status = status;
        if (notes) bookDemo.notes = notes;
        bookDemo.updatedAt = new Date();

        await bookDemo.save();

        await bookDemo.populate('course', 'title category');
        await bookDemo.populate('centre', 'name address');

        res.status(200).json({
            success: true,
            message: 'Demo booking updated successfully',
            data: bookDemo
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating demo booking',
            error: error.message
        });
    }
};

// @desc    Delete demo booking
// @route   DELETE /api/bookdemo/:id
// @access  Private (Admin)
const deleteBookDemo = async (req, res) => {
    try {
        const bookDemo = await BookDemo.findByIdAndDelete(req.params.id);

        if (!bookDemo) {
            return res.status(404).json({
                success: false,
                message: 'Demo booking not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Demo booking deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting demo booking',
            error: error.message
        });
    }
};

// @desc    Get current user's demo bookings
// @route   GET /api/bookdemo/me
// @access  Private (User)
const getMyBookings = async (req, res) => {
    try {
        const bookings = await BookDemo.find({ email: req.user.email })
            .populate('course', 'title category')
            .populate('centre', 'name address phone email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: bookings,
            count: bookings.length
        });
    } catch (error) {
        console.error('Error fetching user bookings:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching demo bookings',
            error: error.message
        });
    }
};

module.exports = {
    createBookDemo,
    getAllBookDemos,
    getBookDemoById,
    updateBookDemo,
    deleteBookDemo,
    getMyBookings
};

