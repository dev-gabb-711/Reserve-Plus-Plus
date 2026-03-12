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

    labCode: String,

    seatNumber: { type: [Number] , required: true }, // dating tong string 
    
    timeRange: String,
  
    slotsArray: {
    type: [String],
    required: true
    },
    
    status: { 
        type: String, 
        enum: ['Active', 'Cancelled', 'Completed'], 
        default: 'Active' 
    }
}, { timestamps: true }); 

module.exports = mongoose.model('Reservation', reservationSchema);