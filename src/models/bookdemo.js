const mongoose = require('mongoose')



const bookdemoSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    course: {
        type:mongoose.Schema.Types.ObjectId,
        ref:'Course',
        required: true
    },
    centre: {
        type:mongoose.Schema.Types.ObjectId,
        ref:'Centre',
        required: true
    },
    preferredDate: {
        type: Date,
        required: true
    },
    preferredTime: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'cancelled'],
        default: 'pending'
    },
    notes: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
})

const BookDemo = mongoose.model('BookDemo', bookdemoSchema)
module.exports = BookDemo