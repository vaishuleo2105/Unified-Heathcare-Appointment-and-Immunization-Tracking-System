const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const User = require('../models/User')
const Appointment = require('../models/Appointment')
const Immunization = require('../models/Immunization')
const MaternalRecord = require('../models/MaternalRecord')

// GET /api/medical-history/:patientId
// Accessible by the patient themselves or any doctor/staff/admin
router.get('/:patientId', protect, async (req, res) => {
  try {
    const { patientId } = req.params
    const requesterId = req.user._id.toString()
    const requesterRole = req.user.role

    // Only the patient themselves or authorized roles can view
    if (requesterRole === 'patient' && requesterId !== patientId) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const [patient, appointments, immunizations, maternalRecord] = await Promise.all([
      User.findById(patientId).select('-password -resetOtp -resetOtpExpiry'),
      Appointment.find({ patientId })
        .populate('doctorId', 'firstName lastName')
        .sort({ date: -1 }),
      Immunization.find({ patientId })
        .populate('administeredBy', 'firstName lastName')
        .sort({ date: -1 }),
      MaternalRecord.findOne({ patientId })
        .populate('antenatalVisits.recordedBy', 'firstName lastName')
        .populate('deliveryDetails.recordedBy', 'firstName lastName'),
    ])

    if (!patient) return res.status(404).json({ message: 'Patient not found' })

    res.json({ patient, appointments, immunizations, maternalRecord })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
