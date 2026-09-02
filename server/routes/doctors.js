const express = require('express')
const User = require('../models/User')
const Appointment = require('../models/Appointment')
const protect = require('../middleware/auth')

const router = express.Router()

// GET /api/doctors — list all doctors
router.get('/', protect, async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' }).select('firstName lastName email')
    res.json(doctors)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/doctors/:id/slots — available slots for a doctor on a date
router.get('/:id/slots', protect, async (req, res) => {
  try {
    const { date } = req.query
    if (!date) return res.status(400).json({ message: 'Date is required' })

    const doctor = await User.findOne({ _id: req.params.id, role: 'doctor' })
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' })

    const booked = await Appointment.find({
      doctorId: req.params.id,
      date,
      status: { $in: ['Pending', 'Confirmed'] },
    }).select('time')

    const allSlots = ['08:00', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00']
    const bookedTimes = booked.map(a => a.time)
    const availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot))

    res.json({ available: true, slots: availableSlots, bookedSlots: bookedTimes })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
