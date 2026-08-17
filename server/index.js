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

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/auth',          authRoutes)
app.use('/api/maternal',      maternalRoutes)
app.use('/api/appointments',  appointmentRoutes)
app.use('/api/doctors',       doctorRoutes)
app.use('/api/immunizations', immunizationRoutes)

app.get('/', (req, res) => {
  res.json({ message: 'Unified Health API running' })
})

const PORT = process.env.PORT || 5000

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected')
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message)
  })
