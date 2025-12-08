const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    lastName: {
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
    password: {
        type: String,
        required: true
    },
    address: {
        street: {
            type: String,
           
        },
        city: {
            type: String,
        },
        state: {
            type: String,
        },
        zip: {
            type: String,
        },
        country: {
            type: String,
        }
    },
    courses: {
        type:mongoose.Schema.Types.ObjectId,
        ref:'Course'
    },
    batches: {
        type:mongoose.Schema.Types.ObjectId,
        ref:'Batch'
    },
    profilePicture: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
},
{
    timestamps: true
}
);

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;