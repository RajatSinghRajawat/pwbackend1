const express = require('express');
const router = express.Router();
const {
    getAllOrders,
    getOrderById,
    createOrder,
    updateOrder,
    cancelOrder,
    getMyOrders,
    updateOrderItems,
    getCart
} = require('../controller/OrderController');
const { authenticateUser, authenticateAdmin } = require('../middleware/auth');

// Protected routes (User/Admin)
router.get('/cart', authenticateUser, getCart);
router.get('/my-orders', authenticateUser, getMyOrders);
router.get('/:id', authenticateUser, getOrderById);
router.post('/', authenticateUser, createOrder);
router.put('/:id/items', authenticateUser, updateOrderItems);
router.put('/:id/cancel', authenticateUser, cancelOrder);

// Protected routes (Admin only)
router.get('/',  getAllOrders);
router.put('/:id',  updateOrder);

module.exports = router;

