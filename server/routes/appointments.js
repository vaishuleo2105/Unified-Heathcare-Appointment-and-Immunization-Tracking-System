const express = require('express')
const Appointment = require('../models/Appointment')
const Doctor = require('../models/Doctor')
const protect = require('../middleware/auth')

const router = express.Router()

// GET all appointments for logged-in patient
router.get('/', protect, async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.user._id }).sort({ createdAt: -1 })
    res.json(appointments)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST book new appointment
router.post('/', protect, async (req, res) => {
  try {
    const { doctorId, date, time, type, notes } = req.body
    if (!doctorId || !date || !time || !type) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    const doctor = await Doctor.findById(doctorId)
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' })

    // Check slot is still available
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

// DELETE cancel appointment
router.delete('/:id', protect, async (req, res) => {
  try {
    const apt = await Appointment.findOne({ _id: req.params.id, patient: req.user._id })
    if (!apt) return res.status(404).json({ message: 'Appointment not found' })
    apt.status = 'Cancelled'
    await apt.save()
    res.json({ message: 'Appointment cancelled' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
