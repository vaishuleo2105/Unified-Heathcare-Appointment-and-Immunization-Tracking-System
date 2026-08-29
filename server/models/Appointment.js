const mongoose = require('mongoose')

const appointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date:      { type: String, required: true },
  time:      { type: String, required: true },
  type:      { type: String, required: true, trim: true },
  status:    { type: String, enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'], default: 'Pending' },
  notes:     { type: String, trim: true },
  consultationOutcome: { type: String, trim: true },
  consultationNotes: { type: String, trim: true },
  completedAt: { type: Date },
}, { timestamps: true })

module.exports = mongoose.model('Appointment', appointmentSchema)
