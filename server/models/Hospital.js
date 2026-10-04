const mongoose = require('mongoose')

const hospitalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    type: {
      type: String,
      enum: [
        'Government Medical College Hospital',
        'District Headquarters Hospital',
        'Taluk Hospital',
        'Primary Health Centre (PHC)',
        'Urban Primary Health Centre (UPHC)',
        'Government Specialty Hospital',
        'Community Health Centre (CHC)',
        'Government',
        'Private',
      ],
      default: 'Government',
    },
    district: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    contactNumber: {
      type: String,
      trim: true,
    },
    emergencyHelpline: {
      type: String,
      default: '108',
    },
    departments: [
      {
        type: String,
        trim: true,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
)

hospitalSchema.index({ district: 1, name: 1 })

module.exports = mongoose.model('Hospital', hospitalSchema)
