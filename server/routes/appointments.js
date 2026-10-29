const express = require('express')
const axios = require('axios')
const Appointment = require('../models/Appointment')
const Slot = require('../models/Slot')
const User = require('../models/User')
const protect = require('../middleware/auth')
const {
  sendBookingConfirmation,
  sendCancellationNotification,
  sendConsultationOutcomeNotification,
  sendEmail,
} = require('../utils/reminderScheduler')
const { sendSMS } = require('../utils/smsService')

function isLessThan24Hours(dateStr, timeStr) {
  try {
    const [year, month, day] = dateStr.split('-').map(Number)
    const [hour, minute] = (timeStr || '09:00').split(':').map(Number)
    const apptDateTime = new Date(year, month - 1, day, hour, minute, 0)
    const now = new Date()
    const msDiff = apptDateTime.getTime() - now.getTime()
    const hoursDiff = msDiff / (1000 * 60 * 60)
    return hoursDiff < 24
  } catch (err) {
    return false
  }
}

const ML_SERVICE = process.env.ML_SERVICE_URL || 'http://localhost:5001'

const router = express.Router()
router.use(protect)

// GET /api/appointments  — role-based fetch
router.get('/', async (req, res) => {
  try {
    let query = {}
    if (req.user.role === 'patient') query.patientId = req.user._id
    else if (req.user.role === 'doctor') query.doctorId = req.user._id

    const appointments = await Appointment.find(query)
      .populate('patientId', 'firstName lastName email phone')
      .populate('doctorId', 'firstName lastName email phone')
      .populate('cancelledBy', 'firstName lastName role')
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
      status: 'Confirmed',
    })
    const populated = await appointment.populate([
      { path: 'patientId', select: 'firstName lastName email phone telegramChatId' },
      { path: 'doctorId', select: 'firstName lastName email phone telegramChatId' },
    ])
    sendBookingConfirmation(populated).catch((err) => console.error('[Notification] Booking confirmation failed:', err.response?.data || err.message))
    return res.status(201).json(populated)
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Conflict: This slot was just booked by another patient. Please select another time slot.' })
    }
    return res.status(500).json({ message: err.message })
  }
})

// PATCH /api/appointments/:id/status  — staff/doctor/admin/patient update status
router.patch('/:id/status', async (req, res) => {
  const { status } = req.body
  const allowed = ['Pending', 'Confirmed', 'Completed', 'Cancelled']
  if (!allowed.includes(status))
    return res.status(400).json({ message: 'Invalid status' })
  if (!['staff', 'doctor', 'admin', 'patient'].includes(req.user.role))
    return res.status(403).json({ message: 'Not authorized to update appointment status' })
  try {
    const appointment = await Appointment.findById(req.params.id)
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' })

    const patientIdVal = appointment.patientId?._id ? appointment.patientId._id.toString() : appointment.patientId.toString()
    if (req.user.role === 'patient' && patientIdVal !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update another patient\'s appointment' })
    }

    if (status === 'Cancelled') {
      if (req.user.role === 'patient' && isLessThan24Hours(appointment.date, appointment.time)) {
        return res.status(400).json({
          message: 'Cancellation limit exceeded: Appointments can only be cancelled at least 24 hours prior to the scheduled time. Less than 24 hours remain before your appointment.'
        })
      }

      const cancellationReason = req.body.cancellationReason || req.body.reason || 'Cancelled by staff/admin'
      appointment.status = 'Cancelled'
      appointment.cancellationReason = cancellationReason
      appointment.cancelledBy = req.user._id
      appointment.cancelledAt = new Date()
      await appointment.save()
      const doctorIdVal = appointment.doctorId?._id || appointment.doctorId
      await Slot.updateOne({ doctorId: doctorIdVal, date: appointment.date, time: appointment.time }, { isBooked: false })
      
      const populated = await Appointment.findById(appointment._id)
        .populate('patientId', 'firstName lastName email phone telegramChatId')
        .populate('doctorId', 'firstName lastName email phone telegramChatId')

      // Dispatch notifications to patient, doctor, and clinic admin
      sendCancellationNotification(populated, req.user, cancellationReason).catch(err =>
        console.error('[Notification] Cancellation notification failed:', err.message)
      )
      return res.json(populated)
    } else {
      appointment.status = status
      if (status === 'Completed') appointment.completedAt = new Date()
      await appointment.save()

      const populated = await Appointment.findById(appointment._id)
        .populate('patientId', 'firstName lastName email phone telegramChatId')
        .populate('doctorId', 'firstName lastName email phone telegramChatId')

      // When appointment status is updated to Confirmed, dispatch confirmation email & Telegram notification!
      if (status === 'Confirmed') {
        sendBookingConfirmation(populated).catch(err =>
          console.error('[Notification] Confirmation alert failed on status update:', err.message)
        )
      } else if (status === 'Completed') {
        sendConsultationOutcomeNotification(populated).catch(err =>
          console.error('[Notification] Completion alert failed on status update:', err.message)
        )
      }

      return res.json(populated)
    }
  } catch (err) {
    console.error('[Status Update Error]:', err.message)
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
    )
      .populate('patientId', 'firstName lastName email phone telegramChatId')
      .populate('doctorId', 'firstName lastName email phone telegramChatId')

    if (!appointment) return res.status(404).json({ message: 'Assigned appointment not found' })

    sendConsultationOutcomeNotification(appointment).catch(err =>
      console.error('[Notification] Consultation outcome notification failed:', err.message)
    )

    return res.json(appointment)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

