const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '.env') })
require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const Hospital         = require('./models/Hospital')
const User             = require('./models/User')
const Appointment      = require('./models/Appointment')
const Immunization     = require('./models/Immunization')
const MaternalRecord   = require('./models/MaternalRecord')
const EmergencyTransfer = require('./models/EmergencyTransfer')
const AuditLog         = require('./models/AuditLog')

const PATIENT_ID = '6a59e66bd4154eec174168c8' // indujaee@gmail.com

const tamilNaduHospitals = [
  { name: 'Rajiv Gandhi Government General Hospital', district: 'Chennai', city: 'Chennai', type: 'Government', isActive: true, code: 'TN-CHN-GH01' },
  { name: 'Government Royapettah Hospital', district: 'Chennai', city: 'Chennai', type: 'Government', isActive: true, code: 'TN-CHN-GH02' },
  { name: 'Tamil Nadu Government Multi Super Speciality Hospital TNGMSSH', district: 'Chennai', city: 'Chennai', type: 'Government', isActive: true, code: 'TN-CHN-GH03' },
  { name: 'Coimbatore Medical College Hospital', district: 'Coimbatore', city: 'Coimbatore', type: 'Government', isActive: true, code: 'TN-CBE-GH01' },
  { name: 'Government ESI Medical College & Hospital', district: 'Coimbatore', city: 'Coimbatore', type: 'Government', isActive: true, code: 'TN-CBE-GH02' },
  { name: 'Government Hospital, Mettupalayam', district: 'Coimbatore', city: 'Mettupalayam', type: 'Government', isActive: true, code: 'TN-CBE-GH03' },
  { name: 'Government Hospital, Pollachi', district: 'Coimbatore', city: 'Pollachi', type: 'Government', isActive: true, code: 'TN-CBE-GH04' },
  { name: 'Government Hospital, Valparai', district: 'Coimbatore', city: 'Valparai', type: 'Government', isActive: true, code: 'TN-CBE-GH05' },
  { name: 'Mahatma Gandhi Memorial Government Hospital, Tiruchirappalli', district: 'Tiruchirappalli', city: 'Tiruchirappalli', type: 'Government', isActive: true, code: 'TN-TRY-GH01' },
  { name: 'Goverment Rajaji Hospital', district: 'Madurai', city: 'Madurai', type: 'Government', isActive: true, code: 'TN-MDU-GH01' },
  { name: 'Government Rajaji Hospital / Madurai Medical College Hospital', district: 'Madurai', city: 'Madurai', type: 'Government', isActive: true, code: 'TN-MDU-GH02' },
  { name: 'Mohan Kumaramangalam Medical College Hospital', district: 'Salem', city: 'Salem', type: 'Government', isActive: true, code: 'TN-SLM-GH01' },
  { name: 'Tirunelveli Medical College Hospital', district: 'Tirunelveli', city: 'Tirunelveli', type: 'Government', isActive: true, code: 'TN-TNV-GH01' },
  { name: 'Thanjavur Medical College Hospital', district: 'Thanjavur', city: 'Thanjavur', type: 'Government', isActive: true, code: 'TN-TNJ-GH01' },
  { name: 'Chengalpattu Medical College Hospital', district: 'Chengalpattu', city: 'Chengalpattu', type: 'Government', isActive: true, code: 'TN-CGL-GH01' },
  { name: 'Vellore Medical College Hospital', district: 'Vellore', city: 'Vellore', type: 'Government', isActive: true, code: 'TN-VEL-GH01' },
  { name: 'Thoothukudi Medical College Hospital', district: 'Thoothukudi', city: 'Thoothukudi', type: 'Government', isActive: true, code: 'TN-THO-GH01' },
  { name: 'Theni Medical College Hospital', district: 'Theni', city: 'Theni', type: 'Government', isActive: true, code: 'TN-THE-GH01' },
  { name: 'Dharmapuri Medical College Hospital', district: 'Dharmapuri', city: 'Dharmapuri', type: 'Government', isActive: true, code: 'TN-DHA-GH01' },
  { name: 'Villupuram Medical College Hospital', district: 'Villupuram', city: 'Villupuram', type: 'Government', isActive: true, code: 'TN-VIL-GH01' },
  { name: 'Thiruvarur Medical College Hospital', district: 'Thiruvarur', city: 'Thiruvarur', type: 'Government', isActive: true, code: 'TN-TVR-GH01' },
  { name: 'Sivaganga Medical College Hospital', district: 'Sivaganga', city: 'Sivaganga', type: 'Government', isActive: true, code: 'TN-SIV-GH01' },
  { name: 'Thiruvannamalai Medical College Hospital', district: 'Tiruvannamalai', city: 'Tiruvannamalai', type: 'Government', isActive: true, code: 'TN-TVM-GH01' },
  { name: 'Government Medical College Hospital', district: 'Karur', city: 'Karur', type: 'Government', isActive: true, code: 'TN-KAR-GH01' },
  { name: 'Pudukkottai Medical College Hospital', district: 'Pudukkottai', city: 'Pudukkottai', type: 'Government', isActive: true, code: 'TN-PUD-GH01' },
  { name: 'Government Medical College Hospital', district: 'Nagapattinam', city: 'Nagapattinam', type: 'Government', isActive: true, code: 'TN-NAG-GH01' },
  { name: 'Government Medical College Hospital', district: 'Tiruppur', city: 'Tiruppur', type: 'Government', isActive: true, code: 'TN-TUP-GH01' },
  { name: 'Government Medical College Hospital', district: 'Krishnagiri', city: 'Krishnagiri', type: 'Government', isActive: true, code: 'TN-KRI-GH01' },
  { name: 'Government Medical College Hospital', district: 'Dindigul', city: 'Dindigul', type: 'Government', isActive: true, code: 'TN-DIN-GH01' },
  { name: 'Government Medical College Hospital', district: 'Tiruvallur', city: 'Tiruvallur', type: 'Government', isActive: true, code: 'TN-TVL-GH01' },
  { name: 'Government Medical College Hospital', district: 'Kanniyakumari', city: 'Kanniyakumari', type: 'Government', isActive: true, code: 'TN-KAN-GH01' },
  { name: 'SIMS Hospitals - Multi Speciality Hospital in chennai', district: 'Chennai', city: 'Chennai', type: 'Private', isActive: true, code: 'TN-CHN-PVT01' },
  { name: 'VS Hospitals', district: 'Chennai', city: 'Chennai', type: 'Private', isActive: true, code: 'TN-CHN-PVT02' },
  { name: 'Be Well Hospitals Anna Nagar', district: 'Chennai', city: 'Chennai', type: 'Private', isActive: true, code: 'TN-CHN-PVT03' },
  { name: 'Annai Arul Hospital', district: 'Chennai', city: 'Chennai', type: 'Private', isActive: true, code: 'TN-CHN-PVT04' },
  { name: 'Chettinad Hospital And Research Institute', district: 'Kelambakkam', city: 'Kelambakkam', type: 'Private', isActive: true, code: 'TN-KEL-PVT01' },
  { name: 'Apollo Speciality Hospitals', district: 'Tiruchirappalli', city: 'Tiruchirappalli', type: 'Private', isActive: true, code: 'TN-TRY-PVT01' },
  { name: 'Sundaram Hospital', district: 'Tiruchirappalli', city: 'Tiruchirappalli', type: 'Private', isActive: true, code: 'TN-TRY-PVT02' },
  { name: 'Apollo Speciality Hospitals', district: 'Madurai', city: 'Madurai', type: 'Private', isActive: true, code: 'TN-MDU-PVT01' },
  { name: 'Apollo Reach Hospitals', district: 'Karaikudi', city: 'Karaikudi', type: 'Private', isActive: true, code: 'TN-KAR-PVT01' },
  { name: 'Nalam Hospital', district: 'Tiruchirappalli', city: 'Tiruchirappalli', type: 'Private', isActive: true, code: 'TN-TRY-PVT03' },
  { name: 'AC HOSPITAL', district: 'Salem', city: 'Salem', type: 'Private', isActive: true, code: 'TN-SLM-PVT01' },
  { name: 'MuthuMeenakshi Hospitals Pvt Ltd', district: 'Pudukkottai', city: 'Pudukkottai', type: 'Private', isActive: true, code: 'TN-PUD-PVT01' },
]

