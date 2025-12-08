const express = require('express');
const router = express.Router();
const {
    createBookDemo,
    getAllBookDemos,
    getBookDemoById,
    updateBookDemo,
    deleteBookDemo
} = require('../controller/bookdemo');
const { authenticateUser, authenticateAdmin } = require('../middleware/auth');

// Public routes
router.post('/', createBookDemo);

// Protected routes (Admin only)
router.get('/', authenticateAdmin, getAllBookDemos);
router.get('/:id', authenticateAdmin, getBookDemoById);
router.put('/:id', authenticateAdmin, updateBookDemo);
router.delete('/:id', authenticateAdmin, deleteBookDemo);

module.exports = router;

