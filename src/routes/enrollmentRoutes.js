const express = require('express');
const router = express.Router();
const {
    getAllEnrollments,
    getEnrollmentById,
    createEnrollment,
    updateEnrollment,
    deleteEnrollment,
    getMyEnrollments,
    updateProgress
} = require('../controller/EnrollmentController');
const { authenticateUser, authenticateAdmin } = require('../middleware/auth');

// Public routes - none

// Protected routes (User/Admin)
router.get('/my-enrollments', authenticateUser, getMyEnrollments);
router.get('/:id', authenticateUser, getEnrollmentById);
router.post('/', authenticateUser, createEnrollment);
router.put('/:id/progress', authenticateUser, updateProgress);

// Protected routes (Admin only)
router.get('/',  getAllEnrollments);
router.put('/:id',  updateEnrollment);
router.delete('/:id',  deleteEnrollment);

module.exports = router;

