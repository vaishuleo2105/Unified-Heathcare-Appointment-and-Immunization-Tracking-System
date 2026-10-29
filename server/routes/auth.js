const express = require('express')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const axios = require('axios')
const nodemailer = require('nodemailer')
const User = require('../models/User')
const protect = require('../middleware/auth')

function createEmailTransporter() {
  const EMAIL_USER = process.env.EMAIL_USER || ''
  const EMAIL_PASS = process.env.EMAIL_PASS || ''
  const isConfigured = EMAIL_USER && !EMAIL_USER.includes('your_email') && !!EMAIL_PASS

  if (!isConfigured) return null
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: EMAIL_USER.trim(),
      pass: EMAIL_PASS.replace(/\s+/g, '').trim(),
    },
  })
}

const router = express.Router()

function generateToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

function userPayload(user) {
  return {
    id: user._id,
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone || '9791868857',
    role: user.role,
    age: user.age,
    gender: user.gender,
    bloodType: user.bloodType,
    medicalCondition: user.medicalCondition,
    medication: user.medication,
    testResults: user.testResults,
    abhaId: user.abhaId,
    abhaNumber: user.abhaNumber,
    hospitalId: user.hospitalId,
    department: user.department,
    telegramChatId: user.telegramChatId || '',
  }
}

function getErrorMessage(err) {
  if (process.env.NODE_ENV === 'production') {
    return 'Something went wrong. Please try again.'
  }
  return err.message
}

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const {
      firstName, lastName, email, password, phone, role,
      age, gender, bloodType, medicalCondition, medication, testResults,
      hospitalId, department
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
      phone: phone || '9791868857',
      role: userRole,
      age: age || (userRole === 'patient' ? 30 : undefined),
      gender: gender || (userRole === 'patient' ? 'Female' : undefined),
      bloodType: bloodType || (userRole === 'patient' ? 'O+' : undefined),
      medicalCondition: medicalCondition || (userRole === 'patient' ? 'None' : undefined),
      medication: medication || (userRole === 'patient' ? 'None' : undefined),
      testResults: testResults || (userRole === 'patient' ? 'Normal' : undefined),
      hospitalId: hospitalId || undefined,
      department: department || undefined,
      telegramChatId: req.body.telegramChatId ? String(req.body.telegramChatId).trim() : undefined,
    }

    const user = new User(userData)
    await user.save()
    await user.populate('hospitalId')

    const token = generateToken(user._id)

    return res.status(201).json({ token, user: userPayload(user) })
  } catch (err) {
    console.error('Register error:', err.message)
    return res.status(500).json({ message: getErrorMessage(err) })
  }
})

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).populate('hospitalId')
    if (!user) {
      return res.status(401).json({ message: 'No account found with this email. Please check your credentials or register.' })
    }

    const isMatch = await user.matchPassword(password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password. Please try again.' })
    }

    // Auto-backfill medical profile if missing for patients, and ensure phone is set
    let shouldSave = false
    if (!user.phone) {
      user.phone = '9791868857'
      shouldSave = true
    }
    if (user.role === 'patient' && (!user.age || !user.gender || !user.bloodType)) {
      user.age = user.age || 28
      user.gender = user.gender || 'Female'
      user.bloodType = user.bloodType || 'O+'
      user.medicalCondition = user.medicalCondition || 'None'
      user.medication = user.medication || 'None'
      user.testResults = user.testResults || 'Normal'
      shouldSave = true
    }
    if (shouldSave) {
      await user.save().catch(() => {})
    }

    const token = generateToken(user._id)
    return res.status(200).json({ token, user: userPayload(user) })
  } catch (err) {
    console.error('Login error:', err.message)
    return res.status(500).json({ message: getErrorMessage(err) })
  }
})

// VERIFY TOKEN
router.get('/verify', protect, async (req, res) => {
  const user = await User.findById(req.user._id).populate('hospitalId')
  if (user && !user.phone) {
    user.phone = '9791868857'
    await user.save().catch(() => {})
  }
  res.json({ user: userPayload(user || req.user) })
})

// UPDATE MEDICAL PROFILE
router.put('/profile', protect, async (req, res) => {
  try {
    const { firstName, lastName, phone, age, gender, bloodType, medicalCondition, medication, testResults, hospitalId, department } = req.body
    const updateData = {}
    if (firstName) updateData.firstName = firstName
    if (lastName) updateData.lastName = lastName
    if (phone !== undefined) updateData.phone = phone
    if (age !== undefined) updateData.age = age
    if (gender) updateData.gender = gender
    if (bloodType) updateData.bloodType = bloodType
    if (medicalCondition !== undefined) updateData.medicalCondition = medicalCondition
    if (medication !== undefined) updateData.medication = medication
    if (testResults) updateData.testResults = testResults
    if (hospitalId) updateData.hospitalId = hospitalId
    if (department !== undefined) updateData.department = department

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true }
    ).populate('hospitalId')
    return res.json({ user: userPayload(user) })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

// LINK TELEGRAM CHAT ID
router.post('/link-telegram', protect, async (req, res) => {
  try {
    const { chatId } = req.body
    if (!chatId) return res.status(400).json({ success: false, message: 'chatId is required' })
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { telegramChatId: String(chatId).trim() },
      { new: true }
    ).populate('hospitalId')
    return res.json({ success: true, message: 'Telegram linked successfully', user: userPayload(user) })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
})

// UNLINK TELEGRAM CHAT ID
router.post('/unlink-telegram', protect, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $unset: { telegramChatId: 1 } },
      { new: true }
    ).populate('hospitalId')
    return res.json({ success: true, message: 'Telegram unlinked successfully', user: userPayload(user) })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
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
    return res.status(500).json({ message: getErrorMessage(err) })
  }
})

// FORGOT PASSWORD
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

    let sent = false
    const subject = 'Password Reset OTP - Unified Healthcare'
    const html = `<p>Hi ${user.firstName},</p><p>Your OTP to reset your password is: <strong>${otp}</strong></p><p>This OTP expires in 10 minutes.</p>`

    if (process.env.RESEND_API_KEY) {
      try {
        await axios.post(
          'https://api.resend.com/emails',
          {
            from: 'Unified Health <onboarding@resend.dev>',
            to: [user.email],
            subject,
            html,
          },
          { headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' } }
        )
        sent = true
      } catch (err) {}
    }

    if (!sent) {
      const transporter = createEmailTransporter()
      if (transporter) {
        await transporter.sendMail({
          from: `"Unified Health System" <${process.env.EMAIL_USER}>`,
          to: user.email,
          subject,
          html,
        })
        sent = true
      }
    }

    if (!sent) {
      throw new Error('Email delivery could not be completed')
    }

    return res.json({ message: 'OTP sent to your email.' })
  } catch (err) {
    console.error('Forgot password error:', err.message)
    return res.status(500).json({
      message: process.env.NODE_ENV === 'production'
        ? 'Failed to send OTP. Please try again later.'
        : `Failed to send OTP: ${err.message}`
    })
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
    return res.status(500).json({ message: getErrorMessage(err) })
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
    return res.status(500).json({ message: getErrorMessage(err) })
  }
})

module.exports = router
