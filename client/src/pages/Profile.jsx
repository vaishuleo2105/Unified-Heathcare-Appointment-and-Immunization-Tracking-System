import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import DashboardLayout from '../components/layout/DashboardLayout'
import api from '../api'

const ROLE_COLORS = {
  patient: 'bg-primary-fixed text-primary',
  doctor:  'bg-secondary-container text-on-secondary-container',
  staff:   'bg-tertiary-fixed text-on-tertiary-container',
  admin:   'bg-error-container text-on-error-container',
}

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
const GENDERS = ['Female', 'Male', 'Other']
const TEST_RESULTS = ['Normal', 'Abnormal', 'Inconclusive']

export default function ProfilePage() {
  const { t } = useTranslation()
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'))
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const [form, setForm] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    age: user.age || 30,
    gender: user.gender || 'Female',
    bloodType: user.bloodType || 'O+',
    medicalCondition: user.medicalCondition || 'None',
    medication: user.medication || 'None',
    testResults: user.testResults || 'Normal',
  })

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setSuccessMsg('')
    setErrorMsg('')
    try {
      const { data } = await api.put('/auth/profile', {
        firstName: form.firstName,
        lastName: form.lastName,
        age: Number(form.age),
        gender: form.gender,
        bloodType: form.bloodType,
        medicalCondition: form.medicalCondition,
        medication: form.medication,
        testResults: form.testResults,
      })

      setUser(data.user)
      localStorage.setItem('user', JSON.stringify(data.user))
      setSuccessMsg('Medical Profile updated successfully!')
      setIsEditing(false)
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">{t('myProfileTitle')}</h1>
          <p className="text-on-surface-variant mt-1">{t('accountInfo')}</p>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 bg-primary-container text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-lg">edit</span>
            <span>Edit Medical Profile</span>
          </button>
        ) : (
          <button
            onClick={() => setIsEditing(false)}
            className="flex items-center gap-2 bg-surface-container-high text-on-surface-variant px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-surface-container-highest transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
            <span>Cancel</span>
          </button>
        )}
      </div>

      {successMsg && (
        <div className="mb-6 p-4 bg-secondary-container text-on-secondary-container rounded-xl flex items-center gap-3 text-sm font-medium">
          <span className="material-symbols-outlined">check_circle</span>
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-xl flex items-center gap-3 text-sm font-medium">
          <span className="material-symbols-outlined">error</span>
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">

        {/* User Card */}
        <div className="lg:col-span-1 bg-white border border-outline-variant rounded-xl p-6 shadow-sm flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-primary-fixed flex items-center justify-center mb-4 shadow-inner">
            <span className="text-primary font-bold text-3xl">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </span>
          </div>
          <h2 className="text-xl font-bold text-on-surface">{user.firstName} {user.lastName}</h2>
          <p className="text-sm text-on-surface-variant mb-3">{user.email}</p>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${ROLE_COLORS[user.role]}`}>
            {t(user.role)}
          </span>

          <div className="w-full mt-6 pt-6 border-t border-outline-variant text-left space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-on-surface-variant uppercase">User ID</span>
              <span className="font-mono text-on-surface">{user.id?.slice(-8)}</span>
            </div>
            {user.role === 'patient' && (
              <>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-on-surface-variant uppercase">Blood Type</span>
                  <span className="font-bold text-primary px-2 py-0.5 bg-primary-fixed rounded-md">{user.bloodType || 'Not set'}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-on-surface-variant uppercase">Gender / Age</span>
                  <span className="font-semibold text-on-surface">{user.gender || 'Female'}, {user.age || 30} yrs</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Profile Details / Form */}
        <div className="lg:col-span-2 bg-white border border-outline-variant rounded-xl p-6 shadow-sm">
          {!isEditing ? (
            <div>
              <h3 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">medical_information</span>
                <span>Personal & Medical Details</span>
              </h3>

              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { icon: 'person', label: t('firstName'), value: user.firstName },
                  { icon: 'person', label: t('lastName'), value: user.lastName },
                  { icon: 'cake', label: 'Age', value: `${user.age || 30} years` },
                  { icon: 'wc', label: 'Gender', value: user.gender || 'Female' },
                  { icon: 'bloodtype', label: 'Blood Type', value: user.bloodType || 'O+' },
                  { icon: 'health_and_safety', label: 'Test Results', value: user.testResults || 'Normal' },
                  { icon: 'vital_signs', label: 'Medical Condition', value: user.medicalCondition || 'None' },
                  { icon: 'medication', label: 'Current Medication', value: user.medication || 'None' },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3 p-4 bg-surface-container-low rounded-xl border border-outline-variant/40">
                    <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-on-surface-variant text-xl">{icon}</span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{label}</p>
                      <p className="text-sm font-semibold text-on-surface mt-0.5">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-5">
              <h3 className="text-lg font-bold text-on-surface mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">edit_note</span>
                <span>Edit Medical Details</span>
              </h3>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-on-surface-variant">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-on-surface-variant">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-on-surface-variant">Age</label>
                  <input
                    type="number"
                    name="age"
                    min="1"
                    max="120"
                    value={form.age}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-on-surface-variant">Gender</label>
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                  >
                    {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-on-surface-variant">Blood Type</label>
                  <select
                    name="bloodType"
                    value={form.bloodType}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                  >
                    {BLOOD_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-on-surface-variant">Recent Test Results</label>
                  <select
                    name="testResults"
                    value={form.testResults}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                  >
                    {TEST_RESULTS.map(tr => <option key={tr} value={tr}>{tr}</option>)}
                  </select>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-on-surface-variant">Medical Condition</label>
                  <input
                    type="text"
                    name="medicalCondition"
                    placeholder="e.g. Hypertension, Diabetes, Asthma, None"
                    value={form.medicalCondition}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-on-surface-variant">Current Medication</label>
                  <input
                    type="text"
                    name="medication"
                    placeholder="e.g. Paracetamol, Metformin, None"
                    value={form.medication}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-outline-variant text-on-surface-variant rounded-lg text-sm font-semibold hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-primary-container hover:bg-primary text-white rounded-lg text-sm font-semibold shadow-sm disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

