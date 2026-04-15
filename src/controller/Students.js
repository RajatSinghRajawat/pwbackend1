const Student = require('../models/Student');
const bcrypt = require('bcryptjs');

// @desc    Get all students
// @route   GET /api/students
// @access  Public (typically used in admin dashboard with admin token)
const getAllStudents = async (req, res) => {
    try {
        const {
            search,
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const filter = {};

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const students = await Student.find(filter)
            .select('-password')
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Student.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: students,
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
            message: 'Error fetching students',
            error: error.message
        });
    }
};

// @desc    Get student by ID
// @route   GET /api/students/:id
// @access  Public (typically used in admin dashboard with admin token)
const getStudentById = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id).select('-password');

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        res.status(200).json({
            success: true,
            data: student
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching student',
            error: error.message
        });
    }
};

// @desc    Create student
// @route   POST /api/students
// @access  Private (Admin)
const createStudent = async (req, res) => {
    try {
        const {
            name,
            lastName,
            email,
            phone,
            password,
            address,
            courses,
            batches,
            profilePicture
        } = req.body;

        // Check if student exists (by email or phone)
        const existingStudent = await Student.findOne({ $or: [{ email }, { phone }] });
        if (existingStudent) {
            return res.status(400).json({
                success: false,
                message: 'Student with this email or phone already exists'
            });
        }

        // Hash password before saving
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const student = new Student({
            name,
            lastName,
            email,
            phone,
            password: hashedPassword,
            address,
            courses,
            batches,
            profilePicture
        });

        const savedStudent = await student.save();
        savedStudent.password = undefined;

        res.status(201).json({
            success: true,
            message: 'Student created successfully',
            data: savedStudent
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating student',
            error: error.message
        });
    }
};

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Private (Admin)
const updateStudent = async (req, res) => {
    try {
        const updateData = { ...req.body, updatedAt: Date.now() };

        // If password is being updated, hash it
        if (updateData.password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(updateData.password, salt);
        }

        const student = await Student.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Student updated successfully',
            data: student
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating student',
            error: error.message
        });
    }
};

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Private (Admin)
const deleteStudent = async (req, res) => {
    try {
        const student = await Student.findByIdAndDelete(req.params.id);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Student deleted successfully',
            data: student
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting student',
            error: error.message
        });
    }
};

// @desc    Get current student's profile
// @route   GET /api/students/me
// @access  Private (Student)
const getMyProfile = async (req, res) => {
    try {
        // Find student by email from authenticated user
        const student = await Student.findOne({ email: req.user.email })
            .select('-password')
            .populate('courses', 'title description price')
            .populate('batches', 'title description');

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student profile not found. Please complete your profile.'
            });
        }

        res.status(200).json({
            success: true,
            data: student
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching student profile',
            error: error.message
        });
    }
};

// @desc    Create current student's profile
// @route   POST /api/students/me
// @access  Private (Student)
const createMyProfile = async (req, res) => {
    try {
        const {
            name,
            lastName,
            phone,
            address
        } = req.body;

        // Check if student already exists
        const existingStudent = await Student.findOne({ email: req.user.email });
        if (existingStudent) {
            return res.status(400).json({
                success: false,
                message: 'Student profile already exists'
            });
        }

        // Create student profile using authenticated user's email
        // Use a default password (user should use auth/password to change it)
        const salt = await bcrypt.genSalt(10);
        const defaultPassword = await bcrypt.hash('temp123', salt); // Temporary password

        const student = new Student({
            name: name || req.user.name,
            lastName: lastName || '',
            email: req.user.email,
            phone: phone || req.user.phone,
            password: defaultPassword, // Will be updated via auth/password route
            address: address || {}
        });

        const savedStudent = await student.save();
        savedStudent.password = undefined;

        res.status(201).json({
            success: true,
            message: 'Student profile created successfully',
            data: savedStudent
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating profile',
            error: error.message
        });
    }
};

// @desc    Update current student's profile
// @route   PUT /api/students/me
// @access  Private (Student)
const updateMyProfile = async (req, res) => {
    try {
        const updateData = { ...req.body, updatedAt: Date.now() };

        // Don't allow password update through this route (use auth/password)
        delete updateData.password;
        // Don't allow email update
        delete updateData.email;

        // Find student by email
        let student = await Student.findOne({ email: req.user.email });

        // If student doesn't exist, create it
        if (!student) {
            // Create student profile
            const salt = await bcrypt.genSalt(10);
            const defaultPassword = await bcrypt.hash('temp123', salt);

            student = new Student({
                name: updateData.name || req.user.name,
                lastName: updateData.lastName || '',
                email: req.user.email,
                phone: updateData.phone || req.user.phone,
                password: defaultPassword,
                address: updateData.address || {}
            });

            await student.save();
            student.password = undefined;
            student = await Student.findById(student._id)
                .select('-password')
                .populate('courses', 'title description price')
                .populate('batches', 'title description');

            return res.status(201).json({
                success: true,
                message: 'Profile created and updated successfully',
                data: student
            });
        }

        // Update existing student
        student = await Student.findOneAndUpdate(
            { email: req.user.email },
            updateData,
            { new: true, runValidators: true }
        ).select('-password').populate('courses', 'title description price').populate('batches', 'title description');

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: student
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating profile',
            error: error.message
        });
    }
};

module.exports = {
    getAllStudents,
    getStudentById,
    createStudent,
    updateStudent,
    deleteStudent,
    getMyProfile,
    createMyProfile,
    updateMyProfile
};

