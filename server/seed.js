const mongoose = require('mongoose')
const dotenv = require('dotenv')
dotenv.config()

const MaternalRecord = require('./models/MaternalRecord')

const dummyUserId = new mongoose.Types.ObjectId()

const dummyRecords = [
  {
    govtMaternalId: 'RCH-2024-001234',
    patientId: dummyUserId,
    antenatalVisits: [
      { hospitalId: 'HOSP-001', date: new Date('2024-02-10'), notes: 'BP normal, weight 58kg, no complications.' },
      { hospitalId: 'HOSP-001', date: new Date('2024-04-15'), notes: 'Ultrasound done, fetal growth normal.' },
      { hospitalId: 'HOSP-002', date: new Date('2024-06-20'), notes: 'Iron deficiency noted, supplements prescribed.' },
    ],
    deliveryDetails: {
      hospitalId: 'HOSP-002',
      date: new Date('2024-09-05'),
      notes: 'Normal vaginal delivery. Baby girl, 3.1kg. Both mother and child healthy.',
    },
  },
  {
    govtMaternalId: 'RCH-2024-005678',
    patientId: new mongoose.Types.ObjectId(),
    antenatalVisits: [
      { hospitalId: 'HOSP-003', date: new Date('2025-01-08'), notes: 'First visit. LMP confirmed. Vitamins prescribed.' },
      { hospitalId: 'HOSP-003', date: new Date('2025-03-12'), notes: 'Anomaly scan normal. Blood pressure slightly elevated.' },
    ],
    deliveryDetails: null,
  },
  {
    govtMaternalId: 'RCH-2025-009999',
    patientId: new mongoose.Types.ObjectId(),
    antenatalVisits: [
      { hospitalId: 'HOSP-001', date: new Date('2025-11-01'), notes: 'Initial registration. All vitals normal.' },
    ],
    deliveryDetails: null,
  },
]

async function seed() {
  await mongoose.connect(process.env.MONGO_URI)
  console.log('MongoDB connected')

  await MaternalRecord.deleteMany({ govtMaternalId: { $in: dummyRecords.map(r => r.govtMaternalId) } })
  await MaternalRecord.insertMany(dummyRecords)

  console.log('✅ Dummy maternal records inserted:')
  dummyRecords.forEach(r => console.log(' -', r.govtMaternalId))

  await mongoose.disconnect()
}

seed().catch(err => { console.error(err); process.exit(1) })
