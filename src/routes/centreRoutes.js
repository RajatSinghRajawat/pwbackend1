const express = require('express');
const router = express.Router();
const {
    getAllCentres,
    getCentreById,
    createCentre,
    updateCentre,
    deleteCentre,
    findNearbyCentres
} = require('../controller/CentreController');
const { authenticateAdmin } = require('../middleware/auth');
const { validatePagination } = require('../middleware/validation');

// Public routes
router.get('/', validatePagination, getAllCentres);
router.get('/nearby', findNearbyCentres);
router.get('/:id', getCentreById);

// Protected routes (Admin only)
router.post('/',  createCentre);
router.put('/:id',  updateCentre);
router.delete('/:id',  deleteCentre);

module.exports = router;

