const express = require('express')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const nodemailer = require('nodemailer')
const User = require('../models/User')
const protect = require('../middleware/auth')

const router = express.Router()

function generateToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

function createTransporter() {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  })
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

// FORGOT PASSWORD — send OTP to email
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body
  if (!email) return res.status(400).json({ message: 'Email is required' })
  try {
    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) return res.status(404).json({ message: 'No account found with this email.' })
    const otp = crypto.randomInt(100000, 999999).toString()
    user.resetOtp = otp
    user.resetOtpExpiry = new Date(Date.now() + 10 * 60 * 1000)
    await user.save()
    const transporter = createTransporter()
    await transporter.sendMail({
      from: `"Unified Health" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Password Reset OTP',
      html: `<p>Hi ${user.firstName},</p><p>Your OTP to reset your password is: <strong>${otp}</strong></p><p>This OTP expires in 10 minutes.</p>`,
    })
    return res.json({ message: 'OTP sent to your email.' })
  } catch (err) {
    console.error('Forgot password error:', err.message)
    return res.status(500).json({ message: 'Failed to send OTP. Check email configuration.' })
  }
})

// VERIFY OTP
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body
  if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' })
  try {
    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user || !user.resetOtp) return res.status(400).json({ message: 'Invalid request. Please request a new OTP.' })
    if (user.resetOtpExpiry < new Date()) return res.status(400).json({ message: 'OTP has expired. Please request a new one.' })
    if (user.resetOtp !== otp) return res.status(400).json({ message: 'Incorrect OTP. Please try again.' })
    return res.json({ message: 'OTP verified.' })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

// RESET PASSWORD
router.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body
  if (!email || !otp || !newPassword) return res.status(400).json({ message: 'All fields are required' })
  if (newPassword.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' })
  try {
    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user || !user.resetOtp) return res.status(400).json({ message: 'Invalid request.' })
    if (user.resetOtpExpiry < new Date()) return res.status(400).json({ message: 'OTP has expired.' })
    if (user.resetOtp !== otp) return res.status(400).json({ message: 'Incorrect OTP.' })
    user.password = newPassword
    user.resetOtp = undefined
    user.resetOtpExpiry = undefined
    await user.save()
    return res.json({ message: 'Password reset successfully. You can now login.' })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

module.exports = router
