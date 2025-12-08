const mongoose = require('mongoose');

const instructorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        required: [true, 'Phone is required'],
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        select: false
    },
    specialization: {
        type: [String],
        default: []
    },
    subjects: [{
        type: String,
        trim: true
    }],
    experience: {
        type: Number,
        default: 0
    },
    qualifications: [{
        type: String,
        trim: true
    }],
    bio: {
        type: String,
        trim: true
    },
    image: {
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
    totalStudents: {
        type: Number,
        default: 0
    },
    totalCourses: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isVerified: {
        type: Boolean,
        default: false
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
instructorSchema.index({ email: 1 });
instructorSchema.index({ specialization: 1 });
instructorSchema.index({ isActive: 1 });
instructorSchema.index({ rating: -1 });

const Instructor = mongoose.model('Instructor', instructorSchema);

module.exports = Instructor;

