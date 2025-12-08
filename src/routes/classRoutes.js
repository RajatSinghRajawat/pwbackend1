const express = require('express');
const router = express.Router();
const {
    getAllClasses,
    getClassById,
    createClass,
    updateClass,
    deleteClass,
    joinClass,
    getLiveClasses
} = require('../controller/ClassController');
const { authenticateUser, authenticateAdmin, authorize } = require('../middleware/auth');
const { validatePagination } = require('../middleware/validation');

// Public routes
router.get('/live', getLiveClasses);
router.get('/', validatePagination, getAllClasses); // Public - anyone can view classes
router.get('/:id', getClassById); // Public - but checks enrollment if user is logged in
router.post('/:id/join', authenticateUser, joinClass);

// Protected routes (Admin/Instructor)
router.post('/', authenticateAdmin, createClass);
router.put('/:id', authenticateAdmin, updateClass);

// Protected routes (Admin only)
router.delete('/:id',  deleteClass);

module.exports = router;

