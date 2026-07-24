const express = require('express')
const MaternalRecord = require('../models/MaternalRecord')
const protect = require('../middleware/auth')

const router = express.Router()

// GET full maternal record by govt ID
router.get('/:govtMaternalId', protect, async (req, res) => {
  try {
    const record = await MaternalRecord.findOne({ govtMaternalId: req.params.govtMaternalId })
    if (!record) return res.status(404).json({ message: 'No record found for this Maternal ID' })
    res.json(record)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST create or init a maternal record
router.post('/', protect, async (req, res) => {
  try {
    const { govtMaternalId } = req.body
    const exists = await MaternalRecord.findOne({ govtMaternalId })
    if (exists) return res.status(400).json({ message: 'Record already exists for this Maternal ID' })

    const record = await MaternalRecord.create({ govtMaternalId, patientId: req.user._id })
    res.status(201).json(record)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST add antenatal visit
router.post('/:govtMaternalId/antenatal', protect, async (req, res) => {
  try {
    const { date, notes, hospitalId } = req.body
    const record = await MaternalRecord.findOneAndUpdate(
      { govtMaternalId: req.params.govtMaternalId },
      { $push: { antenatalVisits: { date, notes, hospitalId } } },
      { new: true }
    )
    if (!record) return res.status(404).json({ message: 'Maternal record not found' })
    res.json(record)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST add/update delivery details
router.post('/:govtMaternalId/delivery', protect, async (req, res) => {
  try {
    const { date, notes, hospitalId } = req.body
    const record = await MaternalRecord.findOneAndUpdate(
      { govtMaternalId: req.params.govtMaternalId },
      { $set: { deliveryDetails: { date, notes, hospitalId } } },
      { new: true }
    )
    if (!record) return res.status(404).json({ message: 'Maternal record not found' })
    res.json(record)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
