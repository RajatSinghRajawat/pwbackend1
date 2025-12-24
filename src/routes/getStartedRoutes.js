const express = require('express');
const router = express.Router();
const {
    createGetStarted,
    getAllGetStarted,
    getGetStartedById,
    updateGetStarted,
    deleteGetStarted,
    getStats
} = require('../controller/getStartedController');
const { authenticateAdmin } = require('../middleware/auth');

// Public routes
router.post('/', createGetStarted);

// Protected routes (Admin only)
router.get('/', authenticateAdmin, getAllGetStarted);
router.get('/stats/overview', authenticateAdmin, getStats);
router.get('/:id', authenticateAdmin, getGetStartedById);
router.put('/:id', authenticateAdmin, updateGetStarted);
router.delete('/:id', authenticateAdmin, deleteGetStarted);

module.exports = router;

