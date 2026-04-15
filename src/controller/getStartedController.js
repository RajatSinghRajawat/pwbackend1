const GetStarted = require('../models/getStarted');
const Course = require('../models/courses');
const Centre = require('../models/Centremodel');

// @desc    Create a new get started form submission
// @route   POST /api/get-started
// @access  Public
const createGetStarted = async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            grade,
            course,
            centre,
            goals,
            experience,
            budget,
            preferredTime,
            message
        } = req.body;

        // Validate required fields
        if (!name || !email || !phone || !grade || !course || !goals) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, phone, grade, course, and goals are required fields'
            });
        }

        // Validate email format
        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }

        // Validate phone format (10 digits)
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid 10-digit phone number'
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

        // Validate centre exists if provided
        if (centre) {
            const centreExists = await Centre.findById(centre);
            if (!centreExists) {
                return res.status(404).json({
                    success: false,
                    message: 'Centre not found'
                });
            }
        }

        // Check if email already exists
        const existingSubmission = await GetStarted.findOne({ email });
        if (existingSubmission) {
            return res.status(400).json({
                success: false,
                message: 'A submission with this email already exists'
            });
        }

        // Create get started submission
        const getStarted = new GetStarted({
            name,
            email,
            phone: phone.replace(/\D/g, ''), // Remove non-digits
            grade,
            course,
            centre: centre || null,
            goals,
            experience: experience || '',
            budget: budget || '',
            preferredTime: preferredTime || '',
            message: message || '',
            status: 'pending'
        });

        await getStarted.save();

        // Populate course and centre for response
        await getStarted.populate('course', 'title category');
        if (getStarted.centre) {
            await getStarted.populate('centre', 'name city');
        }

        res.status(201).json({
            success: true,
            message: 'Form submitted successfully. Our team will contact you soon!',
            data: getStarted
        });
    } catch (error) {
        console.error('Error creating get started submission:', error);
        res.status(500).json({
            success: false,
            message: 'Error submitting form',
            error: error.message
        });
    }
};

// @desc    Get all get started submissions
// @route   GET /api/get-started
// @access  Private (Admin)
const getAllGetStarted = async (req, res) => {
    try {
        const {
            status,
            course,
            centre,
            grade,
            page = 1,
            limit = 10,
            startDate,
            endDate,
            search
        } = req.query;

        const filter = {};

        if (status) filter.status = status;
        if (course) filter.course = course;
        if (centre) filter.centre = centre;
        if (grade) filter.grade = grade;

        // Date range filter
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        // Search filter
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const submissions = await GetStarted.find(filter)
            .populate('course', 'title category')
            .populate('centre', 'name city address')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await GetStarted.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: submissions,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching get started submissions:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching submissions',
            error: error.message
        });
    }
};

// @desc    Get get started submission by ID
// @route   GET /api/get-started/:id
// @access  Private (Admin)
const getGetStartedById = async (req, res) => {
    try {
        const submission = await GetStarted.findById(req.params.id)
            .populate('course', 'title category description price')
            .populate('centre', 'name address city state phone email');

        if (!submission) {
            return res.status(404).json({
                success: false,
                message: 'Submission not found'
            });
        }

        res.status(200).json({
            success: true,
            data: submission
        });
    } catch (error) {
        console.error('Error fetching get started submission:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching submission',
            error: error.message
        });
    }
};

// @desc    Update get started submission status
// @route   PUT /api/get-started/:id
// @access  Private (Admin)
const updateGetStarted = async (req, res) => {
    try {
        const { status, notes, contactedAt, enrolledAt } = req.body;

        const submission = await GetStarted.findById(req.params.id);

        if (!submission) {
            return res.status(404).json({
                success: false,
                message: 'Submission not found'
            });
        }

        // Update fields if provided
        if (status) submission.status = status;
        if (notes !== undefined) submission.notes = notes;
        if (contactedAt) submission.contactedAt = new Date(contactedAt);
        if (enrolledAt) submission.enrolledAt = new Date(enrolledAt);
        
        submission.updatedAt = new Date();

        await submission.save();

        await submission.populate('course', 'title category');
        if (submission.centre) {
            await submission.populate('centre', 'name city');
        }

        res.status(200).json({
            success: true,
            message: 'Submission updated successfully',
            data: submission
        });
    } catch (error) {
        console.error('Error updating get started submission:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating submission',
            error: error.message
        });
    }
};

// @desc    Get current user's get started submissions
// @route   GET /api/get-started/me
// @access  Private (Student)
const getMySubmissions = async (req, res) => {
    try {
        const submissions = await GetStarted.find({ email: req.user.email })
            .populate('course', 'title category')
            .populate('centre', 'name city address')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: submissions,
            count: submissions.length
        });
    } catch (error) {
        console.error('Error fetching user submissions:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching submissions',
            error: error.message
        });
    }
};

// @desc    Delete get started submission
// @route   DELETE /api/get-started/:id
// @access  Private (Admin)
const deleteGetStarted = async (req, res) => {
    try {
        const submission = await GetStarted.findByIdAndDelete(req.params.id);

        if (!submission) {
            return res.status(404).json({
                success: false,
                message: 'Submission not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Submission deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting get started submission:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting submission',
            error: error.message
        });
    }
};

// @desc    Get statistics for get started submissions
// @route   GET /api/get-started/stats/overview
// @access  Private (Admin)
const getStats = async (req, res) => {
    try {
        const total = await GetStarted.countDocuments();
        const pending = await GetStarted.countDocuments({ status: 'pending' });
        const contacted = await GetStarted.countDocuments({ status: 'contacted' });
        const enrolled = await GetStarted.countDocuments({ status: 'enrolled' });
        const notInterested = await GetStarted.countDocuments({ status: 'not-interested' });

        // Get submissions by course
        const byCourse = await GetStarted.aggregate([
            {
                $group: {
                    _id: '$course',
                    count: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'courses',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'course'
                }
            },
            {
                $unwind: '$course'
            },
            {
                $project: {
                    courseName: '$course.title',
                    count: 1
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $limit: 10
            }
        ]);

        // Get submissions by grade
        const byGrade = await GetStarted.aggregate([
            {
                $group: {
                    _id: '$grade',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                total,
                pending,
                contacted,
                enrolled,
                notInterested,
                byCourse,
                byGrade
            }
        });
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics',
            error: error.message
        });
    }
};

module.exports = {
    createGetStarted,
    getAllGetStarted,
    getGetStartedById,
    updateGetStarted,
    deleteGetStarted,
    getStats,
    getMySubmissions
};

