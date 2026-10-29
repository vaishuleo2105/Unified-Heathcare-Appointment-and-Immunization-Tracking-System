require('dotenv').config()
const mongoose = require('mongoose')
const User = require('./models/User')
const Hospital = require('./models/Hospital')
const Appointment = require('./models/Appointment')

async function seedTomorrowAppts(uri, label) {
  try {
    await mongoose.connect(uri)
    console.log(`Connected to ${label}`)

    const patient = await User.findOne({ email: 'indujaee@gmail.com' })
    const dr1 = await User.findOne({ email: 'dr.ramesh@unifiedhealth.com' })
    const dr2 = await User.findOne({ email: 'dr.priya@unifiedhealth.com' })
    const dr3 = await User.findOne({ email: 'dr.suresh@unifiedhealth.com' })
    const hospital = await Hospital.findOne({ code: 'TN-CBE-GH01' }) || await Hospital.findOne({})

    if (!patient) {
      console.log('Patient not found')
      return
    }

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const year = tomorrow.getFullYear()
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0')
    const day = String(tomorrow.getDate()).padStart(2, '0')
    const tomorrowStr = `${year}-${month}-${day}`

    const Immunization = require('./models/Immunization')

    // Clear existing tomorrow appts for this patient
    await Appointment.deleteMany({ date: tomorrowStr, patientId: patient._id })

    // Update Hepatitis B Dose 3 immunization date to tomorrowStr to match reminder email date
    await Immunization.updateMany(
      { patientId: patient._id, vaccineName: 'Hepatitis B', dose: 'Dose 3' },
      { date: tomorrowStr, status: 'Upcoming' }
    )

    const newAppts = await Appointment.insertMany([
      {
        patientId: patient._id,
        doctorId: dr1?._id,
        hospitalId: hospital?._id,
        date: tomorrowStr,
        time: '09:30 AM',
        type: 'Hepatitis B & DPT Vaccination Follow-up',
        status: 'Confirmed',
        notes: 'Child Immunization Milestone & Hepatitis B Dose 3',
        reminderSent: false,
      },
      {
        patientId: patient._id,
        doctorId: dr2?._id,
        hospitalId: hospital?._id,
        date: tomorrowStr,
        time: '11:00 AM',
        type: 'Maternal Routine Checkup',
        status: 'Confirmed',
        notes: 'Routine Blood Pressure & Hemoglobin Monitoring',
        reminderSent: false,
      },
      {
        patientId: patient._id,
        doctorId: dr3?._id,
        hospitalId: hospital?._id,
        date: tomorrowStr,
        time: '02:30 PM',
        type: 'Pediatric OPV Vaccination',
        status: 'Pending',
        notes: 'Oral Polio Vaccine Dose 3 Schedule',
        reminderSent: false,
      },
    ])

    console.log(`✅ Successfully seeded ${newAppts.length} appointments for tomorrow (${tomorrowStr}) for indujaee@gmail.com in ${label}`)
    await mongoose.disconnect()
  } catch (err) {
    console.error(`Error in ${label}:`, err.message)
  }
}

async function run() {
  if (process.env.MONGO_URI) {
    await seedTomorrowAppts(process.env.MONGO_URI, 'Primary Mongo URI')
  }
  await seedTomorrowAppts('mongodb://127.0.0.1:27017/uhaits', 'Local Fallback Mongo URI')
}

run()
