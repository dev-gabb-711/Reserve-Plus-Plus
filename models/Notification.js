const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },

    senderName: { type: String, defualt: System },
    senderRole: { type: String, default: 'Lab Management' },
    senderAvatar: { type: String, default: 'def_avatar.jpg' },
    
    title: { type: String, required: true },
    message: { type: String, required: true },

    isRead: { type: Boolean, default: false },
    
    type: { 
        type: String, 
        enum: ['Reservation', 'IT Assist', 'System'], 
        default: 'System' 
    }
}, { timestamps: true }); 
    
module.exports = mongoose.model('Notification', notificationSchema);