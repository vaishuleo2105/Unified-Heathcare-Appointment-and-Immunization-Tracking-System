import { useState } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'
import api from '../api'

const STEPS = ['Enter Aadhaar', 'Verify OTP', 'Create Health ID', 'Done']

export default function AbhaPage() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const [step, setStep] = useState(0)
  const [aadhaar, setAadhaar] = useState('')
  const [email, setEmail] = useState(user.email || '')
  const [otp, setOtp] = useState('')
  const [txnId, setTxnId] = useState('')
  const [healthId, setHealthId] = useState('')
  const [abhaResult, setAbhaResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [mockOtp, setMockOtp] = useState('')
  const [otpSentTo, setOtpSentTo] = useState('')

  const [govtMaternalId, setGovtMaternalId] = useState('')
  const [linkLoading, setLinkLoading] = useState(false)
  const [linkMsg, setLinkMsg] = useState('')

  function reset() {
    setStep(0); setAadhaar(''); setOtp(''); setTxnId('')
    setHealthId(''); setAbhaResult(null); setError(''); setSuccess('')
    setMockOtp(''); setOtpSentTo('')
  }

  async function handleGenerateOtp(e) {
    e.preventDefault()
    setError('')
    const clean = aadhaar.replace(/\s/g, '')
    if (!/^\d{12}$/.test(clean)) return setError('Enter a valid 12-digit Aadhaar number')
    if (!email.trim()) return setError('Enter your email address to receive the OTP')
    setLoading(true)
    try {
      const { data } = await api.post('/maternal/abha/generate-otp', { aadhaar: clean, email: email.trim() })
      setTxnId(data.txnId)
      setOtpSentTo(email.trim())
      if (data.mock) {
        const match = data.message.match(/OTP is: (\d{6})/)
        if (match) setMockOtp(match[1])
        setSuccess(`OTP generated. Check the box below.`)
      } else {
        setSuccess(`OTP sent to ${email.trim()}. Check your inbox.`)
      }
      setStep(1)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault()
    setError('')
    if (!otp.trim()) return setError('Enter the OTP')
    setLoading(true)
    try {
      const { data } = await api.post('/maternal/abha/verify-otp', { txnId, otp })
      setTxnId(data.txnId)
      setSuccess('OTP verified! You can now create your Health ID.')
      setStep(2)
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateAbha(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/maternal/abha/create-health-id', {
        txnId,
        ...(healthId.trim() && { healthId: healthId.trim() }),
      })
      setAbhaResult(data)
      setSuccess(data.message)
      setStep(3)
    } catch (err) {
      setError(err.response?.data?.message || 'Health ID creation failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleLink(e) {
    e.preventDefault()
    setLinkMsg('')
    if (!govtMaternalId.trim()) return setLinkMsg('Enter a Maternal ID')
    setLinkLoading(true)
    try {
      await api.post('/maternal/abha/link', {
        govtMaternalId: govtMaternalId.trim(),
        abhaId: abhaResult.abhaId,
      })
      setLinkMsg(`✓ Health ID linked to maternal record ${govtMaternalId.toUpperCase()}`)
    } catch (err) {
      setLinkMsg(err.response?.data?.message || 'Linking failed')
    } finally {
      setLinkLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-on-surface">ABHA Health ID</h1>
        <p className="text-on-surface-variant mt-1">
          Create your digital health identity using Aadhaar verification
        </p>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 bg-primary-fixed border border-outline-variant rounded-xl p-4 mb-6">
        <span className="material-symbols-outlined text-primary text-2xl mt-0.5">verified_user</span>
        <div>
          <p className="text-sm font-semibold text-on-surface">Secure Aadhaar-based Verification</p>
          <p className="text-xs text-on-surface-variant mt-1">
            Enter your 12-digit Aadhaar number and email address. An OTP will be sent to verify your identity before creating your Health ID.
          </p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-shrink-0">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              i < step ? 'bg-secondary text-white' : i === step ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface-variant'
            }`}>
              {i < step ? <span className="material-symbols-outlined text-sm">check</span> : i + 1}
            </div>
            <span className={`text-xs font-semibold whitespace-nowrap ${i === step ? 'text-primary' : 'text-on-surface-variant'}`}>{s}</span>
            {i < STEPS.length - 1 && <div className="w-8 h-px bg-outline-variant" />}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 bg-error-container text-on-error-container px-4 py-3 rounded-lg text-sm">
          <span className="material-symbols-outlined text-base">error</span>{error}
        </div>
      )}
      {success && step < 3 && (
        <div className="mb-4 flex items-center gap-2 bg-secondary-container text-on-secondary-container px-4 py-3 rounded-lg text-sm">
          <span className="material-symbols-outlined text-base">check_circle</span>{success}
        </div>
      )}

      <div className="max-w-md">

        {/* Step 0: Aadhaar + Email */}
        {step === 0 && (
          <form onSubmit={handleGenerateOtp} className="bg-white border border-outline-variant rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-on-surface">Enter Aadhaar & Email</h2>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant">Aadhaar Number *</label>
              <input
                value={aadhaar}
                onChange={e => setAadhaar(e.target.value.replace(/\D/g, '').slice(0, 12))}
                placeholder="XXXX XXXX XXXX"
                maxLength={12}
                className="w-full mt-1 px-4 py-3 border border-outline-variant rounded-xl text-sm tracking-widest focus:ring-2 focus:ring-primary outline-none"
              />
              <p className="text-xs text-on-surface-variant mt-1">{aadhaar.length}/12 digits</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant">Email Address *</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full mt-1 px-4 py-3 border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none"
              />
              <p className="text-xs text-on-surface-variant mt-1">OTP will be sent to this email</p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Sending OTP...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">send</span>
                  Send OTP
                </>
              )}
            </button>
          </form>
        )}

        {/* Step 1: OTP */}
        {step === 1 && (
          <form onSubmit={handleVerifyOtp} className="bg-white border border-outline-variant rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-on-surface">Verify OTP</h2>
            <p className="text-xs text-on-surface-variant">
              Enter the OTP sent to <span className="font-semibold text-primary">{otpSentTo}</span>
            </p>

            {mockOtp && (
              <div className="flex items-center gap-3 bg-primary-fixed border border-outline-variant rounded-xl p-4">
                <span className="material-symbols-outlined text-primary text-2xl">mark_email_read</span>
                <div>
                  <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Your OTP</p>
                  <p className="text-2xl font-bold tracking-widest text-primary">{mockOtp}</p>
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-on-surface-variant">OTP *</label>
              <input
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6-digit OTP"
                maxLength={6}
                className="w-full mt-1 px-4 py-3 border border-outline-variant rounded-xl text-sm tracking-widest focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Verifying...
                  </>
                ) : 'Verify OTP'}
              </button>
              <button type="button" onClick={reset} className="px-4 py-3 border border-outline-variant text-on-surface-variant text-sm font-semibold rounded-xl hover:bg-surface-container transition-colors">
                Back
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Create Health ID */}
        {step === 2 && (
          <form onSubmit={handleCreateAbha} className="bg-white border border-outline-variant rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-on-surface">Create Health ID</h2>
            <p className="text-xs text-on-surface-variant">
              Optionally choose a custom address (e.g. yourname@abdm). Leave blank for auto-generated.
            </p>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant">Preferred Health Address (optional)</label>
              <div className="flex items-center mt-1 border border-outline-variant rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary">
                <input
                  value={healthId}
                  onChange={e => setHealthId(e.target.value.toLowerCase().replace(/[^a-z0-9.]/g, ''))}
                  placeholder="yourname"
                  className="flex-1 px-4 py-3 text-sm outline-none bg-white"
                />
                <span className="px-3 py-3 bg-surface-container text-xs text-on-surface-variant font-medium">@abdm</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Creating...
                  </>
                ) : 'Create Health ID'}
              </button>
              <button type="button" onClick={reset} className="px-4 py-3 border border-outline-variant text-on-surface-variant text-sm font-semibold rounded-xl hover:bg-surface-container transition-colors">
                Back
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Done */}
        {step === 3 && abhaResult && (
          <div className="space-y-4">
            <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl bg-secondary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-secondary text-2xl">verified</span>
                </div>
                <div>
                  <p className="text-base font-bold text-on-surface">Health ID Created!</p>
                  <p className="text-xs text-on-surface-variant">Your digital health account is ready</p>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Health ID Address', value: abhaResult.abhaId, icon: 'badge' },
                  { label: 'Health ID Number', value: abhaResult.abhaNumber, icon: 'pin' },
                  { label: 'Name', value: abhaResult.name, icon: 'person' },
                  { label: 'Year of Birth', value: abhaResult.yearOfBirth, icon: 'cake' },
                ].filter(f => f.value).map(({ label, value, icon }) => (
                  <div key={label} className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl">
                    <span className="material-symbols-outlined text-on-surface-variant text-xl">{icon}</span>
                    <div>
                      <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{label}</p>
                      <p className="text-sm font-semibold text-on-surface">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-on-surface mb-1">Link to Maternal Record</h3>
              <p className="text-xs text-on-surface-variant mb-4">Optionally link this Health ID to a government maternal record (RCH/MCTS ID).</p>
              <form onSubmit={handleLink} className="flex gap-3">
                <input
                  value={govtMaternalId}
                  onChange={e => setGovtMaternalId(e.target.value)}
                  placeholder="e.g. RCH-2024-001234"
                  className="flex-1 px-3 py-2.5 border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none"
                />
                <button
                  type="submit"
                  disabled={linkLoading}
                  className="px-5 py-2.5 bg-secondary text-white text-sm font-semibold rounded-xl hover:bg-secondary/90 transition-colors disabled:opacity-60"
                >
                  {linkLoading ? 'Linking...' : 'Link'}
                </button>
              </form>
              {linkMsg && (
                <p className={`text-xs mt-2 font-medium ${linkMsg.startsWith('✓') ? 'text-secondary' : 'text-error'}`}>
                  {linkMsg}
                </p>
              )}
            </div>

            <button onClick={reset} className="w-full py-3 border border-outline-variant text-on-surface-variant text-sm font-semibold rounded-xl hover:bg-surface-container transition-colors">
              Create Another Health ID
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
