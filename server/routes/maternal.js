const express = require('express')
const axios = require('axios')
const MaternalRecord = require('../models/MaternalRecord')
const protect = require('../middleware/auth')

const router = express.Router()
router.use(protect)

// ── ABHA helpers ──────────────────────────────────────────────────────────────

const ABHA_BASE = process.env.ABHA_BASE_URL || 'https://healthidsbx.abdm.gov.in/api'
const ABHA_CLIENT_ID = process.env.ABHA_CLIENT_ID || ''
const ABHA_CLIENT_SECRET = process.env.ABHA_CLIENT_SECRET || ''

// Mock mode is active when credentials are not configured
const MOCK_MODE = !ABHA_CLIENT_ID || ABHA_CLIENT_ID === 'your_sandbox_client_id'

// In-memory store for mock OTP sessions { txnId -> { otp, aadhaar } }
const mockSessions = {}

function mockTxnId() {
  return 'MOCK-' + Math.random().toString(36).substring(2, 10).toUpperCase()
}

async function getAbhaToken() {
  const { data } = await axios.post(
    'https://dev.abdm.gov.in/gateway/v0.5/sessions',
    { clientId: ABHA_CLIENT_ID, clientSecret: ABHA_CLIENT_SECRET },
    { headers: { 'Content-Type': 'application/json' } }
  )
  return data.accessToken
}

// POST /api/maternal/abha/generate-otp
router.post('/abha/generate-otp', async (req, res) => {
  const { aadhaar } = req.body
  if (!aadhaar) return res.status(400).json({ message: 'Aadhaar number required' })

  if (MOCK_MODE) {
    const txnId = mockTxnId()
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    mockSessions[txnId] = { otp, aadhaar }
    console.log(`[ABHA MOCK] OTP for ${aadhaar}: ${otp} | txnId: ${txnId}`)
    return res.json({
      txnId,
      message: `[DEMO MODE] OTP is: ${otp} — check your server terminal`,
      mock: true,
    })
  }

  try {
    const token = await getAbhaToken()
    const { data } = await axios.post(
      `${ABHA_BASE}/v1/registration/aadhaar/generateOtp`,
      { aadhaar },
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    )
    return res.json({ txnId: data.txnId, message: 'OTP sent to Aadhaar-linked mobile' })
  } catch (err) {
    const msg = err.response?.data?.details?.[0]?.message || err.response?.data?.message || err.message
    return res.status(err.response?.status || 500).json({ message: msg })
  }
})

// POST /api/maternal/abha/verify-otp
router.post('/abha/verify-otp', async (req, res) => {
  const { txnId, otp } = req.body
  if (!txnId || !otp) return res.status(400).json({ message: 'txnId and otp required' })

  if (MOCK_MODE) {
    const session = mockSessions[txnId]
    if (!session) return res.status(400).json({ message: 'Invalid or expired session. Please start again.' })
    if (session.otp !== otp) return res.status(400).json({ message: 'Incorrect OTP. Please try again.' })
    const newTxnId = mockTxnId()
    mockSessions[newTxnId] = { ...session, verified: true }
    delete mockSessions[txnId]
    return res.json({ txnId: newTxnId, mobileLinked: true, message: 'OTP verified successfully' })
  }

  try {
    const token = await getAbhaToken()
    const { data } = await axios.post(
      `${ABHA_BASE}/v1/registration/aadhaar/verifyOTP`,
      { txnId, otp },
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    )
    return res.json({ txnId: data.txnId, mobileLinked: data.mobileLinked, message: 'OTP verified' })
  } catch (err) {
    const msg = err.response?.data?.details?.[0]?.message || err.response?.data?.message || err.message
    return res.status(err.response?.status || 500).json({ message: msg })
  }
})

// POST /api/maternal/abha/create-health-id
router.post('/abha/create-health-id', async (req, res) => {
  const { txnId, healthId } = req.body
  if (!txnId) return res.status(400).json({ message: 'txnId required' })

  if (MOCK_MODE) {
    const session = mockSessions[txnId]
    if (!session || !session.verified)
      return res.status(400).json({ message: 'Session not verified. Please complete OTP verification first.' })
    delete mockSessions[txnId]
    const abhaAddress = (healthId || 'demo.user') + '@abdm'
    const abhaNumber = '91' + session.aadhaar.slice(0, 12)
    return res.json({
      abhaId: abhaAddress,
      abhaNumber,
      name: 'Demo User',
      gender: 'M',
      yearOfBirth: '1995',
      message: 'ABHA Health ID created successfully (Demo Mode)',
      mock: true,
    })
  }

  try {
    const token = await getAbhaToken()
    const { data } = await axios.post(
      `${ABHA_BASE}/v1/registration/aadhaar/createHealthIdWithPreVerified`,
      { txnId, ...(healthId && { healthId }) },
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    )
    return res.json({
      abhaId: data.healthId,
      abhaNumber: data.healthIdNumber,
      name: data.name,
      gender: data.gender,
      yearOfBirth: data.yearOfBirth,
      message: 'ABHA Health ID created successfully',
    })
  } catch (err) {
    const msg = err.response?.data?.details?.[0]?.message || err.response?.data?.message || err.message
    return res.status(err.response?.status || 500).json({ message: msg })
  }
})

// POST /api/maternal/abha/link  — link an existing ABHA ID to a maternal record
router.post('/abha/link', async (req, res) => {
  const { govtMaternalId, abhaId } = req.body
  if (!govtMaternalId || !abhaId) return res.status(400).json({ message: 'govtMaternalId and abhaId required' })
  try {
    let record = await MaternalRecord.findOne({ govtMaternalId: govtMaternalId.toUpperCase() })
    if (!record) return res.status(404).json({ message: 'Maternal record not found' })
    record.abhaId = abhaId
    await record.save()
    return res.json({ message: 'ABHA ID linked successfully', record })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

// ── Maternal Record CRUD ──────────────────────────────────────────────────────

// GET /api/maternal/:govtMaternalId
router.get('/:govtMaternalId', async (req, res) => {
  try {
    const record = await MaternalRecord.findOne({ govtMaternalId: req.params.govtMaternalId.toUpperCase() })
    if (!record) return res.status(404).json({ message: 'No record found. You can register this ID below.' })
    return res.json(record)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

// POST /api/maternal  — register new maternal record
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

// POST /api/maternal/:govtMaternalId/antenatal
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

// POST /api/maternal/:govtMaternalId/delivery
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
