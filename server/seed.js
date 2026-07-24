const mongoose = require('mongoose')
require('dotenv').config()
const Doctor = require('./models/Doctor')

const doctors = [
  // General Medicine
  { name: 'Dr. Ramesh Kumar', specialization: 'General Medicine', qualification: 'MBBS, MD (General Medicine)', experience: '12 years', availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], availableSlots: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30'], consultationFee: 200 },
  { name: 'Dr. Anitha Rao', specialization: 'General Medicine', qualification: 'MBBS, MD (Internal Medicine)', experience: '8 years', availableDays: ['Monday', 'Wednesday', 'Friday', 'Saturday'], availableSlots: ['09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00'], consultationFee: 180 },
  { name: 'Dr. Sunil Verma', specialization: 'General Medicine', qualification: 'MBBS, DNB (General Medicine)', experience: '10 years', availableDays: ['Tuesday', 'Thursday', 'Saturday'], availableSlots: ['10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30'], consultationFee: 200 },

  // Pediatrics
  { name: 'Dr. Priya Nair', specialization: 'Pediatrics', qualification: 'MBBS, DCH, MD (Pediatrics)', experience: '8 years', availableDays: ['Monday', 'Wednesday', 'Friday', 'Saturday'], availableSlots: ['09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00', '15:30'], consultationFee: 250 },
  { name: 'Dr. Karthik Subramanian', specialization: 'Pediatrics', qualification: 'MBBS, MD (Pediatrics)', experience: '6 years', availableDays: ['Monday', 'Tuesday', 'Thursday', 'Friday'], availableSlots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'], consultationFee: 220 },
  { name: 'Dr. Deepa Menon', specialization: 'Pediatrics', qualification: 'MBBS, DCH, DNB (Pediatrics)', experience: '11 years', availableDays: ['Tuesday', 'Wednesday', 'Saturday'], availableSlots: ['09:30', '10:00', '10:30', '11:00', '14:30', '15:00'], consultationFee: 270 },

  // Orthopedics
  { name: 'Dr. Suresh Babu', specialization: 'Orthopedics', qualification: 'MBBS, MS (Orthopaedics)', experience: '15 years', availableDays: ['Tuesday', 'Thursday', 'Saturday'], availableSlots: ['10:00', '10:30', '11:00', '11:30', '15:00', '15:30', '16:00', '16:30'], consultationFee: 400 },
  { name: 'Dr. Rajiv Sharma', specialization: 'Orthopedics', qualification: 'MBBS, MS (Ortho), Fellowship in Joint Replacement', experience: '18 years', availableDays: ['Monday', 'Wednesday', 'Friday'], availableSlots: ['09:00', '09:30', '10:00', '10:30', '14:00', '14:30', '15:00'], consultationFee: 500 },
  { name: 'Dr. Nandini Krishnan', specialization: 'Orthopedics', qualification: 'MBBS, DNB (Orthopaedics)', experience: '7 years', availableDays: ['Monday', 'Thursday', 'Saturday'], availableSlots: ['10:00', '11:00', '14:00', '15:00', '16:00'], consultationFee: 350 },

  // Gynecology & Maternity
  { name: 'Dr. Meena Sharma', specialization: 'Gynecology & Maternity', qualification: 'MBBS, MS (Obstetrics & Gynaecology)', experience: '10 years', availableDays: ['Monday', 'Tuesday', 'Thursday', 'Friday'], availableSlots: ['09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00'], consultationFee: 350 },
  { name: 'Dr. Lakshmi Devi', specialization: 'Gynecology & Maternity', qualification: 'MBBS, DGO, MS (OBG)', experience: '14 years', availableDays: ['Monday', 'Wednesday', 'Friday'], availableSlots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'], consultationFee: 400 },
  { name: 'Dr. Saranya Pillai', specialization: 'Gynecology & Maternity', qualification: 'MBBS, MD (OBG), Fellowship in Maternal-Fetal Medicine', experience: '12 years', availableDays: ['Tuesday', 'Thursday', 'Saturday'], availableSlots: ['09:30', '10:00', '10:30', '11:00', '14:00', '14:30'], consultationFee: 450 },

  // Dermatology
  { name: 'Dr. Arjun Patel', specialization: 'Dermatology', qualification: 'MBBS, DVD, MD (Dermatology)', experience: '6 years', availableDays: ['Wednesday', 'Friday', 'Saturday'], availableSlots: ['10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00'], consultationFee: 300 },
  { name: 'Dr. Pooja Iyer', specialization: 'Dermatology', qualification: 'MBBS, MD (Dermatology, Venereology & Leprosy)', experience: '9 years', availableDays: ['Monday', 'Tuesday', 'Thursday'], availableSlots: ['09:00', '09:30', '10:00', '10:30', '14:00', '14:30', '15:00'], consultationFee: 320 },
  { name: 'Dr. Harish Nambiar', specialization: 'Dermatology', qualification: 'MBBS, DNB (Dermatology)', experience: '5 years', availableDays: ['Tuesday', 'Friday', 'Saturday'], availableSlots: ['10:00', '11:00', '14:00', '15:00', '16:00'], consultationFee: 280 },

  // ENT
  { name: 'Dr. Venkat Rajan', specialization: 'ENT', qualification: 'MBBS, MS (ENT)', experience: '11 years', availableDays: ['Tuesday', 'Thursday', 'Saturday'], availableSlots: ['09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00'], consultationFee: 300 },
  { name: 'Dr. Sindhu Krishnamurthy', specialization: 'ENT', qualification: 'MBBS, MS (Otorhinolaryngology)', experience: '8 years', availableDays: ['Monday', 'Wednesday', 'Friday'], availableSlots: ['09:00', '10:00', '11:00', '14:00', '15:00'], consultationFee: 280 },
  { name: 'Dr. Mohan Das', specialization: 'ENT', qualification: 'MBBS, DNB (ENT), Fellowship in Head & Neck Surgery', experience: '13 years', availableDays: ['Monday', 'Thursday', 'Saturday'], availableSlots: ['10:00', '10:30', '11:00', '14:00', '14:30', '15:00'], consultationFee: 350 },

  // Immunization
  { name: 'Dr. Kavitha Reddy', specialization: 'Immunization', qualification: 'MBBS, DPH, MPH', experience: '9 years', availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], availableSlots: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30'], consultationFee: 150 },
  { name: 'Dr. Ravi Shankar', specialization: 'Immunization', qualification: 'MBBS, MD (Community Medicine)', experience: '7 years', availableDays: ['Monday', 'Wednesday', 'Friday', 'Saturday'], availableSlots: ['09:00', '10:00', '11:00', '14:00', '15:00'], consultationFee: 150 },
  { name: 'Dr. Usha Kumari', specialization: 'Immunization', qualification: 'MBBS, DPH, Diploma in Child Health', experience: '12 years', availableDays: ['Tuesday', 'Thursday', 'Saturday'], availableSlots: ['09:00', '09:30', '10:00', '10:30', '11:00', '14:00'], consultationFee: 150 },

  // Cardiology
  { name: 'Dr. Srinivas Murthy', specialization: 'Cardiology', qualification: 'MBBS, MD, DM (Cardiology)', experience: '18 years', availableDays: ['Monday', 'Wednesday', 'Friday'], availableSlots: ['10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00'], consultationFee: 600 },
  { name: 'Dr. Padma Venkatesh', specialization: 'Cardiology', qualification: 'MBBS, MD (Medicine), DM (Cardiology)', experience: '14 years', availableDays: ['Tuesday', 'Thursday', 'Saturday'], availableSlots: ['09:00', '09:30', '10:00', '10:30', '14:00', '14:30'], consultationFee: 550 },
  { name: 'Dr. Arun Balakrishnan', specialization: 'Cardiology', qualification: 'MBBS, DNB (Cardiology), Fellowship in Interventional Cardiology', experience: '16 years', availableDays: ['Monday', 'Thursday', 'Friday'], availableSlots: ['10:00', '11:00', '14:00', '15:00', '16:00'], consultationFee: 700 },
]

mongoose.connect(process.env.MONGO_URI).then(async () => {
  await Doctor.deleteMany({})
  await Doctor.insertMany(doctors)
  console.log(`✅ Seeded ${doctors.length} doctors successfully!`)
  process.exit(0)
}).catch(err => {
  console.error('❌ Seed error:', err.message)
  process.exit(1)
})
