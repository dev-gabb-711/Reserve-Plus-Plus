const mongoose = require('mongoose')

const ticketSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    lab: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lab',
      required: true
    },

    seatNumber: {
      type: Number,
      required: true
    },

    concernCategory: {
      type: String,
      required: true,
      enum: [
        'PC Unresponsive / Frozen',
        'No Internet Connection',
        'Keyboard / Mouse Not Working',
        'Monitor No Display',
        'Cannot Log In (Account Issue)',
        'Software/App Crashing',
        'Audio / Headphone Jack Issue',
        'Other'
      ]
    },

    description: {
      type: String,
      default: ''
    },

    status: {
      type: String,
      enum: ['Unresolved', 'Resolved'],
      default: 'Unresolved'
    }
  },
  { timestamps: true }
)

module.exports = mongoose.model('Ticket', ticketSchema)