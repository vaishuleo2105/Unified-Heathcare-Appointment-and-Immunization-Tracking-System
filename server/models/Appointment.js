const mongoose = require('mongoose')

const appointmentSchema = new mongoose.Schema(
  {
    patient:        { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
    doctorId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    doctorName:     { type: String, required: true },
    specialization: { type: String, required: true },
    date:           { type: String, required: true },
    time:           { type: String, required: true },
    type:           { type: String, required: true },
    notes:          { type: String, default: '' },
    status:         { type: String, enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'], default: 'Pending' },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Appointment', appointmentSchema)
