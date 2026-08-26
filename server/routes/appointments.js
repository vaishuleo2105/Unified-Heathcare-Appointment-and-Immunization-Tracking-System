const express = require('express')
const axios = require('axios')
const Appointment = require('../models/Appointment')
const User = require('../models/User')
const protect = require('../middleware/auth')

const ML_SERVICE = 'http://localhost:5001'

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

// GET /api/appointments/suggest-type  — ML: predict appointment type + best doctor + time
router.get('/suggest-type', async (req, res) => {
  try {
    const user = req.user
    const payload = {
      age: user.age || 30,
      gender: user.gender || 'Male',
      bloodType: user.bloodType || 'O+',
      medicalCondition: user.medicalCondition || 'None',
      medication: user.medication || 'None',
      testResults: user.testResults || 'Normal',
    }

    // 1. Predict appointment type from ML
    let suggestedType = 'General Checkup'
    let confidence = 0
    let probabilities = {}
    let source = 'fallback'
    try {
      const { data } = await axios.post(`${ML_SERVICE}/predict-type`, payload, { timeout: 3000 })
      suggestedType = data.predictedType
      confidence = data.confidence
      probabilities = data.probabilities
      source = 'ml_model'
    } catch {
      const history = await Appointment.find({ patientId: user._id })
      if (history.length > 0) {
        const freq = {}
        history.forEach(a => { freq[a.type] = (freq[a.type] || 0) + 1 })
        suggestedType = Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0]
        confidence = Math.round((freq[suggestedType] / history.length) * 100)
        source = 'frequency'
      }
    }

    // 2. Suggest best doctor (lowest active load)
    const doctors = await User.find({ role: 'doctor' }).select('firstName lastName _id')
    const activeStatuses = ['Pending', 'Confirmed']
    const doctorLoads = await Promise.all(doctors.map(async (doc) => {
      const active = await Appointment.countDocuments({ doctorId: doc._id, status: { $in: activeStatuses } })
      return { _id: doc._id, firstName: doc.firstName, lastName: doc.lastName, active }
    }))
    doctorLoads.sort((a, b) => a.active - b.active)
    const suggestedDoctor = doctorLoads[0] || null

    // 3. Suggest next available date (tomorrow) and a smart time based on appointment type
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const suggestedDate = tomorrow.toISOString().split('T')[0]
    const TIME_BY_TYPE = {
      'Emergency': '08:00',
      'Consultation': '10:00',
      'Follow-up': '11:00',
      'General Checkup': '14:00',
      'Vaccination': '09:00',
    }
    const suggestedTime = TIME_BY_TYPE[suggestedType] || '10:00'

    return res.json({
      suggestedType,
      confidence,
      probabilities,
      source,
      suggestedDoctor,
      suggestedDate,
      suggestedTime,
      profileComplete: !!(user.age && user.gender && user.medicalCondition),
    })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

// GET /api/appointments/doctor-workload  — ML-assisted doctor workload balancing
router.get('/doctor-workload', async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' }).select('firstName lastName email')
    const activeStatuses = ['Pending', 'Confirmed']
    const today = new Date().toISOString().split('T')[0]

    const workloads = await Promise.all(doctors.map(async (doc) => {
      const total  = await Appointment.countDocuments({ doctorId: doc._id })
      const active = await Appointment.countDocuments({ doctorId: doc._id, status: { $in: activeStatuses } })
      const todayCount = await Appointment.countDocuments({ doctorId: doc._id, date: today })
      const loadScore = (active * 2) + todayCount

      // Try to get ML risk score for this doctor's active patients
      let riskLevel = 'Low'
      let riskScore = 0
      try {
        const activeApts = await Appointment.find({ doctorId: doc._id, status: { $in: activeStatuses } })
          .populate('patientId', 'age medicalCondition testResults')
        const patients = activeApts.map(a => ({
          age: a.patientId?.age || 30,
          medicalCondition: a.patientId?.medicalCondition || 'None',
          testResults: a.patientId?.testResults || 'Normal',
        }))
        if (patients.length > 0) {
          const { data } = await axios.post(`${ML_SERVICE}/doctor-risk-score`, { patients }, { timeout: 3000 })
          riskLevel = data.riskLevel
          riskScore = data.riskScore
        }
      } catch {}

      return {
        _id: doc._id,
        firstName: doc.firstName,
        lastName: doc.lastName,
        email: doc.email,
        totalAppointments: total,
        activeAppointments: active,
        todayAppointments: todayCount,
        loadScore,
        riskLevel,
        riskScore,
        recommendation: loadScore === 0 ? 'Available' : loadScore <= 3 ? 'Low Load' : loadScore <= 7 ? 'Moderate' : 'High Load',
      }
    }))

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
