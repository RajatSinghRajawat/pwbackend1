const express = require('express');
const router = express.Router();
const {
    getAllStudents,
    getStudentById,
    createStudent,
    updateStudent,
    deleteStudent,
    getMyProfile,
    createMyProfile,
    updateMyProfile
} = require('../controller/Students');
const { authenticateAdmin, authenticateUser } = require('../middleware/auth');
const { validatePagination } = require('../middleware/validation');

// Public routes (can be used by admin dashboard or other services)
router.get('/', validatePagination, getAllStudents);

// Student's own profile routes (Authenticated users)
router.get('/me', authenticateUser, getMyProfile);
router.post('/me', authenticateUser, createMyProfile);
router.put('/me', authenticateUser, updateMyProfile);

// Protected routes (Admin only)
router.get('/:id', authenticateAdmin, getStudentById);
router.post('/', authenticateAdmin, createStudent);
router.put('/:id', authenticateAdmin, updateStudent);
router.delete('/:id', authenticateAdmin, deleteStudent);

module.exports = router;

