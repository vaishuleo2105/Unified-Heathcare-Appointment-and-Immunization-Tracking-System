require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const User = require('./models/User')
const Appointment = require('./models/Appointment')
const Immunization = require('./models/Immunization')
const MaternalRecord = require('./models/MaternalRecord')

async function seedIndujaHistory() {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('Connected to MongoDB')

    const targetEmail = 'indujaee@gmail.com'

    // 1. Find or create user indujaee@gmail.com
    let user = await User.findOne({ email: targetEmail })
    const hash = await bcrypt.hash('password123', 10)

    if (!user) {
      user = await User.create({
        firstName: 'Induja',
        lastName: 'E',
        email: targetEmail,
        password: hash,
        role: 'patient',
        age: 26,
        gender: 'Female',
        bloodType: 'O+',
        medicalCondition: 'Maternal Care & Mild Asthma',
        medication: 'Folic Acid 5mg, Iron Supplement',
        testResults: 'Normal',
        abhaId: '91-2834-1092-4821',
        abhaNumber: 'ABHA-9128341092'
      })
      console.log('Created user indujaee@gmail.com')
    } else {
      user.age = 26
      user.gender = 'Female'
      user.bloodType = 'O+'
      user.medicalCondition = 'Maternal Care & Mild Asthma'
      user.medication = 'Folic Acid 5mg, Iron Supplement'
      user.testResults = 'Normal'
      user.abhaId = user.abhaId || '91-2834-1092-4821'
      user.abhaNumber = user.abhaNumber || 'ABHA-9128341092'
      await user.save()
      console.log('Updated medical profile for indujaee@gmail.com')
    }

    const patientId = user._id

    // Find doctors to associate with appointments
    let doctors = await User.find({ role: 'doctor' })
    if (doctors.length === 0) {
      const dr = await User.create({
        firstName: 'Ramesh',
        lastName: 'Kumar',
        email: 'dr.ramesh@unifiedhealth.com',
        password: hash,
        role: 'doctor'
      })
      doctors = [dr]
    }
    const doctorId1 = doctors[0]._id
    const doctorId2 = doctors[1] ? doctors[1]._id : doctors[0]._id

    // 2. Clear old appointments, immunizations, maternal records for this patient
    await Appointment.deleteMany({ patientId })
    await Immunization.deleteMany({ patientId })
    await MaternalRecord.deleteMany({ patientId })

    // 3. Create rich Appointments
    await Appointment.create([
      {
        patientId,
        doctorId: doctorId1,
        date: '2026-08-10',
        time: '10:00 AM',
        type: 'General Checkup',
        status: 'Completed',
        notes: 'Routine health evaluation and vital signs check.',
        consultationNotes: 'BP 118/76 mmHg, Pulse 72 bpm. Vitals within normal limits.',
        consultationOutcome: 'Prescribed prenatal vitamins and recommended hydration.',
        completedAt: new Date('2026-08-10T10:30:00Z')
      },
      {
        patientId,
        doctorId: doctorId2,
        date: '2026-08-25',
        time: '11:30 AM',
        type: 'Vaccination',
        status: 'Completed',
        notes: 'Tetanus Toxoid dose 1 administration.',
        consultationNotes: 'Administered TT-1 dose in right arm. Patient tolerated well.',
        consultationOutcome: 'Scheduled TT-2 booster dose after 4 weeks.',
        completedAt: new Date('2026-08-25T11:45:00Z')
      },
      {
        patientId,
        doctorId: doctorId2,
        date: '2026-09-15',
        time: '02:00 PM',
        type: 'Consultation',
        status: 'Completed',
        notes: 'Antenatal Checkup 2nd Trimester review.',
        consultationNotes: 'Fetal movement active, ultrasound scan shows healthy fetal development.',
        consultationOutcome: 'Continue Folic Acid and Iron supplements daily.',
        completedAt: new Date('2026-09-15T14:30:00Z')
      },
      {
        patientId,
        doctorId: doctorId1,
        date: '2026-10-20',
        time: '10:00 AM',
        type: 'Follow-up',
        status: 'Confirmed',
        notes: 'Scheduled 3rd Trimester antenatal follow-up evaluation.'
      }
    ])
    console.log('Created 4 appointment history records for indujaee@gmail.com')

    // 4. Create rich Immunizations
    await Immunization.create([
      {
        patientId,
        vaccineName: 'Tetanus Toxoid (TT-1)',
        date: '2026-08-25',
        dueDate: '2026-08-25',
        status: 'Completed',
        dose: 'Dose 1 (0.5 mL)',
        administeredBy: doctorId2,
        notes: 'Maternal tetanus prevention first dose.'
      },
      {
        patientId,
        vaccineName: 'Tetanus Toxoid (TT-2)',
        date: '2026-09-25',
        dueDate: '2026-09-25',
        status: 'Completed',
        dose: 'Dose 2 (0.5 mL)',
        administeredBy: doctorId2,
        notes: 'Maternal tetanus booster dose.'
      },
      {
        patientId,
        vaccineName: 'Influenza (Flu) Vaccine',
        date: '2026-10-05',
        dueDate: '2026-10-05',
        status: 'Completed',
        dose: 'Annual Dose',
        administeredBy: doctorId1,
        notes: 'Seasonal flu protection for pregnancy.'
      },
      {
        patientId,
        vaccineName: 'Hepatitis B Vaccine',
        date: '2026-11-15',
        dueDate: '2026-11-15',
        status: 'Upcoming',
        dose: 'Booster Dose',
        notes: 'Scheduled preventive booster.'
      }
    ])
    console.log('Created 4 immunization history records for indujaee@gmail.com')

    // 5. Create rich Maternal Record
    await MaternalRecord.create({
      govtMaternalId: 'RCH-2026-948201',
      patientId,
      abhaId: '91-2834-1092-4821',
      antenatalVisits: [
        {
          date: new Date('2026-06-15'),
          hospitalId: 'PSG Medical Center',
          notes: 'ANC Visit 1 - First trimester checkup, BP 118/76, Normal early scan.',
          recordedBy: doctorId1
        },
        {
          date: new Date('2026-08-10'),
          hospitalId: 'PSG Medical Center',
          notes: 'ANC Visit 2 - Hemoglobin 12.2 g/dL, normal fetal heart sound.',
          recordedBy: doctorId2
        },
        {
          date: new Date('2026-09-15'),
          hospitalId: 'PSG Medical Center',
          notes: 'ANC Visit 3 - Growth tracking normal, active fetal movements.',
          recordedBy: doctorId2
        }
      ],
      deliveryDetails: {
        date: null,
        hospitalId: 'PSG Medical Center',
        notes: 'Expected Delivery Date: January 2027.'
      }
    })
    console.log('Created Maternal RCH Record for indujaee@gmail.com')

    console.log('Seeding complete for indujaee@gmail.com!')
  } catch (err) {
    console.error('Seeding error:', err)
  } finally {
    await mongoose.disconnect()
  }
}

seedIndujaHistory()
