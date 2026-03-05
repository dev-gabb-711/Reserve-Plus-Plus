const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    building: { 
        type: String, 
        required: true,
        enum: ['Br. Andrew Hall', 'Gokongwei Hall']  // dagdagan pa itetchi
    },
    roomNumber: { type: String, required: true },
    seatNumber: { type: Number, required: true },

    concernCategory: { type: String, required: true }, // Ito yung galing sa "Concern Chips"
    description: { type: String }, // Ito yung galing sa textarea

// Status of ticket
    status: { 
        type: String, 
        enum: ['Pending', 'In Progress', 'Resolved'], 
        default: 'Pending' 
    }
}, { timestamps: true });

module.exports = mongoose.model('Ticket', ticketSchema);



