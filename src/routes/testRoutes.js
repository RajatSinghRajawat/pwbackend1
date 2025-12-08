const express = require('express');
const router = express.Router();
const {
    getAllTests,
    getTestById,
    createTest,
    updateTest,
    deleteTest,
    publishTest
} = require('../controller/TestController');
const { authenticateUser, authenticateAdmin } = require('../middleware/auth');
const { validatePagination } = require('../middleware/validation');

// Protected routes (User/Admin)
router.get('/', validatePagination,  getAllTests);
router.get('/:id',  getTestById);

// Protected routes (Admin only)
router.post('/',  createTest);
router.put('/:id',  updateTest);
router.delete('/:id',  deleteTest);
router.put('/:id/publish',  publishTest);

module.exports = router;

