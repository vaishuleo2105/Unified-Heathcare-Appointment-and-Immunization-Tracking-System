const express = require('express')
const Slot = require('../models/Slot')
const User = require('../models/User')
const protect = require('../middleware/auth')

const router = express.Router()
router.use(protect)

router.get('/', async (req, res) => {
  try {
    const query = {}
    if (req.query.doctorId) query.doctorId = req.query.doctorId
    if (req.query.date) query.date = req.query.date
    if (req.user.role === 'doctor') query.doctorId = req.user._id
    if (req.user.role === 'patient') query.isBooked = false
    const slots = await Slot.find(query).populate('doctorId', 'firstName lastName').sort({ date: 1, time: 1 })
    return res.json(slots)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

router.post('/', async (req, res) => {
  if (!['staff', 'admin'].includes(req.user.role)) return res.status(403).json({ message: 'Only staff can manage appointment slots' })
  const { doctorId, date, time } = req.body
  if (!doctorId || !date || !time) return res.status(400).json({ message: 'doctorId, date, and time are required' })
  try {
    const doctor = await User.findOne({ _id: doctorId, role: 'doctor' })
    if (!doctor) return res.status(400).json({ message: 'Invalid doctor selected' })
    const slot = await Slot.create({ doctorId, date, time })
    return res.status(201).json(await slot.populate('doctorId', 'firstName lastName'))
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'This doctor already has a slot at that date and time' })
    return res.status(500).json({ message: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  if (!['staff', 'admin'].includes(req.user.role)) return res.status(403).json({ message: 'Only staff can manage appointment slots' })
  try {
    const slot = await Slot.findById(req.params.id)
    if (!slot) return res.status(404).json({ message: 'Slot not found' })
    if (slot.isBooked) return res.status(400).json({ message: 'A booked slot cannot be deleted' })
    await slot.deleteOne()
    return res.json({ message: 'Slot removed' })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

module.exports = router
