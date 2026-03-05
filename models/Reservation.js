const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
    //  (Link sa User Model)
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    //  (Link sa Lab Model)
    lab: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Lab', 
        required: true 
    },
    seatNumber: { type: String, required: true },
    date: { type: String, required: true }, // e.g., "2024-03-15"
    timeSlot: { type: String, required: true }, // e.g., "09:00 - 09:30"
    status: { 
        type: String, 
        enum: ['Active', 'Cancelled', 'Completed'], 
        default: 'Active' 
    }
}, { timestamps: true }); 

module.exports = mongoose.model('Reservation', reservationSchema);