const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Test title is required'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    examType: {
        type: String,
        enum: ['jee', 'neet', 'gate', 'upsc', 'defence', 'ese', 'foundation', 'commerce', 'arts', 'other'],
        required: [true, 'Exam type is required']
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    },
    batchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Batch'
    },
    testType: {
        type: String,
        enum: ['mock', 'practice', 'quiz', 'assignment', 'final'],
        required: [true, 'Test type is required']
    },
    duration: {
        type: Number,
        required: [true, 'Duration is required'],
        min: 1 // in minutes
    },
    totalQuestions: {
        type: Number,
        required: [true, 'Total questions is required'],
        min: 1
    },
    totalMarks: {
        type: Number,
        required: [true, 'Total marks is required']
    },
    date:{
        type: Date,
        required: [true, 'Date is required']
    },
    
    questions: [{
        question: {
            type: String,
            required: true
        },
        options: [{
            type: String,
            required: true
        }],
        correctAnswer: {
            type: Number,
            required: true
        },
        marks: {
            type: Number,
            default: 1
        },
        negativeMarks: {
            type: Number,
            default: 0
        },
        explanation: {
            type: String
        }
    }],
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    instructions: {
        type: String,
        trim: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
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
testSchema.index({ examType: 1 });
testSchema.index({ testType: 1 });
testSchema.index({ courseId: 1 });
testSchema.index({ batchId: 1 });
testSchema.index({ isActive: 1 });
testSchema.index({ isPublished: 1 });
testSchema.index({ startDate: 1, endDate: 1 });

const Test = mongoose.model('Test', testSchema);

module.exports = Test;

