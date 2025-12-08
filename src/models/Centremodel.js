const mongoose = require('mongoose');

const centreSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Centre name is required'],
        trim: true
    },
    code: {
        type: String,
        unique: true,
        trim: true
    },
    address: {
        street: String,
        city: {
            type: String,
            required: [true, 'City is required'],
            trim: true
        },
        state: {
            type: String,
            required: [true, 'State is required'],
            trim: true
        },
        pincode: {
            type: String,
            required: [true, 'Pincode is required'],
            trim: true
        },
        country: {
            type: String,
            default: 'India'
        }
    },
    location: {
        latitude: Number,
        longitude: Number
    },
    contact: {
        phone: {
            type: String,
            required: [true, 'Phone is required'],
            trim: true
        },
        email: {
            type: String,
            trim: true,
            lowercase: true
        },
        alternatePhone: {
            type: String,
            trim: true
        }
    },
    manager: {
        name: String,
        email: String,
        phone: String
    },
    facilities: [{
        type: String,
        trim: true
    }],
    capacity: {
        type: Number,
        default: 0
    },
    availableSlots: {
        type: Number,
        default: 0
    },
    courses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    }],
    batches: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Batch'
    }],
    instructors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Instructor'
    }],
    images: [{
        type: String,
        trim: true
    }],
    videoFile: {
        type: String,
        trim: true // Path to uploaded video file
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
    isActive: {
        type: Boolean,
        default: true
    },
    isOpen: {
        type: Boolean,
        default: true
    },
    openingHours: {
        monday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
        tuesday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
        wednesday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
        thursday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
        friday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
        saturday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
        sunday: { open: String, close: String, isOpen: { type: Boolean, default: false } }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes
centreSchema.index({ code: 1 });
centreSchema.index({ 'address.city': 1 });
centreSchema.index({ 'address.state': 1 });
centreSchema.index({ isActive: 1 });
centreSchema.index({ isOpen: 1 });
centreSchema.index({ rating: -1 });
centreSchema.index({ location: '2dsphere' }); // For geospatial queries

// Pre-save middleware to generate centre code
centreSchema.pre('save', async function(next) {
    if (!this.code) {
        const cityCode = this.address.city.substring(0, 3).toUpperCase();
        const count = await mongoose.model('Centre').countDocuments({ 'address.city': this.address.city });
        this.code = `${cityCode}${String(count + 1).padStart(3, '0')}`;
    }
    next();
});

const Centre = mongoose.model('Centre', centreSchema);

module.exports = Centre;

