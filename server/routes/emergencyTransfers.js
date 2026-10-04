const express = require('express')
const EmergencyTransfer = require('../models/EmergencyTransfer')
const AuditLog = require('../models/AuditLog')
const Hospital = require('../models/Hospital')
const User = require('../models/User')
const Appointment = require('../models/Appointment')
const Immunization = require('../models/Immunization')
const MaternalRecord = require('../models/MaternalRecord')
const protect = require('../middleware/auth')

const router = express.Router()
router.use(protect)

// Helper: build structured data snapshot based on selected categories
async function buildDataSnapshot(patientId, sharedCategories) {
  const patient = await User.findById(patientId).select('-password -resetOtp -resetOtpExpiry')
  if (!patient) return null

  const snapshot = {}

  if (sharedCategories.includes('basic_info')) {
    snapshot.basicInfo = {
      firstName: patient.firstName,
      lastName: patient.lastName,
      age: patient.age,
      gender: patient.gender,
      email: patient.email,
      abhaId: patient.abhaId,
      abhaNumber: patient.abhaNumber,
    }
  }

  if (sharedCategories.includes('blood_group_vitals')) {
    snapshot.bloodGroupAndVitals = {
      bloodType: patient.bloodType || 'Not Recorded',
      testResults: patient.testResults || 'Normal',
    }
  }

  if (sharedCategories.includes('allergies_warnings')) {
    snapshot.allergiesAndWarnings = {
      notes: patient.medicalCondition?.toLowerCase().includes('allerg')
        ? patient.medicalCondition
        : 'No acute life-threatening allergies recorded on standard profile.',
    }
  }

  if (sharedCategories.includes('medical_history_conditions')) {
    snapshot.medicalConditions = {
      primaryCondition: patient.medicalCondition || 'None recorded',
    }
  }

  if (sharedCategories.includes('medications_prescriptions')) {
    snapshot.medications = {
      currentMedications: patient.medication || 'None recorded',
    }
  }

  if (sharedCategories.includes('immunizations_vaccines')) {
    const immunizations = await Immunization.find({ patientId }).sort({ date: -1 })
    snapshot.immunizations = immunizations.map((imm) => ({
      vaccineName: imm.vaccineName,
      dose: imm.dose,
      date: imm.date,
      status: imm.status,
      notes: imm.notes,
    }))
  }

  if (sharedCategories.includes('recent_consultations')) {
    const appointments = await Appointment.find({ patientId })
      .populate('doctorId', 'firstName lastName')
      .sort({ date: -1 })
      .limit(10)
    snapshot.consultations = appointments.map((apt) => ({
      date: apt.date,
      time: apt.time,
      type: apt.type,
      status: apt.status,
      notes: apt.notes,
      consultationOutcome: apt.consultationOutcome,
      consultationNotes: apt.consultationNotes,
      doctorName: apt.doctorId ? `Dr. ${apt.doctorId.firstName} ${apt.doctorId.lastName}` : 'Unassigned',
    }))
  }

  if (sharedCategories.includes('maternal_record')) {
    const maternal = await MaternalRecord.findOne({ patientId })
    if (maternal) {
      snapshot.maternalRecord = {
        govtMaternalId: maternal.govtMaternalId,
        abhaId: maternal.abhaId,
        antenatalVisits: maternal.antenatalVisits || [],
        deliveryDetails: maternal.deliveryDetails || {},
      }
    }
  }

  if (sharedCategories.includes('emergency_contacts')) {
    snapshot.emergencyContacts = {
      primaryEmail: patient.email,
      helpline: '108 (Tamil Nadu Emergency Medical Services)',
    }
  }

  return snapshot
}