// POST /api/appointments/test-notification — test Telegram and Email delivery instantly
router.post('/test-notification', async (req, res) => {
  try {
    const user = req.user
    const targetChatId = user.telegramChatId || process.env.TELEGRAM_CHAT_ID
    const targetEmail = user.email || process.env.EMAIL_USER
    const nowStr = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })

    const testMsg = `Unified Health Test Alert: System notification test to ${user.firstName} ${user.lastName} at ${nowStr} IST. All notification channels (Telegram & Email) are operational!`

    const smsRes = await sendSMS(user.phone || '9791868857', testMsg, targetChatId)
    
    let emailSent = false
    try {
      await sendEmail(
        [targetEmail, process.env.EMAIL_USER],
        `✅ Unified Health Test Alert - ${nowStr} IST`,
        `
        <div style="font-family:Arial,sans-serif;max-width:500px;padding:20px;border:1px solid #e0e0e0;border-radius:8px;">
          <h2 style="color:#0284c7;">Notification System Operational</h2>
          <p>Hi <strong>${user.firstName}</strong>,</p>
          <p>This is a verification test to confirm that your email notifications and Telegram bot are functioning properly.</p>
          <p style="color:#666;font-size:12px;">Sent at: ${nowStr} IST</p>
        </div>
        `
      )
      emailSent = true
    } catch (e) {
      console.error('Test email failed:', e.message)
    }

    return res.json({
      success: true,
      message: 'Test notification dispatched',
      telegram: smsRes,
      emailSent,
      targetEmail,
      targetChatId,
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
})

// GET /api/appointments/suggest-type  — ML: predict appointment type + best doctor + time
router.get('/suggest-type', async (req, res) => {
  try {
    const user = req.user
    // 1. Fetch patient's recent appointments (latest first)
    const history = await Appointment.find({
      patientId: user._id,
      status: { $ne: 'Cancelled' },
    }).sort({ createdAt: -1, date: -1 }).limit(5).select('type status date')

    const latestAppointment = history.length > 0 ? history[0] : null
    const recentType = latestAppointment ? latestAppointment.type : null

    const payload = {
      age: user.age || 30,
      gender: user.gender || 'Male',
      bloodType: user.bloodType || 'O+',
      medicalCondition: user.medicalCondition || 'None',
      medication: user.medication || 'None',
      testResults: user.testResults || 'Normal',
      recentType: recentType,
    }

    let suggestedType = 'General Checkup'
    let confidence = 0
    let probabilities = {}
    let source = 'fallback'
    let historySuggestion = null

    if (history.length > 0) {
      const latestType = history[0].type
      // Recency-weighted scoring: recent appointments define current clinical care pathway
      const weightedTypes = {}
      history.forEach((appointment, index) => {
        const recencyBoost = index === 0 ? 3 : (index === 1 ? 2 : 1)
        const weight = (history.length - index) * recencyBoost
        weightedTypes[appointment.type] = (weightedTypes[appointment.type] || 0) + weight
      })
      const sortedTypes = Object.entries(weightedTypes).sort((a, b) => b[1] - a[1])
      const [topType, topWeight] = sortedTypes[0]
      const occurrences = history.filter(appointment => appointment.type === topType).length
      const totalWeight = Object.values(weightedTypes).reduce((sum, value) => sum + value, 0)
      const historyConfidence = Math.min(95, Math.round((topWeight / totalWeight) * 100))

      historySuggestion = {
        type: topType,
        confidence: historyConfidence,
        occurrences,
        latestType,
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
        confidence = Math.max(confidence, historySuggestion.confidence)
        source = 'ml_model_plus_history'
      }
    } catch {
      if (historySuggestion) {
        suggestedType = historySuggestion.type
        confidence = historySuggestion.confidence
        source = 'frequency'
      } else if (history.length > 0) {
        suggestedType = history[0].type
        confidence = 80
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

// Helper cancellation processor
async function processCancellation(appointmentId, user, reason, res) {
  try {
    const appointment = await Appointment.findById(appointmentId)
      .populate('patientId', 'firstName lastName email phone')
      .populate('doctorId', 'firstName lastName email phone')

    if (!appointment) return res.status(404).json({ message: 'Appointment not found' })

    const patientIdVal = appointment.patientId?._id ? appointment.patientId._id.toString() : appointment.patientId.toString()
    if (
      user.role !== 'admin' &&
      user.role !== 'staff' &&
      patientIdVal !== user._id.toString()
    ) return res.status(403).json({ message: 'Not authorized to cancel this appointment' })

    // 24-HOUR CANCELLATION RESTRICTION CHECK FOR PATIENTS
    if (user.role === 'patient' && isLessThan24Hours(appointment.date, appointment.time)) {
      return res.status(400).json({
        message: 'Cancellation limit exceeded: Appointments can only be cancelled at least 24 hours prior to the scheduled time. Less than 24 hours remain before your appointment. Please contact hospital staff for assistance.'
      })
    }

    const doctorIdVal = appointment.doctorId?._id || appointment.doctorId
    const cancellationReason = reason || 'Patient cancelled without stating a reason'

    // Retain appointment record marked as Cancelled for history and auditing
    appointment.status = 'Cancelled'
    appointment.cancellationReason = cancellationReason
    appointment.cancelledBy = user._id
    appointment.cancelledAt = new Date()
    await appointment.save()

    // Free up time slot for others to book
    await Slot.updateOne({ doctorId: doctorIdVal, date: appointment.date, time: appointment.time }, { isBooked: false })

    // Dispatch notification to assigned doctor, staff and patient with the cancellation reason
    sendCancellationNotification(appointment, user, cancellationReason).catch(err =>
      console.error('[Notification] Cancellation notification failed:', err.message)
    )

    return res.json({ message: 'Appointment cancelled successfully', appointment })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

// POST /api/appointments/:id/cancel — patient/admin/staff cancels with explicit reason
router.post('/:id/cancel', async (req, res) => {
  const reason = req.body?.cancellationReason || req.body?.reason
  return processCancellation(req.params.id, req.user, reason, res)
})

// DELETE /api/appointments/:id — patient/admin cancels an appointment (supports body or query reason)
router.delete('/:id', async (req, res) => {
  const reason = req.body?.cancellationReason || req.body?.reason || req.query?.reason
  return processCancellation(req.params.id, req.user, reason, res)
})

module.exports = router
