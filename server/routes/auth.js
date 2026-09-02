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
    abhaId: user.abhaId,
    abhaNumber: user.abhaNumber,
  }
}

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const {
      firstName, lastName, email, password, role,
      age, gender, bloodType, medicalCondition, medication, testResults
    } = req.body

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    const exists = await User.findOne({ email: email.toLowerCase() })
    if (exists) {
      return res.status(400).json({ message: 'Email already registered. Please login.' })
    }

    const userRole = role || 'patient'
    const userData = {
      firstName,
      lastName,
      email,
      password,
      role: userRole,
      age: age || (userRole === 'patient' ? 30 : undefined),
      gender: gender || (userRole === 'patient' ? 'Female' : undefined),
      bloodType: bloodType || (userRole === 'patient' ? 'O+' : undefined),
      medicalCondition: medicalCondition || (userRole === 'patient' ? 'None' : undefined),
      medication: medication || (userRole === 'patient' ? 'None' : undefined),
      testResults: testResults || (userRole === 'patient' ? 'Normal' : undefined),
    }

    const user = new User(userData)
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

    // Auto-backfill medical profile if missing for patients
    if (user.role === 'patient' && (!user.age || !user.gender || !user.bloodType)) {
      user.age = user.age || 28
      user.gender = user.gender || 'Female'
      user.bloodType = user.bloodType || 'O+'
      user.medicalCondition = user.medicalCondition || 'None'
      user.medication = user.medication || 'None'
      user.testResults = user.testResults || 'Normal'
      await user.save()
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
    const { firstName, lastName, age, gender, bloodType, medicalCondition, medication, testResults } = req.body
    const updateData = {}
    if (firstName) updateData.firstName = firstName
    if (lastName) updateData.lastName = lastName
    if (age !== undefined) updateData.age = age
    if (gender) updateData.gender = gender
    if (bloodType) updateData.bloodType = bloodType
    if (medicalCondition !== undefined) updateData.medicalCondition = medicalCondition
    if (medication !== undefined) updateData.medication = medication
    if (testResults) updateData.testResults = testResults

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true }
    )
    return res.json({ user: userPayload(user) })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

// GET ALL USERS (Admin & Staff authorized view)
router.get('/users', protect, async (req, res) => {
  try {
    if (!['admin', 'staff', 'doctor'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to view user directory' })
    }
    const users = await User.find({}).select('-password').sort({ createdAt: -1 })
    return res.json(users)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

module.exports = router
