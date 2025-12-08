const Instructor = require('../models/instructor');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// @desc    Get all instructors
// @route   GET /api/instructors
// @access  Public
const getAllInstructors = async (req, res) => {
    try {
        const {
            specialization,
            isActive,
            isVerified,
            search,
            page = 1,
            limit = 10,
            sortBy = 'rating',
            sortOrder = 'desc'
        } = req.query;

        const filter = {};

        if (specialization) filter.specialization = specialization;
        if (isActive !== undefined) filter.isActive = isActive === 'true';
        if (isVerified !== undefined) filter.isVerified = isVerified === 'true';

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { specialization: { $regex: search, $options: 'i' } }
            ];
        }

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const instructors = await Instructor.find(filter)
            .select('-password')
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Instructor.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: instructors,
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
            message: 'Error fetching instructors',
            error: error.message
        });
    }
};

// @desc    Get instructor by ID
// @route   GET /api/instructors/:id
// @access  Public
const getInstructorById = async (req, res) => {
    try {
        const instructor = await Instructor.findById(req.params.id)
            .select('-password');

        if (!instructor) {
            return res.status(404).json({
                success: false,
                message: 'Instructor not found'
            });
        }

        res.status(200).json({
            success: true,
            data: instructor
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching instructor',
            error: error.message
        });
    }
};

// @desc    Create instructor
// @route   POST /api/instructors
// @access  Private (Admin)
const createInstructor = async (req, res) => {
    try {
        const { name, email, password, phone, specialization, qualifications, bio } = req.body;

        // Check if instructor exists
        const existingInstructor = await Instructor.findOne({ $or: [{ email }, { phone }] });
        if (existingInstructor) {
            return res.status(400).json({
                success: false,
                message: 'Instructor with this email or phone already exists'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const instructor = new Instructor({
            name,
            email,
            password: hashedPassword,
            phone,
            specialization: specialization || [],
            qualifications: qualifications || [],
            bio
        });

        const savedInstructor = await instructor.save();

        // Remove password from response
        savedInstructor.password = undefined;

        res.status(201).json({
            success: true,
            message: 'Instructor created successfully',
            data: savedInstructor
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating instructor',
            error: error.message
        });
    }
};

// @desc    Update instructor
// @route   PUT /api/instructors/:id
// @access  Private (Admin)
const updateInstructor = async (req, res) => {
    try {
        const instructor = await Instructor.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: Date.now() },
            { new: true, runValidators: true }
        ).select('-password');

        if (!instructor) {
            return res.status(404).json({
                success: false,
                message: 'Instructor not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Instructor updated successfully',
            data: instructor
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating instructor',
            error: error.message
        });
    }
};

// @desc    Delete instructor
// @route   DELETE /api/instructors/:id
// @access  Private (Admin)
const deleteInstructor = async (req, res) => {
    try {
        const instructor = await Instructor.findByIdAndDelete(req.params.id);

        if (!instructor) {
            return res.status(404).json({
                success: false,
                message: 'Instructor not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Instructor deleted successfully',
            data: instructor
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting instructor',
            error: error.message
        });
    }
};

// @desc    Login instructor
// @route   POST /api/instructors/login
// @access  Public
const loginInstructor = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        const instructor = await Instructor.findOne({ email }).select('+password');

        if (!instructor) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        if (!instructor.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Your account has been deactivated'
            });
        }

        const isMatch = await bcrypt.compare(password, instructor.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const token = jwt.sign(
            { id: instructor._id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: process.env.JWT_EXPIRE || '30d' }
        );

        instructor.password = undefined;

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                instructor,
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
};

module.exports = {
    getAllInstructors,
    getInstructorById,
    createInstructor,
    updateInstructor,
    deleteInstructor,
    loginInstructor
};

