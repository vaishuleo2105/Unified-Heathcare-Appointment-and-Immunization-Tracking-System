const express = require('express')
const Immunization = require('../models/Immunization')
const protect = require('../middleware/auth')

const router = express.Router()
router.use(protect)

// GET /api/immunizations  — patient sees own, staff/doctor/admin see all or by patientId
router.get('/', async (req, res) => {
  try {
    let query = {}
    if (req.user.role === 'patient') query.patientId = req.user._id
    else if (req.query.patientId) query.patientId = req.query.patientId

    const records = await Immunization.find(query)
      .populate('patientId', 'firstName lastName email')
      .populate('administeredBy', 'firstName lastName')
      .sort({ date: -1 })
    return res.json(records)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

// GET /api/immunizations/reminders — due/overdue vaccine reminders for the dashboard
router.get('/reminders', async (req, res) => {
  try {
    let query = { status: 'Upcoming' }
    if (req.user.role === 'patient') query.patientId = req.user._id
    const records = await Immunization.find(query)
      .populate('patientId', 'firstName lastName email')
      .sort({ dueDate: 1, date: 1 })
    const today = new Date().toISOString().split('T')[0]
    const reminders = records.map(record => {
      const dueDate = record.dueDate || record.date
      return {
        _id: record._id,
        patientId: record.patientId,
        vaccineName: record.vaccineName,
        dose: record.dose,
        dueDate,
        status: dueDate < today ? 'Overdue' : dueDate === today ? 'Due today' : 'Upcoming',
      }
    })
    return res.json(reminders)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

// POST /api/immunizations  — staff/doctor adds immunization record
router.post('/', async (req, res) => {
  if (!['staff', 'doctor', 'admin'].includes(req.user.role))
    return res.status(403).json({ message: 'Not authorized to add immunization records' })
  const { patientId, vaccineName, date, dueDate, status, dose, notes } = req.body
  if (!patientId || !vaccineName || !date)
    return res.status(400).json({ message: 'patientId, vaccineName, and date are required' })
  try {
    const record = await Immunization.create({
      patientId,
      vaccineName,
      date,
      dueDate,
      status: status || 'Completed',
      dose,
      notes,
      administeredBy: req.user._id,
    })
    const populated = await record.populate([
      { path: 'patientId', select: 'firstName lastName email' },
      { path: 'administeredBy', select: 'firstName lastName' },
    ])
    return res.status(201).json(populated)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

// DELETE /api/immunizations/:id
router.delete('/:id', async (req, res) => {
  if (!['staff', 'admin'].includes(req.user.role))
    return res.status(403).json({ message: 'Not authorized' })
  try {
    const record = await Immunization.findByIdAndDelete(req.params.id)
    if (!record) return res.status(404).json({ message: 'Record not found' })
    return res.json({ message: 'Record deleted' })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

module.exports = router
