const mongoose = require('mongoose')

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  specialization: { type: String, required: true },
  qualification: { type: String, required: true },
  experience: { type: String, required: true },
  availableDays: [{ type: String }], // ['Monday', 'Wednesday', 'Friday']
  availableSlots: [{ type: String }], // ['09:00', '10:00', '11:00']
  consultationFee: { type: Number, default: 0 },
  image: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

module.exports = mongoose.model('Doctor', doctorSchema)
