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
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
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
