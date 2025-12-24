const mongoose = require('mongoose');

const getStartedSchema = new mongoose.Schema({
    // Personal Information (Step 1)
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true,
        match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number']
    },

    // Academic Details (Step 2)
    grade: {
        type: String,
        required: [true, 'Grade/Class is required'],
        enum: ['6th', '7th', '8th', '9th', '10th', '11th', '12th', 'graduation', 'post-graduation']
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: [true, 'Course is required']
    },
    centre: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Centre',
        default: null
    },

    // Goals & Preferences (Step 3)
    goals: {
        type: String,
        required: [true, 'Academic goals are required'],
        trim: true
    },
    experience: {
        type: String,
        enum: ['beginner', 'some', 'experienced', ''],
        default: ''
    },
    budget: {
        type: String,
        enum: ['under-5k', '5k-10k', '10k-20k', '20k-50k', 'above-50k', 'flexible', ''],
        default: ''
    },
    preferredTime: {
        type: String,
        enum: ['morning', 'afternoon', 'evening', 'flexible', ''],
        default: ''
    },
    message: {
        type: String,
        trim: true,
        default: ''
    },

    // Status and tracking
    status: {
        type: String,
        enum: ['pending', 'contacted', 'enrolled', 'not-interested', 'follow-up'],
        default: 'pending'
    },
    notes: {
        type: String,
        default: ''
    },
    contactedAt: {
        type: Date,
        default: null
    },
    enrolledAt: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field before saving
getStartedSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const GetStarted = mongoose.model('GetStarted', getStartedSchema);

module.exports = GetStarted;

