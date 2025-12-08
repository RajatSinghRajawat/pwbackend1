const Test = require('../models/test');
const Enrollment = require('../models/enrollment');

// @desc    Get all tests
// @route   GET /api/tests
// @access  Public
const getAllTests = async (req, res) => {
    try {
        const {
            examType,
            testType,
            courseId,
            batchId,
            isActive,
            isPublished,
            page = 1,
            limit = 10
        } = req.query;

        const filter = {};

        if (examType) filter.examType = examType;
        if (testType) filter.testType = testType;
        if (courseId) filter.courseId = courseId;
        if (batchId) filter.batchId = batchId;
        if (isActive !== undefined) filter.isActive = isActive === 'true';
        if (isPublished !== undefined) filter.isPublished = isPublished === 'true';

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const tests = await Test.find(filter)
            .populate('courseId', 'title category')
            .populate('batchId', 'title examType')
            .select('-questions.correctAnswer') // Don't send correct answers in list
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Test.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: tests,
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
            message: 'Error fetching tests',
            error: error.message
        });
    }
};

// @desc    Get test by ID
// @route   GET /api/tests/:id
// @access  Private
const getTestById = async (req, res) => {
    try {
        const test = await Test.findById(req.params.id)
            .populate('courseId batchId createdBy');

        if (!test) {
            return res.status(404).json({
                success: false,
                message: 'Test not found'
            });
        }

        // Check if user is enrolled (for students)
        if (req.user && req.user.role === 'student') {
            if (test.courseId) {
                const enrollment = await Enrollment.findOne({
                    userId: req.user._id,
                    courseId: test.courseId,
                    status: 'active'
                });
                if (!enrollment) {
                    return res.status(403).json({
                        success: false,
                        message: 'You must be enrolled in the course to access this test'
                    });
                }
            }
            if (test.batchId) {
                const enrollment = await Enrollment.findOne({
                    userId: req.user._id,
                    batchId: test.batchId,
                    status: 'active'
                });
                if (!enrollment) {
                    return res.status(403).json({
                        success: false,
                        message: 'You must be enrolled in the batch to access this test'
                    });
                }
            }
        }

        // Don't send correct answers unless admin or after submission
        if (req.user && req.user.role !== 'admin') {
            test.questions = test.questions.map(q => ({
                ...q.toObject(),
                correctAnswer: undefined
            }));
        }

        res.status(200).json({
            success: true,
            data: test
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching test',
            error: error.message
        });
    }
};

// @desc    Create test
// @route   POST /api/tests
// @access  Private (Admin)
const createTest = async (req, res) => {
    try {
        const test = new Test(req.body);
        const savedTest = await test.save();
        await savedTest.populate('courseId batchId createdBy');

        res.status(201).json({
            success: true,
            message: 'Test created successfully',
            data: savedTest
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating test',
            error: error.message
        });
    }
};

// @desc    Update test
// @route   PUT /api/tests/:id
// @access  Private (Admin)
const updateTest = async (req, res) => {
    try {
        const test = await Test.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: Date.now() },
            { new: true, runValidators: true }
        )
            .populate('courseId batchId createdBy');

        if (!test) {
            return res.status(404).json({
                success: false,
                message: 'Test not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Test updated successfully',
            data: test
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating test',
            error: error.message
        });
    }
};

// @desc    Delete test
// @route   DELETE /api/tests/:id
// @access  Private (Admin)
const deleteTest = async (req, res) => {
    try {
        const test = await Test.findByIdAndDelete(req.params.id);

        if (!test) {
            return res.status(404).json({
                success: false,
                message: 'Test not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Test deleted successfully',
            data: test
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting test',
            error: error.message
        });
    }
};

// @desc    Publish test
// @route   PUT /api/tests/:id/publish
// @access  Private (Admin)
const publishTest = async (req, res) => {
    try {
        const test = await Test.findByIdAndUpdate(
            req.params.id,
            { isPublished: true, updatedAt: Date.now() },
            { new: true }
        );

        if (!test) {
            return res.status(404).json({
                success: false,
                message: 'Test not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Test published successfully',
            data: test
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error publishing test',
            error: error.message
        });
    }
};

module.exports = {
    getAllTests,
    getTestById,
    createTest,
    updateTest,
    deleteTest,
    publishTest
};

