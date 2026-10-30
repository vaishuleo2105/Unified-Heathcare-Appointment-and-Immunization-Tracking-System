const express = require('express')
const axios = require('axios')
const MaternalRecord = require('../models/MaternalRecord')
const User = require('../models/User')
const protect = require('../middleware/auth')
const { sendOtpEmail } = require('../utils/emailService')
const { sendSMS } = require('../utils/smsService')

const router = express.Router()
router.use(protect)

// ── In-memory OTP sessions { txnId -> { otp, contact, verified } } ────────────
const sessions = {}

function genTxnId() {
  return 'TXN-' + Math.random().toString(36).substring(2, 10).toUpperCase()
}

function genOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString()
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

  let emailSent = false
  let emailErrorMsg = ''
  try {
    await sendOtpEmail(contactEmail, otp, 'Your Health ID Verification OTP', 'Health ID Verification')
    emailSent = true
    console.log(`[HEALTH ID OTP] Dispatched via Email to ${contactEmail} | txnId: ${txnId}`)
  } catch (err) {
    emailErrorMsg = err.message
    console.error('[Email OTP Error]', err.message)
  }

  // Also dispatch SMS & Telegram Notification to user!
  try {
    const userPhone = req.user.phone || '9791868857'
    const userChatId = req.user.telegramChatId || process.env.TELEGRAM_CHAT_ID
    const msg = `Unified Health: Your ABHA Verification OTP is ${otp}. Valid for 10 minutes.`
    await sendSMS([userPhone], msg, userChatId)
    console.log(`[HEALTH ID OTP] Also dispatched via Telegram/SMS to ${userPhone}`)
  } catch (smsErr) {
    console.warn('[Telegram/SMS OTP Warn]:', smsErr.message)
  }

  if (emailSent) {
    return res.json({
      txnId,
      message: `OTP sent successfully to ${contactEmail} and your linked Telegram bot!`,
      mock: false,
    })
  }

  // If email was blocked or failed, deliver via Telegram and provide OTP so patient can proceed
  return res.json({
    txnId,
    message: `OTP delivered to your Telegram bot! (Email note: ${emailErrorMsg}). Verification OTP: ${otp}`,
    mock: true,
    otp,
  })
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
