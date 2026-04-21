const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Class title is required'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: [true, 'Course ID is required']
    },
    batchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Batch'
    },
    classType: {
        type: String,
        enum: ['live', 'recorded', 'doubt', 'revision'],
        default: 'live'
    },
    subject: {
        type: String,
        trim: true
    },
    topic: {
        type: String,
        trim: true
    },
    scheduledDate: {
        type: Date
    },
    startTime: {
        type: Date
    },
    endTime: {
        type: Date
    },
    duration: {
        type: Number,
        default: 60 // in minutes
    },
    videoUrl: {
        type: String,
        trim: true
    },
    recordingUrl: {
        type: String,
        trim: true
    },
    videoFile: {
        type: String,
        trim: true // Path to uploaded video file
    },
    meetingLink: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['scheduled', 'live', 'completed', 'cancelled', 'postponed'],
        default: 'scheduled'
    },
    attendees: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        joinedAt: Date,
        leftAt: Date,
        duration: Number
    }],
    materials: [{
        title: String,
        type: {
            type: String,
            enum: ['pdf', 'video', 'notes', 'link']
        },
        url: String,
        description: String
    }],
    notes: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
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
classSchema.index({ courseId: 1 });
classSchema.index({ batchId: 1 });
classSchema.index({ classType: 1 });
classSchema.index({ status: 1 });
classSchema.index({ scheduledDate: 1 });
classSchema.index({ startTime: 1, endTime: 1 });

// Virtual for isLive
classSchema.virtual('isLive').get(function() {
    const now = new Date();
    return this.status === 'live' || 
           (this.startTime && this.endTime && now >= this.startTime && now <= this.endTime);
});

// Virtual for isUpcoming
classSchema.virtual('isUpcoming').get(function() {
    const now = new Date();
    return this.status === 'scheduled' && this.startTime && this.startTime > now;
});

// Ensure virtuals are serialized
classSchema.set('toJSON', { virtuals: true });
classSchema.set('toObject', { virtuals: true });

const Class = mongoose.model('Class', classSchema);

module.exports = Class;

