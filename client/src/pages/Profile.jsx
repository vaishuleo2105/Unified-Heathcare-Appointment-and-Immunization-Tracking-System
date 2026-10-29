import { useState, useEffect } from 'react'
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
  const [user, setUser] = useState(() => {
    const cached = JSON.parse(localStorage.getItem('user') || '{}')
    return { ...cached, phone: cached.phone || '9791868857' }
  })
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Telegram Alert Settings
  const [unlinking, setUnlinking] = useState(false)
  const [showTelegramModal, setShowTelegramModal] = useState(false)
  const [telegramSyncing, setTelegramSyncing] = useState(false)
  const [manualChatId, setManualChatId] = useState('')
  const [telegramStatus, setTelegramStatus] = useState(null)

  const [form, setForm] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    phone: user.phone || '9791868857',
    age: user.age || 30,
    gender: user.gender || 'Female',
    bloodType: user.bloodType || 'O+',
    medicalCondition: user.medicalCondition || 'None',
    medication: user.medication || 'None',
    testResults: user.testResults || 'Normal',
  })

  useEffect(() => {
    api.get('/auth/verify')
      .then(({ data }) => {
        if (data?.user) {
          const freshUser = { ...data.user, phone: data.user.phone || '9791868857' }
          setUser(freshUser)
          localStorage.setItem('user', JSON.stringify(freshUser))
          setForm(f => ({
            ...f,
            firstName: freshUser.firstName || f.firstName,
            lastName: freshUser.lastName || f.lastName,
            phone: freshUser.phone || '9791868857',
            age: freshUser.age ?? f.age,
            gender: freshUser.gender || f.gender,
            bloodType: freshUser.bloodType || f.bloodType,
            medicalCondition: freshUser.medicalCondition || f.medicalCondition,
            medication: freshUser.medication || f.medication,
            testResults: freshUser.testResults || f.testResults,
          }))
        }
      })
      .catch(() => {})
  }, [])

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
        phone: form.phone,
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

  async function handleUnlinkTelegram() {
    if (!window.confirm('Are you sure you want to unlink Telegram notifications? You will stop receiving instant Telegram alerts.')) {
      return
    }
    setUnlinking(true)
    setErrorMsg('')
    setSuccessMsg('')
    try {
      const { data } = await api.post('/auth/unlink-telegram')
      if (data.user) {
        setUser(data.user)
        localStorage.setItem('user', JSON.stringify(data.user))
      }
      setSuccessMsg('Telegram notifications unlinked successfully.')
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to unlink Telegram')
    } finally {
      setUnlinking(false)
    }
  }

  async function handleLinkTelegram(chatId = null) {
    setTelegramSyncing(true)
    setErrorMsg('')
    setSuccessMsg('')
    try {
      const params = {}
      const targetId = typeof chatId === 'string' ? chatId : manualChatId.trim()
      if (targetId) params.chatId = targetId
      const { data } = await api.get('/telegram-sync', { params })
      setTelegramStatus(data)
      if (data.success && data.chatId) {
        const linkRes = await api.post('/auth/link-telegram', { chatId: data.chatId })
        if (linkRes.data.user) {
          setUser(linkRes.data.user)
          localStorage.setItem('user', JSON.stringify(linkRes.data.user))
        }
        setSuccessMsg(`✅ ${data.message}`)
        setTimeout(() => setShowTelegramModal(false), 2000)
      } else {
        setErrorMsg(data.message)
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message || 'Telegram sync failed')
    } finally {
      setTelegramSyncing(false)
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

        {/* Left Column: User Card & Telegram Settings */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-sm flex flex-col items-center text-center">
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
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-on-surface-variant uppercase">Phone</span>
                <span className="text-on-surface font-medium">{user.phone || 'Not provided'}</span>
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

          {/* Telegram Bot Alerts Integration Card */}
          <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-2xl">send</span>
              </div>
              <div className="text-left">
                <h3 className="font-bold text-on-surface text-sm">Telegram Alerts Bot</h3>
                <p className="text-xs text-on-surface-variant">@uni_h3alth_bot</p>
              </div>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed mb-4 text-left">
              Receive instant appointment booking and cancellation notices with complete dynamic details directly on your mobile device.
            </p>

            {user.telegramChatId ? (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 text-left">
                  <span className="material-symbols-outlined text-emerald-600 text-base flex-shrink-0">check_circle</span>
                  <div>
                    <p className="font-semibold">Linked to Telegram</p>
                    <p className="text-[11px] text-emerald-700 font-mono">Chat ID: {user.telegramChatId}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleUnlinkTelegram}
                  disabled={unlinking}
                  className="w-full py-2.5 px-4 bg-error-container hover:bg-error/20 text-on-error-container text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-base">link_off</span>
                  {unlinking ? 'Unlinking...' : 'Unlink Telegram'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-surface-container-low border border-outline-variant/60 rounded-xl flex items-center gap-2 text-xs text-on-surface-variant text-left">
                  <span className="material-symbols-outlined text-outline text-base flex-shrink-0">notifications_off</span>
                  <p>Not connected to Telegram alerts</p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowTelegramModal(true)}
                  className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">link</span>
                  Link Telegram Bot
                </button>
              </div>
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
                  { icon: 'call', label: 'Phone (SMS Alerts)', value: user.phone || 'Not provided' },
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
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-on-surface-variant">Phone Number (for instant SMS appointment updates)</label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
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
      {/* Telegram Link Modal */}
      {showTelegramModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-outline-variant animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">send</span>
                </div>
                <div>
                  <h3 className="font-bold text-on-surface text-base">Link Telegram Bot</h3>
                  <p className="text-xs text-on-surface-variant">Real-time alerts for 9791868857</p>
                </div>
              </div>
              <button
                onClick={() => setShowTelegramModal(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
              Connect to <strong>@uni_h3alth_bot</strong> to receive instant, 100% free appointment alerts directly on your phone.
            </p>

            <div className="space-y-3.5 mb-5">
              <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/60">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-5 h-5 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center">1</span>
                  <span className="text-xs font-bold text-on-surface">Open Bot & Tap START</span>
                </div>
                <p className="text-[11px] text-on-surface-variant mb-2 pl-7">
                  Open the bot in Telegram and tap <strong>START</strong> (or send "hello").
                </p>
                <div className="pl-7">
                  <a
                    href="https://t.me/uni_h3alth_bot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
                  >
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                    Open @uni_h3alth_bot in Telegram
                  </a>
                </div>
              </div>

              <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/60">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-5 h-5 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center">2</span>
                  <span className="text-xs font-bold text-on-surface">Auto-Detect & Link</span>
                </div>
                <p className="text-[11px] text-on-surface-variant mb-2.5 pl-7">
                  After pressing START in Telegram, click below to link your account.
                </p>
                <div className="pl-7">
                  <button
                    type="button"
                    onClick={() => handleLinkTelegram()}
                    disabled={telegramSyncing}
                    className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-xs disabled:opacity-50"
                  >
                    {telegramSyncing ? (
                      <>
                        <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span>Detecting Telegram Chat...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm">sync</span>
                        <span>Auto-Detect & Link My Telegram</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/40">
                <label className="text-[11px] font-semibold text-on-surface block mb-1">
                  Or enter your Telegram Chat ID manually:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualChatId}
                    onChange={(e) => setManualChatId(e.target.value)}
                    placeholder="e.g. 123456789"
                    className="flex-1 px-3 py-1.5 text-xs border border-outline-variant rounded-lg bg-white text-on-surface outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => handleLinkTelegram()}
                    disabled={telegramSyncing || !manualChatId.trim()}
                    className="px-3 py-1.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    Link ID
                  </button>
                </div>
              </div>
            </div>

            {telegramStatus && (
              <div className={`p-3 rounded-xl mb-4 text-xs ${telegramStatus.success ? 'bg-secondary-container text-on-secondary-container border border-secondary/30' : 'bg-amber-50 text-amber-900 border border-amber-200'}`}>
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-base flex-shrink-0 mt-0.5">
                    {telegramStatus.success ? 'check_circle' : 'info'}
                  </span>
                  <div>
                    <p className="font-semibold">{telegramStatus.message}</p>
                    {telegramStatus.instruction && (
                      <p className="mt-1 whitespace-pre-line text-[11px] opacity-90">{telegramStatus.instruction}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowTelegramModal(false)}
                className="px-4 py-2 text-xs font-semibold bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

