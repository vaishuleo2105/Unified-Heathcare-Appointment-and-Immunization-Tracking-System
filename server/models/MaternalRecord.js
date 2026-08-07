const mongoose = require('mongoose')

const antenatalVisitSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  hospitalId: { type: String, trim: true },
  notes: { type: String, trim: true },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { _id: true, timestamps: true })

const maternalRecordSchema = new mongoose.Schema({
  govtMaternalId: { type: String, required: true, unique: true, trim: true, uppercase: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  abhaId: { type: String, trim: true },
  antenatalVisits: [antenatalVisitSchema],
  deliveryDetails: {
    date: { type: Date },
    hospitalId: { type: String, trim: true },
    notes: { type: String, trim: true },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
}, { timestamps: true })

module.exports = mongoose.model('MaternalRecord', maternalRecordSchema)
