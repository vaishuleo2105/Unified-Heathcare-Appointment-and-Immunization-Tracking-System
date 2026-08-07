require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const User         = require('./models/User')
const Appointment  = require('./models/Appointment')
const Immunization = require('./models/Immunization')
const MaternalRecord = require('./models/MaternalRecord')

const PATIENT_ID = '6a59e66bd4154eec174168c8'  // indujaee@gmail.com

async function seed() {
  await mongoose.connect(process.env.MONGO_URI)
  console.log('Connected to MongoDB')

  // ── 1. Create doctors, staff, admin ───────────────────────────────────────
  const hash = await bcrypt.hash('password123', 10)

  const doctorData = [
    { firstName: 'Ramesh',  lastName: 'Kumar',  email: 'dr.ramesh@unifiedhealth.com',  role: 'doctor' },
    { firstName: 'Priya',   lastName: 'Nair',   email: 'dr.priya@unifiedhealth.com',   role: 'doctor' },
    { firstName: 'Suresh',  lastName: 'Menon',  email: 'dr.suresh@unifiedhealth.com',  role: 'doctor' },
  ]
  const staffData = [
    { firstName: 'Anitha',  lastName: 'Raj',    email: 'staff.anitha@unifiedhealth.com', role: 'staff' },
    { firstName: 'Vijay',   lastName: 'Kumar',  email: 'staff.vijay@unifiedhealth.com',  role: 'staff' },
  ]
  const adminData = [
    { firstName: 'Admin',   lastName: 'Officer', email: 'admin@unifiedhealth.com', role: 'admin' },
  ]

  const allUsers = [...doctorData, ...staffData, ...adminData]
  const createdDoctors = []

  for (const u of allUsers) {
    let existing = await User.findOne({ email: u.email })
    if (!existing) {
      existing = await User.create({ ...u, password: hash })
      console.log(`Created user: ${u.email}`)
    } else {
      console.log(`User exists: ${u.email}`)
    }
    if (u.role === 'doctor') createdDoctors.push(existing)
  }

  const [dr1, dr2, dr3] = createdDoctors
  const patientId = new mongoose.Types.ObjectId(PATIENT_ID)

  // ── 2. Clear old dummy data for this patient ───────────────────────────────
  await Appointment.deleteMany({ patientId })
  await Immunization.deleteMany({ patientId })
  await MaternalRecord.deleteMany({ govtMaternalId: { $in: ['RCH-2024-001234', 'RCH-2024-005678'] } })
  console.log('Cleared old dummy data')

  // ── 3. Appointments ────────────────────────────────────────────────────────
  const today = new Date()
  const fmt = (d) => d.toISOString().split('T')[0]
  const addDays = (n) => { const d = new Date(today); d.setDate(d.getDate() + n); return fmt(d) }
  const subDays = (n) => { const d = new Date(today); d.setDate(d.getDate() - n); return fmt(d) }

  await Appointment.insertMany([
    {
      patientId, doctorId: dr1._id,
      date: addDays(3), time: '10:00',
      type: 'General Checkup', status: 'Confirmed',
      notes: 'Routine annual checkup',
    },
    {
      patientId, doctorId: dr2._id,
      date: addDays(7), time: '14:30',
      type: 'Vaccination', status: 'Pending',
      notes: 'Hepatitis B Dose 3 scheduled',
    },
    {
      patientId, doctorId: dr3._id,
      date: addDays(12), time: '11:00',
      type: 'Consultation', status: 'Pending',
      notes: 'Follow-up for fever and cold',
    },
    {
      patientId, doctorId: dr1._id,
      date: subDays(10), time: '09:30',
      type: 'General Checkup', status: 'Completed',
      notes: 'Blood pressure and sugar check',
    },
    {
      patientId, doctorId: dr2._id,
      date: subDays(30), time: '15:00',
      type: 'Vaccination', status: 'Completed',
      notes: 'COVID-19 Booster administered',
    },
    {
      patientId, doctorId: dr3._id,
      date: subDays(5), time: '10:00',
      type: 'Follow-up', status: 'Cancelled',
      notes: 'Patient rescheduled',
    },
  ])
  console.log('Appointments seeded')

  // ── 4. Immunizations ───────────────────────────────────────────────────────
  await Immunization.insertMany([
    { patientId, vaccineName: 'BCG',          date: '2000-03-15', status: 'Completed', dose: 'Single Dose',  administeredBy: dr1._id, notes: 'At birth' },
    { patientId, vaccineName: 'OPV',          date: '2000-05-10', status: 'Completed', dose: 'Dose 1',       administeredBy: dr1._id },
    { patientId, vaccineName: 'DPT',          date: '2000-07-20', status: 'Completed', dose: 'Dose 1',       administeredBy: dr2._id },
    { patientId, vaccineName: 'Hepatitis B',  date: '2000-03-15', status: 'Completed', dose: 'Dose 1',       administeredBy: dr1._id, notes: 'Birth dose' },
    { patientId, vaccineName: 'Hepatitis B',  date: '2000-05-10', status: 'Completed', dose: 'Dose 2',       administeredBy: dr2._id },
    { patientId, vaccineName: 'MMR',          date: '2001-04-12', status: 'Completed', dose: 'Single Dose',  administeredBy: dr3._id },
    { patientId, vaccineName: 'Typhoid',      date: '2015-06-01', status: 'Completed', dose: 'Single Dose',  administeredBy: dr1._id },
    { patientId, vaccineName: 'COVID-19',     date: '2021-08-14', status: 'Completed', dose: 'Dose 1',       administeredBy: dr2._id, notes: 'Covishield' },
    { patientId, vaccineName: 'COVID-19',     date: '2021-09-18', status: 'Completed', dose: 'Dose 2',       administeredBy: dr2._id, notes: 'Covishield' },
    { patientId, vaccineName: 'COVID-19',     date: subDays(30),  status: 'Completed', dose: 'Booster',      administeredBy: dr3._id, notes: 'Corbevax booster' },
    { patientId, vaccineName: 'Influenza',    date: subDays(90),  status: 'Completed', dose: 'Annual',       administeredBy: dr1._id },
    { patientId, vaccineName: 'Hepatitis B',  date: addDays(7),   status: 'Upcoming',  dose: 'Dose 3',       notes: 'Scheduled with Dr. Priya' },
    { patientId, vaccineName: 'HPV',          date: addDays(30),  status: 'Upcoming',  dose: 'Dose 1',       notes: 'Recommended by Dr. Ramesh' },
  ])
  console.log('Immunizations seeded')

  // ── 5. Maternal Record ─────────────────────────────────────────────────────
  await MaternalRecord.create({
    govtMaternalId: 'RCH-2024-001234',
    patientId,
    abhaId: 'induja.e@abdm',
    antenatalVisits: [
      {
        date: new Date('2024-01-10'),
        hospitalId: 'GH-KL-001',
        notes: 'First antenatal visit. BP normal. Weight 58kg. Prescribed iron and folic acid.',
        recordedBy: dr2._id,
      },
      {
        date: new Date('2024-02-14'),
        hospitalId: 'GH-KL-001',
        notes: 'Second visit. Ultrasound done. Fetal growth normal. Hemoglobin 11.2 g/dL.',
        recordedBy: dr2._id,
      },
      {
        date: new Date('2024-03-20'),
        hospitalId: 'GH-KL-001',
        notes: 'Third visit. Blood pressure slightly elevated. Advised rest and low-salt diet.',
        recordedBy: dr3._id,
      },
      {
        date: new Date('2024-04-18'),
        hospitalId: 'GH-KL-001',
        notes: 'Fourth visit. All parameters normal. TT vaccination given.',
        recordedBy: dr2._id,
      },
    ],
    deliveryDetails: {
      date: new Date('2024-05-22'),
      hospitalId: 'GH-KL-001',
      notes: 'Normal vaginal delivery. Baby weight 3.1 kg. APGAR score 9. Mother and baby healthy.',
      recordedBy: dr2._id,
    },
  })
  console.log('Maternal record seeded')

  console.log('\n✅ All dummy data seeded successfully!')
  console.log('\n── Login credentials ──────────────────────────')
  console.log('Patient  : indujaee@gmail.com     / (existing password)')
  console.log('Doctor 1 : dr.ramesh@unifiedhealth.com  / password123')
  console.log('Doctor 2 : dr.priya@unifiedhealth.com   / password123')
  console.log('Doctor 3 : dr.suresh@unifiedhealth.com  / password123')
  console.log('Staff    : staff.anitha@unifiedhealth.com / password123')
  console.log('Admin    : admin@unifiedhealth.com       / password123')

  await mongoose.disconnect()
}

seed().catch(err => { console.error(err); process.exit(1) })
