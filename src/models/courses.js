const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        enum: ['jee', 'neet', 'gate', 'upsc', 'defence', 'ese', 'foundation', 'commerce', 'arts', 'tech', 'business', 'design', 'marketing', 'data', 'other'],
        required: true
    },
    
    // Pricing
    price: {
        type: Number,
        required: true
    },
    originalPrice: {
        type: Number,
        required: true
    },
    discountPercentage: {
        type: Number,
        default: 0
    },
    
    // Statistics
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
    students: {
        type: Number,
        default: 0
    },
    
    // Features
    features: {
        type: [String],
        default: []
    },
    
    // Additional Fields (Optional - for upskilling courses)
    duration: {
        type: String,
        trim: true // e.g., "6 months", "8 months"
    },
    instructor: {
        type: String,
        trim: true
    },
    level: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'expert'],
        default: 'intermediate'
    },
    
    // Media
    image: {
        type: String,
        trim: true
    },
    thumbnail: {
        type: String,
        trim: true
    },
    date: {
        type: String,
        trim: true // e.g., "Starting 20th April", "2024-04-20"
    },
    
    // Status
    isActive: {
        type: Boolean,
        default: true
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    isPopular: {
        type: Boolean,
        default: false
    },
    
    // Metadata
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
})

// Indexes
courseSchema.index({ category: 1 });
courseSchema.index({ isActive: 1 });
courseSchema.index({ isFeatured: 1 });
courseSchema.index({ isPopular: 1 });
courseSchema.index({ rating: -1 });
courseSchema.index({ students: -1 });

// Pre-save middleware to calculate discount percentage
courseSchema.pre('save', function(next) {
    if (this.isModified('price') || this.isModified('originalPrice')) {
        if (this.originalPrice > 0) {
            this.discountPercentage = Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
        }
    }
    this.updatedAt = Date.now();
    next();
});

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;