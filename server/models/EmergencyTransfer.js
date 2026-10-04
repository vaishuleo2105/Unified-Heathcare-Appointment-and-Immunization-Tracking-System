const mongoose = require('mongoose')

const emergencyTransferSchema = new mongoose.Schema(
  {
    transferId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sourceHospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true,
    },
    destinationHospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true,
    },
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receivingDoctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    destinationDepartment: {
      type: String,
      trim: true,
      default: 'Emergency Department',
    },
    reason: {
      type: String,
      enum: [
        'Emergency Treatment',
        'Patient Referral',
        'Specialist Consultation',
        'Continued Treatment',
        'ICU / Critical Care Transfer',
        'Trauma / Surgical Emergency',
        'Other',
      ],
      required: true,
    },
    reasonDetails: {
      type: String,
      trim: true,
    },
    priority: {
      type: String,
      enum: ['Critical', 'High', 'Normal'],
      default: 'High',
    },
    sharedCategories: [
      {
        type: String,
        enum: [
          'basic_info',
          'blood_group_vitals',
          'allergies_warnings',
          'medical_history_conditions',
          'medications_prescriptions',
          'immunizations_vaccines',
          'recent_consultations',
          'maternal_record',
          'emergency_contacts',
        ],
      },
    ],
    status: {
      type: String,
      enum: ['Pending', 'Accepted', 'Viewed', 'Completed', 'Rejected', 'Expired'],
      default: 'Pending',
    },
    responseNotes: {
      type: String,
      trim: true,
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    respondedAt: {
      type: Date,
    },
    patientDataSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now },
        notes: { type: String },
      },
    ],
  },
  { timestamps: true }
)

emergencyTransferSchema.index({ sourceHospitalId: 1, destinationHospitalId: 1, status: 1 })
emergencyTransferSchema.index({ patientId: 1, createdAt: -1 })

module.exports = mongoose.model('EmergencyTransfer', emergencyTransferSchema)
