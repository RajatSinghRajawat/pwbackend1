const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true
    },
    title: {
        type: String,
        required: [true, 'Product title is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true
    },
    category: {
        type: String,
        enum: ['books', 'stationery', 'test-series', 'study-material', 'merchandise', 'other'],
        required: [true, 'Category is required']
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: 0
    },
    originalPrice: {
        type: Number,
        required: [true, 'Original price is required'],
        min: 0
    },
    discountPercentage: {
        type: Number,
        default: 0
    },
    stock: {
        type: Number,
        default: 0,
        min: 0
    },
    sku: {
        type: String,
        unique: true,
        trim: true
    },
    images: [{
        type: String,
        trim: true
    }],
    thumbnail: {
        type: String,
        trim: true
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    ratingCount: {
        type: Number,
        default: 0
    },
    reviews: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        rating: Number,
        comment: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    features: [{
        type: String,
        trim: true
    }],
    specifications: {
        type: Map,
        of: String
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    isBestSeller: {
        type: Boolean,
        default: false
    },
    tags: [{
        type: String,
        trim: true
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    }
}, {
    timestamps: true
});

// Indexes
productSchema.index({ category: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ isBestSeller: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ name: 'text', title: 'text', description: 'text' });

// Pre-save middleware to calculate discount
productSchema.pre('save', function(next) {
    if (this.isModified('price') || this.isModified('originalPrice')) {
        if (this.originalPrice > 0) {
            this.discountPercentage = Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
        }
    }
    next();
});

// Virtual for inStock
productSchema.virtual('inStock').get(function() {
    return this.stock > 0;
});

// Ensure virtuals are serialized
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

const Product = mongoose.model('Product', productSchema);
// Also register as 'store' (lowercase) for refPath compatibility with order model
// refPath uses the itemType value which is 'store' (lowercase)
if (!mongoose.models.store) {
    mongoose.model('store', productSchema);
}

module.exports = Product;

