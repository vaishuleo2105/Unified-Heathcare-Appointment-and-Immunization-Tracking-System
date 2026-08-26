const express = require('express')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const protect = require('../middleware/auth')

const router = express.Router()

function generateToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

function userPayload(user) {
  return {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    age: user.age,
    gender: user.gender,
    bloodType: user.bloodType,
    medicalCondition: user.medicalCondition,
    medication: user.medication,
    testResults: user.testResults,
  }
}

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    const exists = await User.findOne({ email: email.toLowerCase() })
    if (exists) {
      return res.status(400).json({ message: 'Email already registered. Please login.' })
    }

    const user = new User({ firstName, lastName, email, password, role: role || 'patient' })
    await user.save()

    const token = generateToken(user._id)

    return res.status(201).json({ token, user: userPayload(user) })
  } catch (err) {
    console.error('Register error:', err.message)
    return res.status(500).json({ message: 'Server error: ' + err.message })
  }
})

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      return res.status(401).json({ message: 'No account found with this email. Please register first.' })
    }

    const isMatch = await user.matchPassword(password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password. Please try again.' })
    }

    if (role && user.role !== role) {
      return res.status(401).json({ message: `This account is registered as "${user.role}". Please select the correct role.` })
    }

    const token = generateToken(user._id)

    return res.json({ token, user: userPayload(user) })
  } catch (err) {
    console.error('Login error:', err.message)
    return res.status(500).json({ message: 'Server error: ' + err.message })
  }
})

// VERIFY TOKEN
router.get('/verify', protect, (req, res) => {
  res.json({ user: userPayload(req.user) })
})

// UPDATE MEDICAL PROFILE
router.put('/profile', protect, async (req, res) => {
  try {
    const { age, gender, bloodType, medicalCondition, medication, testResults } = req.body
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { age, gender, bloodType, medicalCondition, medication, testResults },
      { new: true }
    )
    return res.json({ user: userPayload(user) })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

module.exports = router
