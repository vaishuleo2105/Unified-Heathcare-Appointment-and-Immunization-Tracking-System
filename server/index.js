const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const dotenv = require('dotenv')

dotenv.config()

const authRoutes         = require('./routes/auth')
const maternalRoutes     = require('./routes/maternal')
const appointmentRoutes  = require('./routes/appointments')
const doctorRoutes       = require('./routes/doctors')
const immunizationRoutes = require('./routes/immunizations')
const slotRoutes         = require('./routes/slots')
const patientRoutes      = require('./routes/patients')
const { startReminderScheduler } = require('./utils/reminderScheduler')

const app = express()

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://unified-heathcare-appointment-and.onrender.com',
  ],
  credentials: true,
}))
app.use(express.json())

app.use('/api/auth',          authRoutes)
app.use('/api/maternal',      maternalRoutes)
app.use('/api/appointments',  appointmentRoutes)
app.use('/api/doctors',       doctorRoutes)
app.use('/api/immunizations', immunizationRoutes)
app.use('/api/slots',         slotRoutes)
app.use('/api/patients',      patientRoutes)

app.get('/', (req, res) => {
  res.json({ message: 'Unified Health API running' })
})

app.get('/api/test-email', async (req, res) => {
  try {
    const axios = require('axios')
    const result = await axios.post(
      'https://api.resend.com/emails',
      {
        from: 'Unified Health <onboarding@resend.dev>',
        to: [req.query.to || 'indujae35@gmail.com'],
        subject: 'Test Email from Unified Health',
        html: '<p>If you see this, Resend is working correctly!</p>',
      },
      { headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' } }
    )
    res.json({ success: true, data: result.data })
  } catch (err) {
    res.status(500).json({ error: err.response?.data || err.message })
  }
})

const PORT = process.env.PORT || 5000

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected')
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
    startReminderScheduler()
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message)
  })
