const express = require('express')
const Doctor = require('../models/Doctor')
const Appointment = require('../models/Appointment')
const protect = require('../middleware/auth')

const router = express.Router()

// GET doctors - optionally filter by specialization
router.get('/', protect, async (req, res) => {
  try {
    const { specialization } = req.query
    const query = { isActive: true }
    if (specialization) query.specialization = specialization
    const doctors = await Doctor.find(query)
    res.json(doctors)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET available slots for a doctor on a specific date
router.get('/:id/slots', protect, async (req, res) => {
  try {
    const { date } = req.query
    if (!date) return res.status(400).json({ message: 'Date is required' })

    const doctor = await Doctor.findById(req.params.id)
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' })

    // Check what day of week the date is
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dayOfWeek = dayNames[new Date(date).getDay()]

    // Check if doctor is available on that day
    if (!doctor.availableDays.includes(dayOfWeek)) {
      return res.json({ available: false, message: `Dr. ${doctor.name} is not available on ${dayOfWeek}`, slots: [] })
    }

    // Get already booked slots for that doctor on that date
    const booked = await Appointment.find({
      doctorId: req.params.id,
      date,
      status: { $in: ['Pending', 'Confirmed'] },
    }).select('time')

    const bookedTimes = booked.map(a => a.time)
    const availableSlots = doctor.availableSlots.filter(slot => !bookedTimes.includes(slot))

    res.json({ available: true, day: dayOfWeek, slots: availableSlots, bookedSlots: bookedTimes })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
