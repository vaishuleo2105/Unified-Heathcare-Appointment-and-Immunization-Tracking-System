const express = require('express')
const axios = require('axios')
const MaternalRecord = require('../models/MaternalRecord')
const User = require('../models/User')
const protect = require('../middleware/auth')

const router = express.Router()
router.use(protect)

const nodemailer = require('nodemailer')

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

// ── In-memory OTP sessions { txnId -> { otp, contact, verified } } ────────────
const sessions = {}

function genTxnId() {
  return 'TXN-' + Math.random().toString(36).substring(2, 10).toUpperCase()
}

function genOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

async function sendOtpEmail(to, otp) {
  const subject = 'Your Health ID Verification OTP'
  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e0e0e0;border-radius:12px;background:#ffffff">
      <h2 style="color:#1a73e8;margin-bottom:8px">Health ID Verification</h2>
      <p style="color:#555;margin-bottom:24px">Use the OTP below to verify your identity and create your Health ID.</p>
      <div style="background:#f0f4ff;border-radius:8px;padding:20px;text-align:center;letter-spacing:8px;font-size:32px;font-weight:bold;color:#1a73e8">
        ${otp}
      </div>
      <p style="color:#888;font-size:12px;margin-top:20px">This OTP is valid for 10 minutes. Do not share it with anyone.</p>
    </div>
  `

  let sent = false

  // 1. Try Resend if configured
  if (process.env.RESEND_API_KEY) {
    try {
      await axios.post(
        'https://api.resend.com/emails',
        {
          from: 'Unified Health <onboarding@resend.dev>',
          to: [to],
          subject,
          html,
        },
        { headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' } }
      )
      sent = true
      console.log(`[Email OTP] Delivered to ${to} via Resend`)
    } catch (err) {
      console.error('[Email Resend Error]:', err.response?.data || err.message)
    }
  }

  // 2. Try Nodemailer (Gmail)
  if (!sent) {
    const transporter = createEmailTransporter()
    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"Unified Health System" <${process.env.EMAIL_USER}>`,
          to,
          subject,
          html,
        })
        sent = true
        console.log(`[Email OTP] Delivered to ${to} via Nodemailer (Gmail)`)
      } catch (err) {
        console.error('[Email Nodemailer Error]:', err.message)
        throw new Error(`Gmail delivery failed: ${err.message}`)
      }
    }
  }

  if (!sent) {
    throw new Error('Email service not configured. Please ensure EMAIL_USER and EMAIL_PASS are set in server/.env.')
  }
}

// POST /api/maternal/abha/generate-otp
router.post('/abha/generate-otp', async (req, res) => {
  const { aadhaar, email } = req.body
  if (!aadhaar) return res.status(400).json({ message: 'Aadhaar number required' })

  const otp = genOtp()
  const txnId = genTxnId()

  // Determine contact — use provided email, or fall back to logged-in user's email
  const contactEmail = (email || req.user.email || '').trim()
  if (!contactEmail) {
    return res.status(400).json({ message: 'Valid email address is required to receive OTP' })
  }

  sessions[txnId] = { otp, aadhaar, contact: contactEmail, verified: false }

  // Persist OTP and TxnId on the user record in DB as well
  try {
    await User.findByIdAndUpdate(req.user._id, {
      abhaOtp: otp,
      abhaOtpExpiry: new Date(Date.now() + 15 * 60 * 1000),
      abhaTxnId: txnId,
      abhaVerified: false,
    })
  } catch (dbErr) {
    console.warn('[ABHA DB Session Warn]:', dbErr.message)
  }

  // Clean up session after 10 minutes
  setTimeout(() => { delete sessions[txnId] }, 10 * 60 * 1000)

  try {
    await sendOtpEmail(contactEmail, otp)
    console.log(`[HEALTH ID OTP] Dispatched to ${contactEmail} | txnId: ${txnId}`)
    return res.json({
      txnId,
      message: `OTP sent successfully to ${contactEmail}`,
      mock: false,
    })
  } catch (err) {
    console.error('[Email OTP Error]', err.message)
    return res.status(500).json({
      message: `Failed to send OTP to ${contactEmail}: ${err.message}`,
      mock: false,
    })
  }
})

// POST /api/maternal/abha/verify-otp
router.post('/abha/verify-otp', async (req, res) => {
  const { txnId, otp } = req.body
  if (!otp) return res.status(400).json({ message: 'OTP is required' })

  const user = await User.findById(req.user._id)
  const session = txnId ? sessions[txnId] : null

  let isMatch = false
  if (session && session.otp === otp) {
    isMatch = true
  } else if (user && user.abhaOtp === otp) {
    const isNotExpired = user.abhaOtpExpiry && new Date(user.abhaOtpExpiry) > new Date()
    if (isNotExpired) {
      isMatch = true
    }
  }

  if (!isMatch) {
    return res.status(400).json({ message: 'Incorrect or expired OTP. Please try again.' })
  }

  const newTxnId = genTxnId()
  sessions[newTxnId] = { otp, contact: user ? user.email : '', verified: true }
  if (txnId && sessions[txnId]) delete sessions[txnId]

  // Persist verified flag to DB
  try {
    await User.findByIdAndUpdate(req.user._id, {
      abhaVerified: true,
      abhaTxnId: newTxnId,
    })
  } catch (dbErr) {
    console.warn('[ABHA DB Verify Warn]:', dbErr.message)
  }

  return res.json({ txnId: newTxnId, message: 'OTP verified successfully' })
})

