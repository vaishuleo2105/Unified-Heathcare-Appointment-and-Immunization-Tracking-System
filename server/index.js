const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const dotenv = require('dotenv')
const path = require('path')

dotenv.config({ path: path.join(__dirname, '.env') })
dotenv.config()



const User = require('./models/User')
const authRoutes         = require('./routes/auth')
const maternalRoutes     = require('./routes/maternal')
const appointmentRoutes  = require('./routes/appointments')
const doctorRoutes       = require('./routes/doctors')
const immunizationRoutes = require('./routes/immunizations')
const slotRoutes         = require('./routes/slots')
const patientRoutes      = require('./routes/patients')
const medicalHistoryRoutes = require('./routes/medicalHistory')
const hospitalRoutes       = require('./routes/hospitals')
const emergencyTransferRoutes = require('./routes/emergencyTransfers')
const { startReminderScheduler } = require('./utils/reminderScheduler')

const app = express()
const clientDist = path.join(__dirname, '../client/dist')

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://unified-heathcare-appointment-and.onrender.com',
  ],
  credentials: true,
}))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

app.use('/api/auth',          authRoutes)
app.use('/api/maternal',      maternalRoutes)
app.use('/api/appointments',  appointmentRoutes)
app.use('/api/doctors',       doctorRoutes)
app.use('/api/immunizations', immunizationRoutes)
app.use('/api/slots',         slotRoutes)
app.use('/api/patients',      patientRoutes)
app.use('/api/medical-history', medicalHistoryRoutes)
app.use('/api/hospitals',     hospitalRoutes)
app.use('/api/emergency-transfers', emergencyTransferRoutes)

app.get('/', (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'))
})

app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  res.json({
    status: 'ok',
    database: dbStatus,
    nodeEnv: process.env.NODE_ENV || 'development',
  })
})


app.get('/api/telegram-sync', async (req, res) => {
  const axios = require('axios')
  const { resolveTelegramChatId } = require('./utils/smsService')
  const token = (process.env.TELEGRAM_BOT_TOKEN || '').trim()
  if (!token) {
    return res.status(400).json({ success: false, message: 'TELEGRAM_BOT_TOKEN is missing in server/.env' })
  }

  try {
    // 1. Check Bot Identity
    const meResp = await axios.get(`https://api.telegram.org/bot${token}/getMe`, { timeout: 10000 })
    const botInfo = meResp.data?.result

    // 2. Allow manual chatId override query param
    let explicitChatId = req.query.chatId ? String(req.query.chatId).trim() : null
    let activeChatId = await resolveTelegramChatId(token, explicitChatId)

    if (activeChatId) {
      // If user is authenticated, update their user document
      try {
        const authHeader = req.headers.authorization
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const jwt = require('jsonwebtoken')
          const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET)
          if (decoded && decoded.id) {
            await User.findByIdAndUpdate(decoded.id, { telegramChatId: activeChatId })
          }
        }
      } catch (authErr) {}

      // Send immediate welcome test alert
      const testSend = await axios.post(
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
          chat_id: activeChatId,
          text: `🎉 <b>Unified Health Connected!</b>\n\nYour Telegram is linked to receive appointment alerts for <b>9791868857</b>.\nAll booking and cancellation notices will arrive here instantly.`,
          parse_mode: 'HTML',
        },
        { timeout: 10000 }
      )
      return res.json({
        success: true,
        message: `Successfully connected to Telegram! Test message delivered to chat ${activeChatId}.`,
        chatId: activeChatId,
        bot: botInfo,
        testSend: testSend.data,
      })
    }

    // 3. If no chat found yet, inspect raw getUpdates to guide user
    const updatesResp = await axios.get(`https://api.telegram.org/bot${token}/getUpdates`, { timeout: 10000 })
    return res.json({
      success: false,
      message: "Telegram Bot is active, but you haven't pressed START or sent a message in the bot chat yet.",
      instruction: "1. Open https://t.me/uni_h3alth_bot on your phone or PC\n2. Tap START (or send 'hi')\n3. Refresh this page or re-test!",
      bot: botInfo,
      rawUpdatesCount: (updatesResp.data?.result || []).length,
    })
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.response?.data?.description || err.message,
    })
  }
})

app.use(express.static(clientDist))

app.get('/{*splat}', (req, res, next) => {
  if (req.path === '/api' || req.path.startsWith('/api/')) {
    return next()
  }
  return res.sendFile(path.join(clientDist, 'index.html'))
})

const PORT = process.env.PORT || 5000
const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/uhaits'
const localMongoUri = 'mongodb://127.0.0.1:27017/uhaits'

async function startServer() {
  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 })
    console.log('MongoDB connected (Primary URI)')
  } catch (err) {
    console.warn('Primary MongoDB connection failed:', err.message)
    console.log('Attempting fallback to local MongoDB instance...')
    try {
      await mongoose.connect(localMongoUri, { serverSelectionTimeoutMS: 5000 })
      console.log('MongoDB connected (Local Fallback URI)')
    } catch (fallbackErr) {
      console.error('Local MongoDB connection also failed:', fallbackErr.message)
    }
  }

  // Ensure all users in MongoDB have phone set to 9791868857
  try {
    const syncRes = await User.updateMany(
      { $or: [{ phone: { $ne: '9791868857' } }, { phone: { $exists: false } }] },
      { $set: { phone: '9791868857' } }
    )
    if (syncRes.modifiedCount > 0) {
      console.log(`[User Sync] Set mobile number to 9791868857 for ${syncRes.modifiedCount} user(s).`)
    }
  } catch (syncErr) {
    console.warn('[User Sync] Auto-update phone numbers skipped:', syncErr.message)
  }

  app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
  startReminderScheduler()
}

startServer()