async function seed() {
  await mongoose.connect(process.env.MONGO_URI)
  console.log('Connected to MongoDB')

  // ── 1. Seed Tamil Nadu Hospitals ──────────────────────────────────────────
  const createdHospitals = []
  for (const h of tamilNaduHospitals) {
    let existing = await Hospital.findOne({ code: h.code })
    if (!existing) {
      existing = await Hospital.create(h)
      console.log(`Created hospital: ${h.name} (${h.district})`)
    } else {
      existing.name = h.name
      existing.type = h.type
      existing.district = h.district
      existing.city = h.city
      existing.address = h.address || ''
      existing.contactNumber = h.contactNumber || ''
      existing.departments = h.departments || []
      existing.isActive = true
      await existing.save()
    }
    createdHospitals.push(existing)
  }

  const cmch = createdHospitals.find(h => h.code === 'TN-CBE-GH01')
  const rgggh = createdHospitals.find(h => h.code === 'TN-CHN-GH01')
  const grhMadurai = createdHospitals.find(h => h.code === 'TN-MDU-GH01')
  const peelameduUphc = createdHospitals.find(h => h.code === 'TN-CBE-GH04') // Using Pollachi GH as a substitute for Peelamedu UPHC for dummy users


  // ── 2. Create doctors, staff, admin with hospital associations ─────────────
  const hash = await bcrypt.hash('password123', 10)

  const doctorData = [
    { firstName: 'Ramesh',  lastName: 'Kumar',  email: 'dr.ramesh@unifiedhealth.com',  role: 'doctor', hospitalId: cmch._id, department: 'General Medicine' },
    { firstName: 'Priya',   lastName: 'Nair',   email: 'dr.priya@unifiedhealth.com',   role: 'doctor', hospitalId: peelameduUphc._id, department: 'Maternal & Child Health' },
    { firstName: 'Suresh',  lastName: 'Menon',  email: 'dr.suresh@unifiedhealth.com',  role: 'doctor', hospitalId: rgggh._id, department: 'Cardiology' },
    { firstName: 'Karthik', lastName: 'Sundaram', email: 'dr.karthik@unifiedhealth.com', role: 'doctor', hospitalId: grhMadurai._id, department: 'Emergency & Trauma' },
  ]
  const staffData = [
    { firstName: 'Anitha',  lastName: 'Raj',    email: 'staff.anitha@unifiedhealth.com', role: 'staff', hospitalId: peelameduUphc._id, department: 'Registration & Triage' },
    { firstName: 'Vijay',   lastName: 'Kumar',  email: 'staff.vijay@unifiedhealth.com',  role: 'staff', hospitalId: cmch._id, department: 'Records & Referral' },
  ]
  const adminData = [
    { firstName: 'Admin',   lastName: 'Officer', email: 'admin@unifiedhealth.com', role: 'admin', hospitalId: cmch._id, department: 'Administration' },
  ]

  const allStaffUsers = [...doctorData, ...staffData, ...adminData]
  const createdDoctors = []

  for (const u of allStaffUsers) {
    let existing = await User.findOne({ email: u.email })
    if (!existing) {
      existing = await User.create({ ...u, password: hash })
      console.log(`Created user: ${u.email} at ${u.department}`)
    } else {
      existing.hospitalId = u.hospitalId
      existing.department = u.department
      await existing.save()
    }
    if (u.role === 'doctor') createdDoctors.push(existing)
  }

  // ── 3. Patient user with full medical profile and hospital association ────
  let patientUser = await User.findOne({ email: 'indujaee@gmail.com' })
  if (!patientUser) {
    patientUser = await User.create({
      _id: PATIENT_ID,
      firstName: 'Induja',
      lastName: 'E',
      email: 'indujaee@gmail.com',
      password: hash,
      role: 'patient',
      age: 28,
      gender: 'Female',
      bloodType: 'O+',
      medicalCondition: 'Hypertension, Seasonal Allergies',
      medication: 'Telmisartan 40mg, Folic Acid',
      testResults: 'Normal',
      abhaId: 'induja.e@abdm',
      abhaNumber: '91-8273-9021-4432',
      hospitalId: peelameduUphc._id,
    })
    console.log('Created main patient user: indujaee@gmail.com')
  } else {
    patientUser.age = patientUser.age || 28
    patientUser.gender = patientUser.gender || 'Female'
    patientUser.bloodType = patientUser.bloodType || 'O+'
    patientUser.medicalCondition = 'Hypertension, Seasonal Allergies'
    patientUser.medication = 'Telmisartan 40mg, Folic Acid'
    patientUser.testResults = 'Normal'
    patientUser.hospitalId = peelameduUphc._id
    patientUser.abhaId = patientUser.abhaId || 'induja.e@abdm'
    patientUser.abhaNumber = patientUser.abhaNumber || '91-8273-9021-4432'
    await patientUser.save()
    console.log('Updated patient user profile: indujaee@gmail.com')
  }

  // Also assign hospitals to any other existing patients in database
  const allOtherPatients = await User.find({ role: 'patient' })
  for (const p of allOtherPatients) {
    if (!p.hospitalId) {
      p.hospitalId = peelameduUphc._id
      await p.save()
    }
  }

  const allPatients = await User.find({ role: 'patient' })
  const [dr1, dr2, dr3, dr4] = createdDoctors
  const defaultPatientId = new mongoose.Types.ObjectId(PATIENT_ID)

  // ── 4. Clear old dummy data for all patients ───────────────────────────────
  await Appointment.deleteMany({})
  await Immunization.deleteMany({})
  await MaternalRecord.deleteMany({})
  await EmergencyTransfer.deleteMany({})
  await AuditLog.deleteMany({})
  console.log('Cleared old dummy data')

  const today = new Date()
  const fmt = (d) => d.toISOString().split('T')[0]
  const addDays = (n) => { const d = new Date(today); d.setDate(d.getDate() + n); return fmt(d) }
  const subDays = (n) => { const d = new Date(today); d.setDate(d.getDate() - n); return fmt(d) }

  // ── 5. Generate Data for All Patients ────────────────────────────────────────
  // ── 5. Generate Data for All Patients ────────────────────────────────────────
  let offset = 0;
  for (const p of allPatients) {
    const patientId = p._id
    offset++;

    const myAddDays = (n) => addDays(n + offset)
    const mySubDays = (n) => subDays(n + offset)

    const t1 = `${9 + (offset % 8)}:00`
    const t2 = `${10 + (offset % 6)}:30`
    const t3 = `${14 + (offset % 4)}:15`

    await Appointment.insertMany([
      {
        patientId, doctorId: dr1._id,
        date: myAddDays(3), time: t1,
        type: 'General Checkup', status: 'Confirmed',
        notes: 'Routine annual checkup',
      },
      {
        patientId, doctorId: dr2._id,
        date: myAddDays(7), time: t2,
        type: 'Vaccination', status: 'Pending',
        notes: 'Hepatitis B Dose 3 scheduled',
      },
      {
        patientId, doctorId: dr3._id,
        date: myAddDays(12), time: t3,
        type: 'Consultation', status: 'Pending',
        notes: 'Cardiology follow-up',
      },
      {
        patientId, doctorId: dr1._id,
        date: mySubDays(10), time: t1,
        type: 'General Checkup', status: 'Completed',
        notes: 'Blood pressure and sugar check',
        consultationOutcome: 'BP: 118/76 mmHg. Routine parameters stable.',
        consultationNotes: 'Continue Telmisartan 40mg daily.',
      },
      {
        patientId, doctorId: dr2._id,
        date: mySubDays(30), time: t2,
        type: 'Vaccination', status: 'Completed',
        notes: 'COVID-19 Booster administered',
      },
      {
        patientId, doctorId: dr1._id,
        date: mySubDays(5), time: t3,
        type: 'Follow-up', status: 'Cancelled',
        notes: 'Patient rescheduled due to travel',
      },
    ])

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
      { patientId, vaccineName: 'Hepatitis B',  date: addDays(7),   status: 'Upcoming',  dose: 'Dose 3',       notes: 'Scheduled for 3rd dose completion' },
      { patientId, vaccineName: 'HPV',          date: addDays(30),  status: 'Upcoming',  dose: 'Dose 1',       notes: 'Recommended primary 2-dose HPV series' },
    ])

    if (p.gender === 'Female') {
      await MaternalRecord.create({
        govtMaternalId: `RCH-2024-${Math.floor(1000 + Math.random() * 9000)}`,
        patientId,
        abhaId: p.abhaId || 'induja.e@abdm',
        antenatalVisits: [
          {
            date: new Date('2024-01-10'),
            hospitalId: 'TN-CBE-UPHC02',
            notes: 'First antenatal visit. BP normal. Weight 58kg. Prescribed iron and folic acid.',
            recordedBy: dr2._id,
          },
          {
            date: new Date('2024-02-14'),
            hospitalId: 'TN-CBE-UPHC02',
            notes: 'Second visit. Ultrasound done. Fetal growth normal. Hemoglobin 11.2 g/dL.',
            recordedBy: dr2._id,
          },
          {
            date: new Date('2024-03-20'),
            hospitalId: 'TN-CBE-GH01',
            notes: 'Third visit. Blood pressure slightly elevated. Advised rest and low-salt diet.',
            recordedBy: dr1._id,
          },
          {
            date: new Date('2024-04-18'),
            hospitalId: 'TN-CBE-UPHC02',
            notes: 'Fourth visit. All parameters normal. TT vaccination given.',
            recordedBy: dr2._id,
          },
        ],
        deliveryDetails: {
          date: new Date('2024-05-22'),
          hospitalId: 'TN-CBE-GH01',
          notes: 'Normal vaginal delivery at CMCH. Baby weight 3.1 kg. APGAR score 9. Mother and baby healthy.',
          recordedBy: dr1._id,
        },
      })
    }
  }
  console.log('Appointments, Immunizations, and Maternal records seeded for all patients')

  const patientId = defaultPatientId

  // ── 8. Seed Emergency Data Transfers & Audit Logs ─────────────────────────
  const transfer1 = await EmergencyTransfer.create({
    transferId: 'EMT-2026-4821',
    patientId,
    sourceHospitalId: peelameduUphc._id,
    destinationHospitalId: cmch._id,
    initiatedBy: dr2._id,
    receivingDoctorId: dr1._id,
    destinationDepartment: 'Emergency & Cardiology Unit',
    reason: 'Emergency Treatment',
    reasonDetails: 'Acute episode of elevated BP and palpitations requiring emergency cardiac evaluation.',
    priority: 'Critical',
    sharedCategories: [
      'basic_info',
      'blood_group_vitals',
      'allergies_warnings',
      'medical_history_conditions',
      'medications_prescriptions',
      'recent_consultations',
      'emergency_contacts',
    ],
    status: 'Accepted',
    responseNotes: 'Transferred record reviewed. Patient admitted to Emergency Observation Ward 3.',
    respondedBy: dr1._id,
    respondedAt: new Date(Date.now() - 3600 * 1000 * 4),
    patientDataSnapshot: {
      basicInfo: {
        firstName: 'Induja',
        lastName: 'E',
        age: 28,
        gender: 'Female',
        email: 'indujaee@gmail.com',
        abhaId: 'induja.e@abdm',
        abhaNumber: '91-8273-9021-4432',
      },
      bloodGroupAndVitals: {
        bloodType: 'O+',
        testResults: 'Normal',
      },
      allergiesAndWarnings: {
        notes: 'Mild seasonal rhinitis; no known drug allergies (NKDA).',
      },
      medicalConditions: {
        primaryCondition: 'Hypertension, Seasonal Allergies',
      },
      medications: {
        currentMedications: 'Telmisartan 40mg, Folic Acid',
      },
      consultations: [
        {
          date: subDays(10),
          time: '09:30',
          type: 'General Checkup',
          status: 'Completed',
          notes: 'Blood pressure and sugar check',
          consultationOutcome: 'BP: 118/76 mmHg. Routine parameters stable.',
          consultationNotes: 'Continue Telmisartan 40mg daily.',
          doctorName: 'Dr. Ramesh Kumar',
        },
      ],
      emergencyContacts: {
        primaryEmail: 'indujaee@gmail.com',
        helpline: '108 (Tamil Nadu Emergency Medical Services)',
      },
    },
    statusHistory: [
      {
        status: 'Pending',
        updatedBy: dr2._id,
        timestamp: new Date(Date.now() - 3600 * 1000 * 6),
        notes: 'Emergency transfer initiated by Dr. Priya Nair from Peelamedu UPHC.',
      },
      {
        status: 'Accepted',
        updatedBy: dr1._id,
        timestamp: new Date(Date.now() - 3600 * 1000 * 4),
        notes: 'Accepted by Dr. Ramesh Kumar at Coimbatore Medical College Hospital.',
      },
    ],
  })

  await AuditLog.create([
    {
      transferId: transfer1._id,
      patientId,
      sourceHospitalId: peelameduUphc._id,
      destinationHospitalId: cmch._id,
      performedBy: dr2._id,
      action: 'TRANSFER_INITIATED',
      details: 'Emergency transfer initiated for acute hypertension evaluation.',
      timestamp: new Date(Date.now() - 3600 * 1000 * 6),
    },
    {
      transferId: transfer1._id,
      patientId,
      sourceHospitalId: peelameduUphc._id,
      destinationHospitalId: cmch._id,
      performedBy: dr1._id,
      action: 'RECORD_VIEWED',
      details: 'Shared medical history snapshot reviewed by Dr. Ramesh Kumar.',
      timestamp: new Date(Date.now() - 3600 * 1000 * 5),
    },
    {
      transferId: transfer1._id,
      patientId,
      sourceHospitalId: peelameduUphc._id,
      destinationHospitalId: cmch._id,
      performedBy: dr1._id,
      action: 'TRANSFER_ACCEPTED',
      details: 'Transfer accepted. Patient bed assigned in Emergency Observation.',
      timestamp: new Date(Date.now() - 3600 * 1000 * 4),
    },
  ])

  console.log('Emergency transfer and audit logs seeded')

  console.log('\n✅ All dummy data & Tamil Nadu hospitals seeded successfully!')
  console.log('\n── Login credentials ──────────────────────────')
  console.log('Patient  : indujaee@gmail.com     / (password123 or existing)')
  console.log('Doctor 1 : dr.ramesh@unifiedhealth.com  / password123 (CMCH Coimbatore)')
  console.log('Doctor 2 : dr.priya@unifiedhealth.com   / password123 (Peelamedu UPHC)')
  console.log('Doctor 3 : dr.suresh@unifiedhealth.com  / password123 (RGGGH Chennai)')
  console.log('Staff 1  : staff.anitha@unifiedhealth.com / password123 (Peelamedu UPHC)')
  console.log('Admin    : admin@unifiedhealth.com       / password123 (CMCH Coimbatore)')

  await mongoose.disconnect()
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
