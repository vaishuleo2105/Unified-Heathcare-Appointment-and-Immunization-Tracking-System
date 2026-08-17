require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const User = require('./models/User')

async function resetPasswords() {
  await mongoose.connect(process.env.MONGO_URI)
  console.log('Connected')

  const hash = await bcrypt.hash('password123', 10)

  const emails = [
    'indujaee@gmail.com',
    'dr.ramesh@unifiedhealth.com',
    'dr.priya@unifiedhealth.com',
    'dr.suresh@unifiedhealth.com',
    'staff.anitha@unifiedhealth.com',
    'staff.vijay@unifiedhealth.com',
    'admin@unifiedhealth.com',
  ]

  for (const email of emails) {
    // Use updateOne with $set to bypass the pre-save hook
    const result = await User.collection.updateOne({ email }, { $set: { password: hash } })
    if (result.matchedCount > 0) {
      console.log('Reset:', email)
    } else {
      console.log('Not found:', email)
    }
  }

  // Verify one
  const u = await User.findOne({ email: 'dr.ramesh@unifiedhealth.com' })
  const ok = await bcrypt.compare('password123', u.password)
  console.log('\nVerification check dr.ramesh:', ok ? '✅ password works' : '❌ still wrong')

  await mongoose.disconnect()
  console.log('Done')
}

resetPasswords().catch(err => { console.error(err); process.exit(1) })
