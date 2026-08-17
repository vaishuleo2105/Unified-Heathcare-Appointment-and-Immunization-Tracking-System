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

// GET /api/appointments/suggest-type  — ML: frequency-based appointment type suggestion
router.get('/suggest-type', async (req, res) => {
  try {
    const history = await Appointment.find({ patientId: req.user._id })
    if (history.length === 0) return res.json({ suggestedType: 'General Checkup', confidence: 0 })

    const freq = {}
    history.forEach(a => { freq[a.type] = (freq[a.type] || 0) + 1 })
    const suggestedType = Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0]
    const confidence = Math.round((freq[suggestedType] / history.length) * 100)

    return res.json({ suggestedType, confidence, totalAppointments: history.length })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

// GET /api/appointments/doctor-workload  — ML: doctor workload balancing
router.get('/doctor-workload', async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' }).select('firstName lastName email')
    const activeStatuses = ['Pending', 'Confirmed']

    const workloads = await Promise.all(doctors.map(async (doc) => {
      const total = await Appointment.countDocuments({ doctorId: doc._id })
      const active = await Appointment.countDocuments({ doctorId: doc._id, status: { $in: activeStatuses } })
      const today = new Date().toISOString().split('T')[0]
      const todayCount = await Appointment.countDocuments({ doctorId: doc._id, date: today })

      // Load score: weighted sum — active appointments matter most
      const loadScore = (active * 2) + todayCount

      return {
        _id: doc._id,
        firstName: doc.firstName,
        lastName: doc.lastName,
        email: doc.email,
        totalAppointments: total,
        activeAppointments: active,
        todayAppointments: todayCount,
        loadScore,
        recommendation: loadScore === 0 ? 'Available' : loadScore <= 3 ? 'Low Load' : loadScore <= 7 ? 'Moderate' : 'High Load',
      }
    }))

    // Sort by load score ascending — least loaded first
    workloads.sort((a, b) => a.loadScore - b.loadScore)

    return res.json(workloads)
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