// GET /api/maternal/abha/my-abha
router.get('/abha/my-abha', async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    if (!user || !user.abhaId) return res.status(404).json({ hasAbha: false })
    return res.json({
      hasAbha: true,
      abhaId: user.abhaId,
      abhaNumber: user.abhaNumber,
      name: `${user.firstName} ${user.lastName}`,
      yearOfBirth: user.age ? (new Date().getFullYear() - user.age).toString() : new Date().getFullYear().toString(),
    })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

// POST /api/maternal/abha/create-health-id
router.post('/abha/create-health-id', async (req, res) => {
  const { txnId, healthId } = req.body

  const user = await User.findById(req.user._id)
  const session = txnId ? sessions[txnId] : null
  const isVerified = (session && session.verified) || (user && user.abhaVerified)

  if (!isVerified) {
    return res.status(400).json({ message: 'Session not verified. Please complete OTP verification first.' })
  }

  if (txnId && sessions[txnId]) delete sessions[txnId]

  const abhaAddress = (healthId || `${user.firstName.toLowerCase()}${user.lastName.toLowerCase()}`) + '@abdm'
  const abhaNumber = '91' + Date.now().toString().slice(-12)

  // Permanently store on User profile in DB and reset verification lock
  await User.findByIdAndUpdate(user._id, {
    abhaId: abhaAddress,
    abhaNumber,
    abhaVerified: false,
    $unset: { abhaOtp: 1, abhaOtpExpiry: 1, abhaTxnId: 1 },
  })

  return res.json({
    abhaId: abhaAddress,
    abhaNumber,
    name: `${user.firstName} ${user.lastName}`,
    gender: user.gender || 'Female',
    yearOfBirth: user.age ? (new Date().getFullYear() - user.age).toString() : new Date().getFullYear().toString(),
    message: 'Health ID created successfully',
    mock: false,
  })
})

// POST /api/maternal/abha/disconnect
router.post('/abha/disconnect', async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $unset: { abhaId: 1, abhaNumber: 1 } })
    return res.json({ message: 'ABHA ID disconnected successfully' })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

// POST /api/maternal/abha/link
router.post('/abha/link', async (req, res) => {
  const { govtMaternalId, abhaId } = req.body
  if (!govtMaternalId || !abhaId) return res.status(400).json({ message: 'govtMaternalId and abhaId required' })
  try {
    const record = await MaternalRecord.findOne({ govtMaternalId: govtMaternalId.toUpperCase() })
    if (!record) return res.status(404).json({ message: 'Maternal record not found' })
    record.abhaId = abhaId
    await record.save()
    return res.json({ message: 'Health ID linked successfully', record })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

// ── Maternal Record CRUD ──────────────────────────────────────────────────────

// GET /api/maternal/my-record — fetch maternal record for currently logged-in patient
router.get('/my-record', async (req, res) => {
  try {
    const record = await MaternalRecord.findOne({ patientId: req.user._id })
    if (!record) return res.status(404).json({ hasAccess: false, message: 'No maternal record found' })
    return res.json(record)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

// POST /api/maternal/activate — opt-in activate maternal care tracking for patient
router.post('/activate', async (req, res) => {
  try {
    let record = await MaternalRecord.findOne({ patientId: req.user._id })
    if (record) return res.json(record)

    const randomId = 'RCH-2026-' + Math.floor(100000 + Math.random() * 900000)
    record = await MaternalRecord.create({
      govtMaternalId: randomId,
      patientId: req.user._id,
      abhaId: `${req.user.firstName.toLowerCase()}@abdm`,
    })

    return res.status(201).json(record)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

router.get('/:govtMaternalId', async (req, res) => {
  try {
    const record = await MaternalRecord.findOne({ govtMaternalId: req.params.govtMaternalId.toUpperCase() })
    if (!record) return res.status(404).json({ message: 'No record found. You can register this ID below.' })
    return res.json(record)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

router.post('/', async (req, res) => {
  const { govtMaternalId } = req.body
  if (!govtMaternalId) return res.status(400).json({ message: 'govtMaternalId is required' })
  try {
    const exists = await MaternalRecord.findOne({ govtMaternalId: govtMaternalId.toUpperCase() })
    if (exists) return res.status(400).json({ message: 'Record already exists for this ID' })
    const record = await MaternalRecord.create({
      govtMaternalId: govtMaternalId.toUpperCase(),
      patientId: req.user._id,
    })
    return res.status(201).json(record)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

router.post('/:govtMaternalId/antenatal', async (req, res) => {
  const { date, notes, hospitalId } = req.body
  if (!date) return res.status(400).json({ message: 'date is required' })
  try {
    const record = await MaternalRecord.findOne({ govtMaternalId: req.params.govtMaternalId.toUpperCase() })
    if (!record) return res.status(404).json({ message: 'Record not found' })
    record.antenatalVisits.push({ date, notes, hospitalId, recordedBy: req.user._id })
    await record.save()
    return res.json(record)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

router.post('/:govtMaternalId/delivery', async (req, res) => {
  const { date, notes, hospitalId } = req.body
  if (!date) return res.status(400).json({ message: 'date is required' })
  try {
    const record = await MaternalRecord.findOne({ govtMaternalId: req.params.govtMaternalId.toUpperCase() })
    if (!record) return res.status(404).json({ message: 'Record not found' })
    record.deliveryDetails = { date, notes, hospitalId, recordedBy: req.user._id }
    await record.save()
    return res.json(record)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

module.exports = router
