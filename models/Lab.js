const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
    seatNumber: { type: String, required: true },
    isOccupied: { type: Boolean, default: false },
    occupiedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        default: null 
    }
});

const labSchema = new mongoose.Schema({
    labCode: { type: String, required: true }, 
    building: { type: String, required: true }, 
    seats: [seatSchema] 
});

module.exports = mongoose.model('Lab', labSchema);