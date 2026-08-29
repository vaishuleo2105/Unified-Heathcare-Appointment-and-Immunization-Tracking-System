const express = require('express')
const User = require('../models/User')
const Appointment = require('../models/Appointment')
const Immunization = require('../models/Immunization')
const MaternalRecord = require('../models/MaternalRecord')
const protect = require('../middleware/auth')

const router = express.Router()
router.use(protect)

function canManage(user) {
  return ['staff', 'doctor', 'admin'].includes(user.role)
}

router.get('/', async (req, res) => {
  if (!canManage(req.user)) return res.status(403).json({ message: 'Not authorized' })
  try {
    const patients = await User.find({ role: 'patient' }).select('firstName lastName email age gender bloodType medicalCondition medication testResults')
    return res.json(patients)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

router.get('/:id', async (req, res) => {
  if (!canManage(req.user)) return res.status(403).json({ message: 'Not authorized' })
  try {
    const patient = await User.findOne({ _id: req.params.id, role: 'patient' }).select('-password')
    if (!patient) return res.status(404).json({ message: 'Patient not found' })
    const [appointments, immunizations, maternalRecords] = await Promise.all([
      Appointment.find({ patientId: patient._id }).populate('doctorId', 'firstName lastName').sort({ date: -1, time: -1 }),
      Immunization.find({ patientId: patient._id }).sort({ date: -1 }),
      MaternalRecord.find({ patientId: patient._id }).sort({ createdAt: -1 }),
    ])
    return res.json({ patient, appointments, immunizations, maternalRecords })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

router.put('/:id/medical-profile', async (req, res) => {
  if (!['staff', 'admin'].includes(req.user.role)) return res.status(403).json({ message: 'Only staff can update patient records' })
  const { age, gender, bloodType, medicalCondition, medication, testResults } = req.body
  try {
    const patient = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'patient' },
      { age, gender, bloodType, medicalCondition, medication, testResults },
      { new: true, runValidators: true }
    ).select('-password')
    if (!patient) return res.status(404).json({ message: 'Patient not found' })
    return res.json({ patient })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

module.exports = router
