const express = require('express');
const router = express.Router();
const {
    getAllInstructors,
    getInstructorById,
    createInstructor,
    updateInstructor,
    deleteInstructor,
    loginInstructor
} = require('../controller/InstructorController');
const { authenticateAdmin } = require('../middleware/auth');
const { validatePagination } = require('../middleware/validation');

// Public routes
router.get('/', validatePagination, getAllInstructors);
router.get('/:id', getInstructorById);
router.post('/login', loginInstructor);

// Protected routes (Admin only)
router.post('/',  createInstructor);
router.put('/:id',  updateInstructor);
router.delete('/:id',  deleteInstructor);

module.exports = router;