// POST /api/emergency-transfers - initiate transfer
router.post('/', async (req, res) => {
  try {
    const {
      patientId,
      sourceHospitalId,
      destinationHospitalId,
      receivingDoctorId,
      destinationDepartment,
      reason,
      reasonDetails,
      priority,
      sharedCategories,
    } = req.body

    if (!patientId || !destinationHospitalId || !reason) {
      return res.status(400).json({ message: 'Patient, Destination Hospital, and Reason are required.' })
    }

    if (!sharedCategories || !Array.isArray(sharedCategories) || sharedCategories.length === 0) {
      return res.status(400).json({ message: 'Please select at least one category of medical information.' })
    }

    // Determine actual source hospital
    let effectiveSourceHospitalId = sourceHospitalId || req.user.hospitalId

    // If still missing, check patient's hospital or fallback to first active hospital
    if (!effectiveSourceHospitalId) {
      const patient = await User.findById(patientId)
      if (patient?.hospitalId) {
        effectiveSourceHospitalId = patient.hospitalId
      } else {
        const defaultHospital = await Hospital.findOne({ isActive: true })
        effectiveSourceHospitalId = defaultHospital?._id
      }
    }

    if (effectiveSourceHospitalId.toString() === destinationHospitalId.toString()) {
      return res.status(400).json({ message: 'You cannot transfer records to the same hospital.' })
    }

    // Role check: patients can only transfer their own record
    if (req.user.role === 'patient' && req.user._id.toString() !== patientId.toString()) {
      return res.status(403).json({ message: "You are not authorized to share this patient's medical history." })
    }

    const patientDataSnapshot = await buildDataSnapshot(patientId, sharedCategories)

    const randomDigits = Math.floor(1000 + Math.random() * 9000)
    const transferId = `EMT-${new Date().getFullYear()}-${randomDigits}`

    const transfer = await EmergencyTransfer.create({
      transferId,
      patientId,
      sourceHospitalId: effectiveSourceHospitalId,
      destinationHospitalId,
      initiatedBy: req.user._id,
      receivingDoctorId: receivingDoctorId || null,
      destinationDepartment: destinationDepartment || 'Emergency Department',
      reason,
      reasonDetails: reasonDetails || '',
      priority: priority || 'High',
      sharedCategories,
      status: 'Pending',
      patientDataSnapshot,
      statusHistory: [
        {
          status: 'Pending',
          updatedBy: req.user._id,
          timestamp: new Date(),
          notes: `Emergency transfer initiated by ${req.user.firstName} ${req.user.lastName} (${req.user.role}).`,
        },
      ],
    })

    // Write to audit log
    await AuditLog.create({
      transferId: transfer._id,
      patientId,
      sourceHospitalId: effectiveSourceHospitalId,
      destinationHospitalId,
      performedBy: req.user._id,
      action: 'TRANSFER_INITIATED',
      details: `Emergency data transfer initiated (${priority} priority) for reason: ${reason}.`,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '',
      userAgent: req.headers['user-agent'] || '',
    })

    const populatedTransfer = await EmergencyTransfer.findById(transfer._id)
      .populate('patientId', 'firstName lastName email age gender bloodType abhaId medicalCondition medication')
      .populate('sourceHospitalId', 'name code type district city contactNumber address')
      .populate('destinationHospitalId', 'name code type district city contactNumber address emergencyHelpline')
      .populate('initiatedBy', 'firstName lastName role email')
      .populate('receivingDoctorId', 'firstName lastName email department')

    return res.status(201).json(populatedTransfer)
  } catch (err) {
    console.error('Emergency transfer error:', err)
    return res.status(500).json({ message: err.message })
  }
})

