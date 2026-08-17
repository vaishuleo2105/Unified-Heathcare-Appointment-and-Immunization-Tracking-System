const express = require('express')
const Appointment = require('../models/Appointment')
const Doctor = require('../models/Doctor')
const protect = require('../middleware/auth')

const router = express.Router()
router.use(protect)

// GET /api/appointments — role-based fetch
router.get('/', async (req, res) => {
  try {
    let query = {}
    if (req.user.role === 'patient') query.patient = req.user._id
    else if (req.user.role === 'doctor') query.doctorId = req.user._id

    const appointments = await Appointment.find(query).sort({ createdAt: -1 })
    res.json(appointments)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/appointments — patient books appointment
router.post('/', async (req, res) => {
  try {
    const { doctorId, date, time, type, notes } = req.body
    if (!doctorId || !date || !time || !type) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    const doctor = await Doctor.findById(doctorId)
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' })

    const conflict = await Appointment.findOne({
      doctorId,
      date,
      time,
      status: { $in: ['Pending', 'Confirmed'] },
    })
    if (conflict) return res.status(400).json({ message: 'This slot is already booked. Please choose another time.' })

    const appointment = await Appointment.create({
      patient: req.user._id,
      doctorId,
      doctorName: doctor.name,
      specialization: doctor.specialization,
      date, time, type, notes,
    })
    res.status(201).json(appointment)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// PATCH /api/appointments/:id/status — staff/doctor/admin update status
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
    )
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' })
    res.json(appointment)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// DELETE /api/appointments/:id — patient cancels own, admin cancels any
router.delete('/:id', async (req, res) => {
  try {
    const apt = await Appointment.findById(req.params.id)
    if (!apt) return res.status(404).json({ message: 'Appointment not found' })
    if (req.user.role !== 'admin' && apt.patient.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' })
    apt.status = 'Cancelled'
    await apt.save()
    res.json({ message: 'Appointment cancelled' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
