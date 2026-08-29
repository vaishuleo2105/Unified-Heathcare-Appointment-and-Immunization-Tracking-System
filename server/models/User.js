const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName:  { type: String, required: true, trim: true },
    email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:  { type: String, required: true },
    role:      { type: String, enum: ['patient', 'doctor', 'staff', 'admin'], default: 'patient' },
    resetOtp:         { type: String },
    resetOtpExpiry:   { type: Date },
    age:              { type: Number },
    gender:           { type: String, enum: ['Male', 'Female', 'Other'] },
    bloodType:        { type: String },
    medicalCondition: { type: String },
    medication:       { type: String },
    testResults:      { type: String, enum: ['Normal', 'Abnormal', 'Inconclusive'] },
  },
  { timestamps: true }
)

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
})

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

module.exports = mongoose.model('User', userSchema)
