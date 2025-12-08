const Order = require('../models/order');
const Course = require('../models/courses');
const Batch = require('../models/batch');
const Product = require('../models/store');

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private (Admin)
const getAllOrders = async (req, res) => {
    try {
        const {
            userId,
            status,
            paymentStatus,
            page = 1,
            limit = 10
        } = req.query;

        const filter = {};
        if (userId) filter.userId = userId;
        if (status) filter.status = status;
        if (paymentStatus) filter.paymentStatus = paymentStatus;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const orders = await Order.find(filter)
            .populate('userId', 'name email phone')
            .populate('items.itemId')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Order.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: orders,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching orders',
            error: error.message
        });
    }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('userId', 'name email phone')
            .populate('items.itemId');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check authorization
        if (req.user.role !== 'admin' && order.userId._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access this order'
            });
        }

        res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching order',
            error: error.message
        });
    }
};

// @desc    Create order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
    try {
        const { items, shippingAddress, paymentMethod } = req.body;
        const userId = req.user._id;

        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Order items are required'
            });
        }

        // Validate and calculate totals
        let subtotal = 0;
        const validatedItems = [];

        for (const item of items) {
            let product;
            if (item.itemType === 'course') {
                product = await Course.findById(item.itemId);
            } else if (item.itemType === 'batch') {
                product = await Batch.findById(item.itemId);
            } else if (item.itemType === 'store') {
                product = await Product.findById(item.itemId);
                if (!product.inStock || product.stock < item.quantity) {
                    return res.status(400).json({
                        success: false,
                        message: `${product.name} is out of stock`
                    });
                }
            }

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: `${item.itemType} not found`
                });
            }

            const itemTotal = (product.price || 0) * (item.quantity || 1);
            subtotal += itemTotal;

            validatedItems.push({
                itemType: item.itemType,
                itemId: item.itemId,
                name: product.title || product.name,
                price: product.price,
                quantity: item.quantity || 1
            });
        }

        const discount = 0; // Can be calculated based on coupons/promotions
        const tax = Math.round(subtotal * 0.18); // 18% GST
        const total = subtotal - discount + tax;

        const order = new Order({
            userId,
            items: validatedItems,
            subtotal,
            discount,
            tax,
            total,
            paymentMethod,
            shippingAddress,
            status: 'pending',
            paymentStatus: 'pending'
        });

        await order.save();
        await order.populate('userId items.itemId');

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: order
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating order',
            error: error.message
        });
    }
};

// @desc    Update order
// @route   PUT /api/orders/:id
// @access  Private (Admin)
const updateOrder = async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: Date.now() },
            { new: true, runValidators: true }
        )
            .populate('userId items.itemId');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Order updated successfully',
            data: order
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating order',
            error: error.message
        });
    }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check authorization
        if (req.user.role !== 'admin' && order.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to cancel this order'
            });
        }

        if (order.status === 'completed' || order.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel order in current status'
            });
        }

        order.status = 'cancelled';
        order.paymentStatus = order.paymentStatus === 'paid' ? 'refunded' : 'cancelled';
        await order.save();

        res.status(200).json({
            success: true,
            message: 'Order cancelled successfully',
            data: order
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error cancelling order',
            error: error.message
        });
    }
};

// @desc    Get my orders
// @route   GET /api/orders/my-orders
// @access  Private
const getMyOrders = async (req, res) => {
    try {
        const { status, paymentStatus, page = 1, limit = 10 } = req.query;

        const filter = { userId: req.user._id };
        if (status) filter.status = status;
        if (paymentStatus) filter.paymentStatus = paymentStatus;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const orders = await Order.find(filter)
            .populate('items.itemId')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Order.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: orders,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching orders',
            error: error.message
        });
    }
};

// @desc    Update order items (for cart)
// @route   PUT /api/orders/:id/items
// @access  Private
const updateOrderItems = async (req, res) => {
    try {
        const { items } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check authorization
        if (req.user.role !== 'admin' && order.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this order'
            });
        }

        // Validate and recalculate totals
        let subtotal = 0;
        const validatedItems = [];

        for (const item of items) {
            let product;
            if (item.itemType === 'course') {
                product = await Course.findById(item.itemId);
            } else if (item.itemType === 'batch') {
                product = await Batch.findById(item.itemId);
            } else if (item.itemType === 'store') {
                product = await Product.findById(item.itemId);
                if (!product.inStock || product.stock < item.quantity) {
                    return res.status(400).json({
                        success: false,
                        message: `${product.name} is out of stock`
                    });
                }
            }

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: `${item.itemType} not found`
                });
            }

            const itemTotal = (product.price || 0) * (item.quantity || 1);
            subtotal += itemTotal;

            validatedItems.push({
                itemType: item.itemType,
                itemId: item.itemId,
                name: product.title || product.name,
                price: product.price,
                quantity: item.quantity || 1
            });
        }

        const discount = order.discount || 0;
        const tax = Math.round(subtotal * 0.18); // 18% GST
        const total = subtotal - discount + tax;

        order.items = validatedItems;
        order.subtotal = subtotal;
        order.tax = tax;
        order.total = total;
        order.updatedAt = Date.now();

        await order.save();
        await order.populate('userId items.itemId');

        res.status(200).json({
            success: true,
            message: 'Order items updated successfully',
            data: order
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating order items',
            error: error.message
        });
    }
};

// @desc    Get user's cart (pending orders)
// @route   GET /api/orders/cart
// @access  Private
const getCart = async (req, res) => {
    try {
        const orders = await Order.find({
            userId: req.user._id,
            status: 'pending',
            paymentStatus: 'pending'
        })
            .populate('items.itemId')
            .sort({ createdAt: -1 });

        // Combine all items from pending orders into cart
        const cartItems = [];
        orders.forEach(order => {
            order.items.forEach((item, index) => {
                const product = item.itemId;
                // Use index as unique identifier if _id is not available
                const itemUniqueId = item._id || `${order._id}-${index}`;
                cartItems.push({
                    orderId: order._id.toString(),
                    itemId: itemUniqueId.toString(),
                    productId: product?._id?.toString() || item.itemId?.toString(),
                    itemType: item.itemType,
                    title: item.name || product?.title || product?.name || 'Product',
                    author: product?.author || '',
                    price: item.price,
                    originalPrice: product?.originalPrice || item.price,
                    quantity: item.quantity,
                    image: product?.thumbnail || product?.images?.[0] || (item.name || 'P').charAt(0),
                    stock: product?.stock !== undefined ? product.stock : undefined
                });
            });
        });

        // Calculate totals
        const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const totalSavings = cartItems.reduce((sum, item) => sum + ((item.originalPrice - item.price) * item.quantity), 0);
        const tax = Math.round(subtotal * 0.18);
        const total = subtotal + tax;

        res.status(200).json({
            success: true,
            data: {
                items: cartItems,
                subtotal,
                tax,
                total,
                totalSavings,
                orderCount: orders.length
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching cart',
            error: error.message
        });
    }
};

module.exports = {
    getAllOrders,
    getOrderById,
    createOrder,
    updateOrder,
    cancelOrder,
    getMyOrders,
    updateOrderItems,
    getCart
};

