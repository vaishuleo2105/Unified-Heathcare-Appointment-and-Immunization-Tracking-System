const mongoose = require('mongoose')

const auditLogSchema = new mongoose.Schema(
  {
    transferId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmergencyTransfer',
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    sourceHospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
    },
    destinationHospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      enum: [
        'TRANSFER_INITIATED',
        'TRANSFER_ACCEPTED',
        'TRANSFER_REJECTED',
        'TRANSFER_COMPLETED',
        'RECORD_VIEWED',
        'RECORD_EXPORTED',
      ],
      required: true,
    },
    details: {
      type: String,
      trim: true,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
)

auditLogSchema.index({ transferId: 1, timestamp: -1 })
auditLogSchema.index({ patientId: 1, timestamp: -1 })

module.exports = mongoose.model('AuditLog', auditLogSchema)
