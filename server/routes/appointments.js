const express = require('express')
const Appointment = require('../models/Appointment')
const User = require('../models/User')
const protect = require('../middleware/auth')

const router = express.Router()
router.use(protect)

// GET /api/appointments  — role-based fetch
router.get('/', async (req, res) => {
  try {
    let query = {}
    if (req.user.role === 'patient') query.patientId = req.user._id
    else if (req.user.role === 'doctor') query.doctorId = req.user._id

    const appointments = await Appointment.find(query)
      .populate('patientId', 'firstName lastName email')
      .populate('doctorId', 'firstName lastName')
      .sort({ date: 1, time: 1 })

    return res.json(appointments)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

// GET /api/appointments/doctors  — list all doctors for booking
router.get('/doctors', async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' }).select('firstName lastName email')
    return res.json(doctors)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

// POST /api/appointments  — patient books appointment
router.post('/', async (req, res) => {
  const { doctorId, date, time, type, notes } = req.body
  if (!doctorId || !date || !time || !type)
    return res.status(400).json({ message: 'doctorId, date, time, and type are required' })
  try {
    const doctor = await User.findById(doctorId)
    if (!doctor || doctor.role !== 'doctor')
      return res.status(400).json({ message: 'Invalid doctor selected' })

    const appointment = await Appointment.create({
      patientId: req.user._id,
      doctorId,
      date,
      time,
      type,
      notes,
      status: 'Pending',
    })
    const populated = await appointment.populate([
      { path: 'patientId', select: 'firstName lastName email' },
      { path: 'doctorId', select: 'firstName lastName' },
    ])
    return res.status(201).json(populated)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

// PATCH /api/appointments/:id/status  — staff/doctor update status
router.patch('/:id/status', async (req, res) => {
  const { status } = req.body
  const allowed = ['Pending', 'Confirmed', 'Completed', 'Cancelled']
  if (!allowed.includes(status))
    return res.status(400).json({ message: 'Invalid status' })
  if (!['staff', 'doctor', 'admin'].includes(req.user.role))
    return res.status(403).json({ message: 'Not authorized to update appointment status' })
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('patientId', 'firstName lastName email').populate('doctorId', 'firstName lastName')
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' })
    return res.json(appointment)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

// DELETE /api/appointments/:id  — patient cancels their own appointment
router.delete('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' })
    if (
      req.user.role !== 'admin' &&
      appointment.patientId.toString() !== req.user._id.toString()
    ) return res.status(403).json({ message: 'Not authorized' })
    await appointment.deleteOne()
    return res.json({ message: 'Appointment cancelled' })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

module.exports = router
