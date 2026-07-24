const mongoose = require('mongoose')

const maternalRecordSchema = new mongoose.Schema(
  {
    govtMaternalId: { type: String, required: true, unique: true, trim: true, index: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    antenatalVisits: [
      {
        hospitalId: { type: String },
        date: { type: Date, required: true },
        notes: { type: String },
      },
    ],
    deliveryDetails: {
      hospitalId: { type: String },
      date: { type: Date },
      notes: { type: String },
    },
    childId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
)

module.exports = mongoose.model('MaternalRecord', maternalRecordSchema)