// GET /api/emergency-transfers - list transfers relevant to user & hospital
router.get('/', async (req, res) => {
  try {
    const userRole = req.user.role
    const userId = req.user._id
    const userHospitalId = req.user.hospitalId

    let query = {}

    if (userRole === 'patient') {
      query.patientId = userId
    } else if (['doctor', 'staff', 'admin'].includes(userRole)) {
      if (userHospitalId) {
        query.$or = [
          { destinationHospitalId: userHospitalId },
          { sourceHospitalId: userHospitalId },
          { initiatedBy: userId },
        ]
      }
      // If no hospital assigned yet, allow viewing all for admin or transfers initiated by user
      if (userRole === 'admin' && !userHospitalId) {
        query = {}
      }
    }

    const transfers = await EmergencyTransfer.find(query)
      .populate('patientId', 'firstName lastName email age gender bloodType abhaId medicalCondition medication')
      .populate('sourceHospitalId', 'name code type district city contactNumber')
      .populate('destinationHospitalId', 'name code type district city contactNumber emergencyHelpline')
      .populate('initiatedBy', 'firstName lastName role email')
      .populate('receivingDoctorId', 'firstName lastName email department')
      .sort({ createdAt: -1 })

    return res.json(transfers)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

// GET /api/emergency-transfers/:id - retrieve single transfer & record view in audit log
router.get('/:id', async (req, res) => {
  try {
    const transfer = await EmergencyTransfer.findById(req.params.id)
      .populate('patientId', 'firstName lastName email age gender bloodType abhaId medicalCondition medication testResults')
      .populate('sourceHospitalId', 'name code type district city contactNumber address')
      .populate('destinationHospitalId', 'name code type district city contactNumber address emergencyHelpline')
      .populate('initiatedBy', 'firstName lastName role email')
      .populate('receivingDoctorId', 'firstName lastName email department')
      .populate('respondedBy', 'firstName lastName role')
      .populate('statusHistory.updatedBy', 'firstName lastName role')

    if (!transfer) {
      return res.status(404).json({ message: 'Emergency transfer record not found.' })
    }

    // Role-based access check
    const isPatientOwner = transfer.patientId?._id?.toString() === req.user._id.toString()
    const isInitiator = transfer.initiatedBy?._id?.toString() === req.user._id.toString()
    const isHospitalStaff = ['doctor', 'staff', 'admin'].includes(req.user.role)

    if (!isPatientOwner && !isInitiator && !isHospitalStaff) {
      return res.status(403).json({ message: 'Access denied to this emergency transfer record.' })
    }

    // Log the view action in audit trail
    await AuditLog.create({
      transferId: transfer._id,
      patientId: transfer.patientId?._id,
      sourceHospitalId: transfer.sourceHospitalId?._id,
      destinationHospitalId: transfer.destinationHospitalId?._id,
      performedBy: req.user._id,
      action: 'RECORD_VIEWED',
      details: `Medical transfer record viewed by ${req.user.firstName} ${req.user.lastName} (${req.user.role}).`,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '',
      userAgent: req.headers['user-agent'] || '',
    })

    // If destination hospital opened a Pending transfer, mark as Viewed
    if (
      transfer.status === 'Pending' &&
      req.user.hospitalId &&
      transfer.destinationHospitalId?._id?.toString() === req.user.hospitalId.toString()
    ) {
      transfer.status = 'Viewed'
      transfer.statusHistory.push({
        status: 'Viewed',
        updatedBy: req.user._id,
        timestamp: new Date(),
        notes: `Transfer record opened by receiving facility clinician ${req.user.firstName} ${req.user.lastName}.`,
      })
      await transfer.save()
    }

    return res.json(transfer)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

// PATCH /api/emergency-transfers/:id/status - accept, reject, or complete transfer
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, responseNotes } = req.body
    const validStatuses = ['Accepted', 'Rejected', 'Completed']

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${validStatuses.join(', ')}` })
    }

    const transfer = await EmergencyTransfer.findById(req.params.id)
    if (!transfer) {
      return res.status(404).json({ message: 'Emergency transfer not found.' })
    }

    transfer.status = status
    transfer.responseNotes = responseNotes || ''
    transfer.respondedBy = req.user._id
    transfer.respondedAt = new Date()

    transfer.statusHistory.push({
      status,
      updatedBy: req.user._id,
      timestamp: new Date(),
      notes: responseNotes || `Transfer status updated to ${status} by ${req.user.firstName} ${req.user.lastName}.`,
    })

    await transfer.save()

    // Audit log
    const auditAction = status === 'Accepted'
      ? 'TRANSFER_ACCEPTED'
      : status === 'Rejected'
      ? 'TRANSFER_REJECTED'
      : 'TRANSFER_COMPLETED'

    await AuditLog.create({
      transferId: transfer._id,
      patientId: transfer.patientId,
      sourceHospitalId: transfer.sourceHospitalId,
      destinationHospitalId: transfer.destinationHospitalId,
      performedBy: req.user._id,
      action: auditAction,
      details: `Emergency transfer status marked as ${status}. Notes: ${responseNotes || 'None'}`,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '',
      userAgent: req.headers['user-agent'] || '',
    })

    const updated = await EmergencyTransfer.findById(transfer._id)
      .populate('patientId', 'firstName lastName email age gender bloodType abhaId medicalCondition medication')
      .populate('sourceHospitalId', 'name code type district city contactNumber address')
      .populate('destinationHospitalId', 'name code type district city contactNumber address emergencyHelpline')
      .populate('initiatedBy', 'firstName lastName role email')
      .populate('receivingDoctorId', 'firstName lastName email department')
      .populate('respondedBy', 'firstName lastName role')

    return res.json(updated)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

// GET /api/emergency-transfers/:id/audit-logs - view audit trail
router.get('/:id/audit-logs', async (req, res) => {
  try {
    const logs = await AuditLog.find({ transferId: req.params.id })
      .populate('performedBy', 'firstName lastName role email')
      .sort({ timestamp: -1 })
    return res.json(logs)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

module.exports = router
