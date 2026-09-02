const express = require('express')
const nodemailer = require('nodemailer')
const MaternalRecord = require('../models/MaternalRecord')
const User = require('../models/User')
const protect = require('../middleware/auth')

const router = express.Router()
router.use(protect)

// ── Email transporter ─────────────────────────────────────────────────────────
const EMAIL_USER = process.env.EMAIL_USER || ''
const EMAIL_PASS = process.env.EMAIL_PASS || ''
const EMAIL_CONFIGURED = EMAIL_USER && EMAIL_USER !== 'your_gmail@gmail.com'

const transporter = EMAIL_CONFIGURED
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: { user: EMAIL_USER, pass: EMAIL_PASS },
    })
  : null

// ── In-memory OTP sessions { txnId -> { otp, contact, verified } } ────────────
const sessions = {}

function genTxnId() {
  return 'TXN-' + Math.random().toString(36).substring(2, 10).toUpperCase()
}

function genOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

async function sendOtpEmail(to, otp) {
  await transporter.sendMail({
    from: `"Unified Health" <${EMAIL_USER}>`,
    to,
    subject: 'Your Health ID Verification OTP',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e0e0e0;border-radius:12px">
        <h2 style="color:#1a73e8;margin-bottom:8px">Health ID Verification</h2>
        <p style="color:#555;margin-bottom:24px">Use the OTP below to verify your identity and create your Health ID.</p>
        <div style="background:#f0f4ff;border-radius:8px;padding:20px;text-align:center;letter-spacing:8px;font-size:32px;font-weight:bold;color:#1a73e8">
          ${otp}
        </div>
        <p style="color:#888;font-size:12px;margin-top:20px">This OTP is valid for 10 minutes. Do not share it with anyone.</p>
      </div>
    `,
  })
}

// POST /api/maternal/abha/generate-otp
router.post('/abha/generate-otp', async (req, res) => {
  const { aadhaar, email } = req.body
  if (!aadhaar) return res.status(400).json({ message: 'Aadhaar number required' })

  const otp = genOtp()
  const txnId = genTxnId()

  // Determine contact — use provided email, or fall back to logged-in user's email
  const contactEmail = email || req.user.email

  sessions[txnId] = { otp, aadhaar, contact: contactEmail, verified: false }

  // Clean up session after 10 minutes
  setTimeout(() => { delete sessions[txnId] }, 10 * 60 * 1000)

  if (EMAIL_CONFIGURED) {
    try {
      await sendOtpEmail(contactEmail, otp)
      return res.json({
        txnId,
        message: `OTP sent to ${contactEmail}`,
        mock: false,
      })
    } catch (err) {
      console.error('[Email OTP Error]', err.message)
      // Fall through to demo mode if email fails
    }
  }

  // Demo mode — return OTP in response
  console.log(`[HEALTH ID DEMO] OTP for ${aadhaar}: ${otp} | txnId: ${txnId}`)
  return res.json({
    txnId,
    message: `[Demo] OTP is: ${otp}`,
    mock: true,
  })
})

// POST /api/maternal/abha/verify-otp
router.post('/abha/verify-otp', async (req, res) => {
  const { txnId, otp } = req.body
  if (!txnId || !otp) return res.status(400).json({ message: 'txnId and otp required' })

  const session = sessions[txnId]
  if (!session) return res.status(400).json({ message: 'Session expired or invalid. Please start again.' })
  if (session.otp !== otp) return res.status(400).json({ message: 'Incorrect OTP. Please try again.' })

  const newTxnId = genTxnId()
  sessions[newTxnId] = { ...session, verified: true }
  delete sessions[txnId]

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
      yearOfBirth: new Date().getFullYear().toString(),
    })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

// POST /api/maternal/abha/create-health-id
router.post('/abha/create-health-id', async (req, res) => {
  const { txnId, healthId } = req.body
  if (!txnId) return res.status(400).json({ message: 'txnId required' })

  const session = sessions[txnId]
  if (!session || !session.verified)
    return res.status(400).json({ message: 'Session not verified. Please complete OTP verification first.' })

  delete sessions[txnId]

  const user = req.user
  const abhaAddress = (healthId || `${user.firstName.toLowerCase()}${user.lastName.toLowerCase()}`) + '@abdm'
  const abhaNumber = '91' + Date.now().toString().slice(-12)

  // Permanently store on User profile in DB
  await User.findByIdAndUpdate(user._id, { abhaId: abhaAddress, abhaNumber })

  return res.json({
    abhaId: abhaAddress,
    abhaNumber,
    name: `${user.firstName} ${user.lastName}`,
    gender: 'N/A',
    yearOfBirth: new Date().getFullYear().toString(),
    message: 'Health ID created successfully',
    mock: !EMAIL_CONFIGURED,
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
