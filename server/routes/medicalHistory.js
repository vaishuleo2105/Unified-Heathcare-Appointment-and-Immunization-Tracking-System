const express = require('express')
const router = express.Router()
const protect = require('../middleware/auth')
const User = require('../models/User')
const Appointment = require('../models/Appointment')
const Immunization = require('../models/Immunization')
const MaternalRecord = require('../models/MaternalRecord')

function canViewPatientRecord(requesterRole, requesterId, patientId) {
  if (requesterRole?.toLowerCase() === 'patient') {
    return String(requesterId).trim() === String(patientId).trim()
  }
  return ['doctor', 'staff', 'admin'].includes(requesterRole?.toLowerCase())
}

router.get('/my-history', protect, async (req, res) => {
  try {
    return res.redirect(`/api/medical-history/${req.user._id}`)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

// GET /api/medical-history/:patientId
// Accessible by the patient themselves or any doctor/staff/admin
router.get('/:patientId', protect, async (req, res) => {
  try {
    const { patientId } = req.params
    const requesterId = req.user._id.toString()
    const requesterRole = req.user.role

    if (!canViewPatientRecord(requesterRole, requesterId, patientId)) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const [patient, appointments, immunizations, maternalRecord] = await Promise.all([
      User.findById(patientId).select('-password -resetOtp -resetOtpExpiry'),
      Appointment.find({ patientId })
        .populate('doctorId', 'firstName lastName')
        .sort({ date: -1, time: -1 }),
      Immunization.find({ patientId })
        .populate('administeredBy', 'firstName lastName')
        .sort({ date: -1 }),
      MaternalRecord.findOne({ patientId })
    ])

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' })
    }

    return res.json({ patient, appointments, immunizations, maternalRecord })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

module.exports = router
