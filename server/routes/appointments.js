const express = require('express')
const axios = require('axios')
const Appointment = require('../models/Appointment')
const Slot = require('../models/Slot')
const User = require('../models/User')
const protect = require('../middleware/auth')
const { sendBookingConfirmation } = require('../utils/reminderScheduler')

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

// GET /api/appointments/booked-slots  — return unavailable time slots for doctor & patient
router.get('/booked-slots', async (req, res) => {
  try {
    const { doctorId, date } = req.query
    const activeStatuses = ['Pending', 'Confirmed', 'Completed']

    let doctorBookedTimes = []
    let patientBookedTimes = []

    if (doctorId && date) {
      const docBookings = await Appointment.find({
        doctorId,
        date,
        status: { $in: activeStatuses }
      }).select('time')
      doctorBookedTimes = docBookings.map(b => b.time)
    }

    if (date && req.user) {
      const patBookings = await Appointment.find({
        patientId: req.user._id,
        date,
        status: { $in: activeStatuses }
      }).select('time')
      patientBookedTimes = patBookings.map(b => b.time)
    }

    return res.json({ doctorBookedTimes, patientBookedTimes })
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

    const activeStatuses = ['Pending', 'Confirmed', 'Completed']

    // 1. Doctor Conflict Check: Prevent two patients from booking the same doctor at the same time
    const doctorConflict = await Appointment.findOne({
      doctorId,
      date,
      time,
      status: { $in: activeStatuses }
    })
    if (doctorConflict) {
      return res.status(409).json({
        message: `Dr. ${doctor.firstName} ${doctor.lastName} is already booked at ${time} on ${date}. Please select a different time slot or doctor.`
      })
    }

    // 2. Patient Conflict Check: Prevent a patient from scheduling overlapping appointments
    const patientConflict = await Appointment.findOne({
      patientId: req.user._id,
      date,
      time,
      status: { $in: activeStatuses }
    })
    if (patientConflict) {
      return res.status(409).json({
        message: `You already have an active appointment scheduled at ${time} on ${date}. Please choose a different time.`
      })
    }

    // 3. Slot Table Verification (if staff configured slots)
    const configuredSlots = await Slot.exists({ doctorId, date })
    if (configuredSlots) {
      const slot = await Slot.findOneAndUpdate(
        { doctorId, date, time, isBooked: false },
        { isBooked: true },
        { new: true }
      )
      if (!slot) return res.status(409).json({ message: 'Selected appointment slot is no longer available' })
    }

    const targetPatientId = (['staff', 'admin', 'doctor'].includes(req.user.role) && req.body.patientId) ? req.body.patientId : req.user._id

    const appointment = await Appointment.create({
      patientId: targetPatientId,
      doctorId,
      date,
      time,
      type,
      notes,
      status: req.user.role === 'patient' ? 'Pending' : 'Confirmed',
    })
    const populated = await appointment.populate([
      { path: 'patientId', select: 'firstName lastName email' },
      { path: 'doctorId', select: 'firstName lastName' },
    ])
    sendBookingConfirmation(populated).catch(() => {})
    return res.status(201).json(populated)
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Conflict: This slot was just booked by another patient. Please select another time slot.' })
    }
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
      { status, ...(status === 'Completed' ? { completedAt: new Date() } : {}) },
      { new: true }
    ).populate('patientId', 'firstName lastName email').populate('doctorId', 'firstName lastName')
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' })
    if (status === 'Cancelled') {
      await Slot.updateOne({ doctorId: appointment.doctorId._id, date: appointment.date, time: appointment.time }, { isBooked: false })
    }
    return res.json(appointment)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

// PATCH /api/appointments/:id/consultation — doctor records the outcome of a visit
router.patch('/:id/consultation', async (req, res) => {
  if (req.user.role !== 'doctor') return res.status(403).json({ message: 'Only doctors can record consultation outcomes' })
  const { consultationOutcome, consultationNotes } = req.body
  if (!consultationOutcome) return res.status(400).json({ message: 'consultationOutcome is required' })
  try {
    const appointment = await Appointment.findOneAndUpdate(
      { _id: req.params.id, doctorId: req.user._id },
      { consultationOutcome, consultationNotes, status: 'Completed', completedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('patientId', 'firstName lastName email').populate('doctorId', 'firstName lastName')
    if (!appointment) return res.status(404).json({ message: 'Assigned appointment not found' })
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
    let historySuggestion = null

    const history = await Appointment.find({
      patientId: user._id,
      status: { $ne: 'Cancelled' },
    }).sort({ createdAt: -1 }).limit(5).select('type')

    if (history.length > 0) {
      const weightedTypes = {}
      history.forEach((appointment, index) => {
        const weight = history.length - index
        weightedTypes[appointment.type] = (weightedTypes[appointment.type] || 0) + weight
      })
      const [type, weight] = Object.entries(weightedTypes).sort((a, b) => b[1] - a[1])[0]
      const occurrences = history.filter(appointment => appointment.type === type).length
      const totalWeight = Object.values(weightedTypes).reduce((sum, value) => sum + value, 0)
      const historyConfidence = Math.round((weight / totalWeight) * 100)

      if (occurrences >= 2 && historyConfidence >= 50) {
        historySuggestion = { type, confidence: historyConfidence, occurrences }
      }
    }

    try {
      const { data } = await axios.post(`${ML_SERVICE}/predict-type`, payload, { timeout: 3000 })
      suggestedType = data.predictedType
      confidence = data.confidence
      probabilities = data.probabilities
      source = 'ml_model'

      if (historySuggestion && suggestedType !== 'Emergency') {
        suggestedType = historySuggestion.type
        confidence = historySuggestion.confidence
        source = 'ml_model_plus_history'
      }
    } catch {
      if (history.length > 0) {
        const latestType = historySuggestion?.type || history[0].type
        suggestedType = latestType
        confidence = historySuggestion?.confidence || Math.round(100 / history.length)
        source = 'frequency'
      }
    }

    // 2. Suggest best doctor (lowest active load)
    const doctors = await User.find({ role: 'doctor' }).select('firstName lastName _id')
    const activeStatuses = ['Pending', 'Confirmed']
    const todayStr = new Date().toISOString().split('T')[0]
    const doctorLoads = await Promise.all(doctors.map(async (doc) => {
      const active = await Appointment.countDocuments({ doctorId: doc._id, status: { $in: activeStatuses } })
      const todayCount = await Appointment.countDocuments({ doctorId: doc._id, date: todayStr })
      const loadScore = (active * 2) + todayCount
      return { _id: doc._id, firstName: doc.firstName, lastName: doc.lastName, active, todayCount, loadScore }
    }))
    doctorLoads.sort((a, b) => a.loadScore - b.loadScore)
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
      historySuggestion,
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

      let riskLevel = 'Low'
      let riskScore = 0
      try {
        const activeApts = await Appointment.find({ doctorId: doc._id, status: { $in: activeStatuses } })
          .populate('patientId', 'age gender bloodType medicalCondition medication testResults')
        const patients = activeApts.map(a => ({
          age: a.patientId?.age || 30,
          gender: a.patientId?.gender || 'Male',
          bloodType: a.patientId?.bloodType || 'O+',
          medicalCondition: a.patientId?.medicalCondition || 'None',
          medication: a.patientId?.medication || 'None',
          testResults: a.patientId?.testResults || 'Normal',
        }))
        if (patients.length > 0) {
          const { data } = await axios.post(`${ML_SERVICE}/doctor-risk-score`, { patients }, { timeout: 3000 })
          riskLevel = data.riskLevel
          riskScore = data.riskScore
        }
      } catch {}

      const workloadScore = Number((loadScore + (riskScore / 20)).toFixed(2))
      return {
        _id: doc._id,
        firstName: doc.firstName,
        lastName: doc.lastName,
        email: doc.email,
        totalAppointments: total,
        activeAppointments: active,
        todayAppointments: todayCount,
        loadScore,
        workloadScore,
        riskLevel,
        riskScore,
        recommendation: workloadScore === 0 ? 'Available' : workloadScore <= 3 ? 'Low Load' : workloadScore <= 7 ? 'Moderate' : 'High Load',
      }
    }))

    workloads.sort((a, b) => a.workloadScore - b.workloadScore)
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
    await Slot.updateOne({ doctorId: appointment.doctorId, date: appointment.date, time: appointment.time }, { isBooked: false })
    return res.json({ message: 'Appointment cancelled' })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

module.exports = router
