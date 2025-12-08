const express = require('express');
const router = express.Router();
const {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductsByCategory,
    updateStock
} = require('../controller/StoreController');
const { authenticateAdmin } = require('../middleware/auth');
const { validatePagination } = require('../middleware/validation');
const { fieldsImages } = require('../../multer');

// Public routes
router.get('/', validatePagination, getAllProducts);
router.get('/category/:category', getProductsByCategory);
router.get('/products/:id', getProductById);

// Protected routes (Admin only)
router.post('/products', authenticateAdmin, fieldsImages, createProduct);
router.put('/products/:id', authenticateAdmin, fieldsImages, updateProduct);
router.delete('/products/:id',  deleteProduct);
router.put('/products/:id/stock',  updateStock);

module.exports = router;

