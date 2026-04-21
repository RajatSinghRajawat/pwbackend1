const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
    // Basic Information
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

    // Course & Exam Details
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    examType: {
        type: String,
        enum: ['jee', 'neet', 'gate', 'upsc', 'defence', 'ese', 'foundation', 'commerce', 'arts', 'other'],
        required: true
    },
    batchType: {
        type: String,
        enum: ['power', 'regular', 'crash', 'foundation', 'advanced', 'revision'],
        default: 'regular'
    },

    // Duration & Schedule
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    duration: {
        type: String,
        required: true,
        trim: true // e.g., "12 months", "6 months"
    },

    // Class Details
    totalClasses: {
        type: Number,
        required: true,
        default: 0
    },

    // Student Capacity
    maxStudents: {
        type: Number,
        required: true
    },
    enrolledStudents: {
        type: Number,
        default: 0
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

    // Features
    features: {
        type: [String],
        default: []
    },

    // Ratings & Reviews
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

    // Media
    image: {
        type: String,
        trim: true
    },
    thumbnail: {
        type: String,
        trim: true
    },
    videoFile: {
        type: String,
        trim: true // Path to uploaded video file
    },

    // Mode
    mode: {
        type: String,
        enum: ['online', 'offline', 'hybrid'],
        default: 'online'
    },

    // Status & Visibility
    status: {
        type: String,
        enum: ['draft', 'active', 'inactive', 'completed', 'cancelled', 'upcoming'],
        default: 'active'
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    isPopular: {
        type: Boolean,
        default: false
    },
    priority: {
        type: Number,
        default: 0
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
batchSchema.index({ courseId: 1 });
batchSchema.index({ examType: 1 });
batchSchema.index({ batchType: 1 });
batchSchema.index({ status: 1 });
batchSchema.index({ isFeatured: 1 });
batchSchema.index({ isPopular: 1 });
batchSchema.index({ examType: 1, status: 1 });

// Pre-save middleware
batchSchema.pre('save', function(next) {
    if (this.isModified('price') || this.isModified('originalPrice')) {
        if (this.originalPrice > 0) {
            this.discountPercentage = Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
        }
    }
    this.updatedAt = Date.now();
    next();
});

// Virtual for available seats
batchSchema.virtual('availableSeats').get(function() {
    return Math.max(0, this.maxStudents - this.enrolledStudents);
});

// Virtual for isFull
batchSchema.virtual('isFull').get(function() {
    return this.enrolledStudents >= this.maxStudents;
});

// Method to increment enrolled students
batchSchema.methods.incrementEnrolled = function(count = 1) {
    if (this.enrolledStudents + count <= this.maxStudents) {
        this.enrolledStudents += count;
        return this.save();
    }
    throw new Error('Batch is full');
};

// Static method to find by exam type
batchSchema.statics.findByExamType = function(examType) {
    return this.find({ examType, status: 'active' });
};

// Static method to find featured batches
batchSchema.statics.findFeatured = function(limit = 10) {
    return this.find({ 
        status: 'active',
        isFeatured: true 
    }).sort({ priority: -1, createdAt: -1 }).limit(limit);
};

// Static method to find popular batches
batchSchema.statics.findPopular = function(limit = 10) {
    return this.find({ 
        status: 'active',
        isPopular: true 
    }).sort({ enrolledStudents: -1, rating: -1 }).limit(limit);
};

// Ensure virtuals are serialized
batchSchema.set('toJSON', { virtuals: true });
batchSchema.set('toObject', { virtuals: true });

const Batch = mongoose.model('Batch', batchSchema);

module.exports = Batch;