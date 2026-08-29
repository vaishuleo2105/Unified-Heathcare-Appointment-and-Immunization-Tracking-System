const mongoose = require('mongoose')

const slotSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  isBooked: { type: Boolean, default: false },
}, { timestamps: true })

slotSchema.index({ doctorId: 1, date: 1, time: 1 }, { unique: true })

module.exports = mongoose.model('Slot', slotSchema)
