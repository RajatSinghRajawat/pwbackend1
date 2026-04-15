const Product = require('../models/store');

// @desc    Get all products
// @route   GET /api/store/products
// @access  Public
const getAllProducts = async (req, res) => {
    try {
        const {
            category,
            isActive,
            isFeatured,
            isBestSeller,
            search,
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const filter = {};

        if (category) filter.category = category;
        if (isActive !== undefined) filter.isActive = isActive === 'true';
        if (isFeatured !== undefined) filter.isFeatured = isFeatured === 'true';
        if (isBestSeller !== undefined) filter.isBestSeller = isBestSeller === 'true';

        // Search functionality
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $regex: search, $options: 'i' } }
            ];
        }

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const products = await Product.find(filter)
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Product.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: products,
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
            message: 'Error fetching products',
            error: error.message
        });
    }
};

// @desc    Get product by ID
// @route   GET /api/store/products/:id
// @access  Public
const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching product',
            error: error.message
        });
    }
};

// @desc    Create product
// @route   POST /api/store/products
// @access  Private (Admin)
const createProduct = async (req, res) => {
    try {
        // Remove sku field if present to avoid duplicate key error
        delete req.body.sku;
        
        if (req.files) {
            if (req.files.image && req.files.image[0]) {
                const imagePath = `${req.files.image[0].filename}`;
                // Store main image also in images array
                req.body.images = [imagePath];
                req.body.thumbnail = req.body.thumbnail || imagePath;
            }
            if (req.files.thumbnail && req.files.thumbnail[0]) {
                req.body.thumbnail = `${req.files.thumbnail[0].filename}`;
            }
        }

        // Ensure title is set (backend requires both name and title)
        if (!req.body.title && req.body.name) {
            req.body.title = req.body.name;
        }

        const product = new Product(req.body);
        const savedProduct = await product.save();

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: savedProduct
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating product',
            error: error.message
        });
    }
};

// @desc    Update product
// @route   PUT /api/store/products/:id
// @access  Private (Admin)
const updateProduct = async (req, res) => {
    try {
        // Remove sku field if present to avoid duplicate key error
        delete req.body.sku;
        
        if (req.files) {
            if (req.files.image && req.files.image[0]) {
                const imagePath = `${req.files.image[0].filename}`;
                req.body.images = [imagePath];
                req.body.thumbnail = req.body.thumbnail || imagePath;
            }
            if (req.files.thumbnail && req.files.thumbnail[0]) {
                req.body.thumbnail = `${req.files.thumbnail[0].filename}`;
            }
        }

        if (!req.body.title && req.body.name) {
            req.body.title = req.body.name;
        }

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: Date.now() },
            { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Product updated successfully',
            data: product
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating product',
            error: error.message
        });
    }
};

// @desc    Delete product
// @route   DELETE /api/store/products/:id
// @access  Private (Admin)
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Product deleted successfully',
            data: product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting product',
            error: error.message
        });
    }
};

// @desc    Get products by category
// @route   GET /api/store/products/category/:category
// @access  Public
const getProductsByCategory = async (req, res) => {
    try {
        const products = await Product.find({
            category: req.params.category,
            isActive: true
        })
            .sort({ rating: -1, createdAt: -1 });

        res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching products by category',
            error: error.message
        });
    }
};

// @desc    Update stock
// @route   PUT /api/store/products/:id/stock
// @access  Private (Admin)
const updateStock = async (req, res) => {
    try {
        const { stock } = req.body;

        if (isNaN(stock) || stock < 0) {
            return res.status(400).json({
                success: false,
                message: 'Stock must be a non-negative number'
            });
        }

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { stock, updatedAt: Date.now() },
            { new: true }
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Stock updated successfully',
            data: product
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating stock',
            error: error.message
        });
    }
};

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductsByCategory,
    updateStock
};

