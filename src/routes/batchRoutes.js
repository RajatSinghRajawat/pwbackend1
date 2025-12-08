const express = require('express');
const router = express.Router();
const {
    getAllBatches,
    getBatchById,
    createBatch,
    updateBatch,
    deleteBatch,
    getBatchesByExamType,
    getFeaturedBatches,
    getPopularBatches,
    getActiveBatches,
    updateBatchRating,
    enrollStudent,
    updateEnrollment,
    getBatchStatistics
} = require('../controller/Batches');
const { validateBatch, validatePagination } = require('../middleware/validation');
const { authenticateUser, authenticateAdmin } = require('../middleware/auth');

// Public routes
router.get('/', validatePagination, getAllBatches);
router.get('/featured', getFeaturedBatches);
router.get('/popular', getPopularBatches);
router.get('/active', getActiveBatches);
router.get('/exam/:examType', getBatchesByExamType);
router.get('/:id', validateBatch.getById, getBatchById);

// Protected routes (User/Admin)
router.post('/:id/enroll', authenticateUser, enrollStudent);
router.put('/:id/rating', authenticateUser, updateBatchRating);

// Protected routes (Admin only)
router.post('/',  validateBatch.create, createBatch);
router.put('/:id',  validateBatch.update, updateBatch);
router.delete('/:id',  validateBatch.delete, deleteBatch);
router.put('/:id/enrollment', updateEnrollment);
router.get('/:id/statistics',  validateBatch.getById, getBatchStatistics);

module.exports = router;

