const mongoose = require('mongoose')

const reservationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',
      required: true
    },

    lab: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lab',
      required: true
    },

    labCode: String,

    seatNumber: { type: mongoose.Schema.Types.Mixed, required: true },

    date: { type: String, required: true },

    timeSlot: String,
    timeRange: String,

    slotsArray: {
      type: [String],
      required: true
    },

    isAnonymous: { type: Boolean, default: false },

    status: {
      type: String,
      enum: ['Active', 'Cancelled', 'Completed'],
      default: 'Active'
    }
  },
  { timestamps: true }
)

module.exports = mongoose.model('Reservation', reservationSchema)