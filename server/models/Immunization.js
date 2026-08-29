const mongoose = require('mongoose')

const immunizationSchema = new mongoose.Schema({
  patientId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vaccineName: { type: String, required: true, trim: true },
  date:        { type: String, required: true },
  dueDate:     { type: String },
  status:      { type: String, enum: ['Completed', 'Upcoming', 'Missed'], default: 'Completed' },
  dose:        { type: String, trim: true },
  administeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes:       { type: String, trim: true },
}, { timestamps: true })

module.exports = mongoose.model('Immunization', immunizationSchema)
