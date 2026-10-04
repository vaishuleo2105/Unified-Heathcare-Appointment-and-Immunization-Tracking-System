const express = require('express')
const Hospital = require('../models/Hospital')
const User = require('../models/User')

const router = express.Router()

// GET /api/hospitals - list all active Tamil Nadu hospitals
router.get('/', async (req, res) => {
  try {
    const { district, type, q } = req.query
    let filter = { isActive: true }

    if (district) {
      filter.district = new RegExp(`^${district}$`, 'i')
    }
    if (type) {
      filter.type = type
    }
    if (q) {
      filter.$or = [
        { name: new RegExp(q, 'i') },
        { district: new RegExp(q, 'i') },
        { city: new RegExp(q, 'i') },
        { code: new RegExp(q, 'i') },
      ]
    }

    const hospitals = await Hospital.find(filter).sort({ district: 1, name: 1 })
    return res.json(hospitals)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

// GET /api/hospitals/:id - hospital details and associated doctors
router.get('/:id', async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id)
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found' })
    }

    const doctors = await User.find({ hospitalId: hospital._id, role: 'doctor' })
      .select('firstName lastName email department')

    return res.json({ hospital, doctors })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

module.exports = router
