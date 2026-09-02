import { useState, useEffect } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'
import api from '../api'

const STEPS = ['Verify Aadhaar', 'Enter OTP', 'Link ABHA', 'Connected']

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
  const [confirmDisconnect, setConfirmDisconnect] = useState(false)

  useEffect(() => {
    fetchMyAbha()
  }, [])

  async function fetchMyAbha() {
    try {
      const { data } = await api.get('/maternal/abha/my-abha')
      if (data.hasAbha) {
        setAbhaResult(data)
        setStep(3)
      }
    } catch {
      // No connected ABHA yet
    }
    try {
      const { data: matRecord } = await api.get('/maternal/my-record')
      if (matRecord && matRecord.govtMaternalId) {
        setGovtMaternalId(matRecord.govtMaternalId)
      }
    } catch {}
  }

  function reset() {
    setStep(0); setAadhaar(''); setOtp(''); setTxnId('')
    setHealthId(''); setAbhaResult(null); setError(''); setSuccess('')
    setMockOtp(''); setOtpSentTo('')
    setConfirmDisconnect(false)
  }

  async function handleDisconnect() {
    try {
      await api.post('/maternal/abha/disconnect')
      reset()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to disconnect ABHA ID')
    }
  }

  async function handleGenerateOtp(e) {
    e.preventDefault()
    setError('')
    const clean = aadhaar.replace(/\s/g, '')
    if (!/^\d{12}$/.test(clean)) return setError('Enter a valid 12-digit Aadhaar number')
    if (!email.trim()) return setError('Enter your registered email address')
    setLoading(true)
    try {
      const { data } = await api.post('/maternal/abha/generate-otp', { aadhaar: clean, email: email.trim() })
      setTxnId(data.txnId)
      setOtpSentTo(email.trim())
      if (data.mock) {
        const match = data.message.match(/OTP is: (\d{6})/)
        if (match) setMockOtp(match[1])
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
      setStep(2)
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleLinkAbha(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/maternal/abha/create-health-id', {
        txnId,
        ...(healthId.trim() && { healthId: healthId.trim() }),
      })
      setAbhaResult(data)
      setStep(3)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to link ABHA ID')
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
      setLinkMsg(`✓ ABHA ID linked to maternal record ${govtMaternalId.toUpperCase()}`)
    } catch (err) {
      setLinkMsg(err.response?.data?.message || 'Linking failed')
    } finally {
      setLinkLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <img
            src="https://abdm.gov.in/assets/img/ABHA_opt2.png"
            alt="ABHA"
            className="h-8 object-contain"
            onError={e => { e.target.style.display = 'none' }}
          />
          <h1 className="text-2xl font-bold text-on-surface">Connect ABHA ID</h1>
        </div>
        <p className="text-on-surface-variant mt-1">
          Link your existing government Ayushman Bharat Health Account (ABHA) to this system
        </p>
      </div>

      {/* Gov Banner */}
      <div className="flex items-start gap-4 bg-[#f0f7ff] border border-[#1a56a0]/20 rounded-xl p-4 mb-6">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#1a56a0] flex items-center justify-center">
          <span className="material-symbols-outlined text-white text-xl">account_balance</span>
        </div>
        <div>
          <p className="text-sm font-bold text-[#1a56a0]">Government of India — Ayushman Bharat Digital Mission</p>
          <p className="text-xs text-on-surface-variant mt-1">
            ABHA (Ayushman Bharat Health Account) is your unique 14-digit health ID issued by NHA. 
            Verify your Aadhaar to fetch and connect your existing ABHA record to this hospital system.
          </p>
          <a
            href="https://abdm.gov.in"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-[#1a56a0] font-semibold underline mt-1 inline-block"
          >
            Learn more at abdm.gov.in ↗
          </a>
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

      <div className="max-w-md">

        {/* Step 0: Aadhaar */}
        {step === 0 && (
          <form onSubmit={handleGenerateOtp} className="bg-white border border-outline-variant rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-primary text-xl">fingerprint</span>
              <h2 className="text-base font-bold text-on-surface">Verify with Aadhaar</h2>
            </div>
            <p className="text-xs text-on-surface-variant">
              Enter your Aadhaar number linked to your ABHA account. An OTP will be sent to your registered mobile/email via ABDM.
            </p>
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
              <p className="text-xs text-on-surface-variant mt-1">OTP will be sent here for verification</p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Sending OTP...</>
              ) : (
                <><span className="material-symbols-outlined text-lg">send</span>Send OTP via ABDM</>
              )}
            </button>
          </form>
        )}

        {/* Step 1: OTP */}
        {step === 1 && (
          <form onSubmit={handleVerifyOtp} className="bg-white border border-outline-variant rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-primary text-xl">mark_email_read</span>
              <h2 className="text-base font-bold text-on-surface">Enter OTP</h2>
            </div>
            <p className="text-xs text-on-surface-variant">
              OTP sent to <span className="font-semibold text-primary">{otpSentTo}</span> by ABDM. Valid for 10 minutes.
            </p>

            {mockOtp && (
              <div className="flex items-center gap-3 bg-primary-fixed border border-outline-variant rounded-xl p-4">
                <span className="material-symbols-outlined text-primary text-2xl">mark_email_read</span>
                <div>
                  <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Demo OTP (sandbox)</p>
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
                  <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Verifying...</>
                ) : 'Verify OTP'}
              </button>
              <button type="button" onClick={reset} className="px-4 py-3 border border-outline-variant text-on-surface-variant text-sm font-semibold rounded-xl hover:bg-surface-container transition-colors">
                Back
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Link ABHA */}
        {step === 2 && (
          <form onSubmit={handleLinkAbha} className="bg-white border border-outline-variant rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-primary text-xl">link</span>
              <h2 className="text-base font-bold text-on-surface">Link Your ABHA ID</h2>
            </div>
            <p className="text-xs text-on-surface-variant">
              Your Aadhaar identity has been verified. We will now fetch your existing ABHA record from the NHA registry and link it to your profile here.
            </p>

            <div className="flex items-start gap-3 bg-[#f0f7ff] border border-[#1a56a0]/20 rounded-xl p-3">
              <span className="material-symbols-outlined text-[#1a56a0] text-xl mt-0.5">info</span>
              <p className="text-xs text-on-surface-variant">
                If you have a preferred ABHA address (e.g. <span className="font-semibold">yourname@abdm</span>), enter it below. Otherwise leave blank to use your existing one.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-on-surface-variant">ABHA Address (optional)</label>
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
                  <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Connecting...</>
                ) : (
                  <><span className="material-symbols-outlined text-lg">link</span>Connect ABHA to Profile</>
                )}
              </button>
              <button type="button" onClick={reset} className="px-4 py-3 border border-outline-variant text-on-surface-variant text-sm font-semibold rounded-xl hover:bg-surface-container transition-colors">
                Back
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Connected */}
        {step === 3 && abhaResult && (
          <div className="space-y-4">
            <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl bg-[#1a56a0] flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-2xl">verified</span>
                </div>
                <div>
                  <p className="text-base font-bold text-on-surface">ABHA ID Connected!</p>
                  <p className="text-xs text-on-surface-variant">Your government health account is now linked to this system</p>
                </div>
              </div>

              {/* ABHA Card style */}
              <div className="bg-gradient-to-br from-[#1a56a0] to-[#0d3b7a] rounded-2xl p-5 text-white mb-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs opacity-70 uppercase tracking-wider">Ayushman Bharat</p>
                    <p className="text-sm font-bold">Health Account</p>
                  </div>
                  <span className="material-symbols-outlined text-3xl opacity-80">health_and_safety</span>
                </div>
                <p className="text-xl font-bold tracking-widest mb-1">{abhaResult.abhaNumber || '——'}</p>
                <p className="text-xs opacity-70 mb-3">ABHA Number</p>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs opacity-70">Name</p>
                    <p className="text-sm font-semibold">{abhaResult.name || user.firstName + ' ' + user.lastName}</p>
                  </div>
                  {abhaResult.yearOfBirth && (
                    <div className="text-right">
                      <p className="text-xs opacity-70">Year of Birth</p>
                      <p className="text-sm font-semibold">{abhaResult.yearOfBirth}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                {[
                  { label: 'ABHA Address', value: abhaResult.abhaId, icon: 'alternate_email' },
                  { label: 'Linked Hospital', value: 'Unified Health System', icon: 'local_hospital' },
                  { label: 'Status', value: 'Active & Verified', icon: 'verified' },
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

            {user.gender !== 'Male' && user.gender !== 'male' && (
              <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-bold text-on-surface">Link to Maternal Record</h3>
                  {govtMaternalId && (
                    <span className="text-[10px] bg-secondary-container text-on-secondary-container font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">auto_awesome</span> Auto-Detected
                    </span>
                  )}
                </div>
                <p className="text-xs text-on-surface-variant mb-4">Link this ABHA ID to your active digital Maternal Care (RCH/MCTS) record.</p>
                <form onSubmit={handleLink} className="flex gap-3">
                  <input
                    value={govtMaternalId}
                    onChange={e => setGovtMaternalId(e.target.value)}
                    placeholder="e.g. RCH-2024-001234"
                    className="flex-1 px-3 py-2.5 border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none font-semibold text-primary"
                  />
                  <button
                    type="submit"
                    disabled={linkLoading}
                    className="px-5 py-2.5 bg-secondary text-white text-sm font-semibold rounded-xl hover:bg-secondary/90 transition-colors disabled:opacity-60 flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-base">link</span>
                    {linkLoading ? 'Linking...' : 'Link ID'}
                  </button>
                </form>
                {linkMsg && (
                  <p className={`text-xs mt-2 font-medium ${linkMsg.startsWith('✓') ? 'text-secondary' : 'text-error'}`}>
                    {linkMsg}
                  </p>
                )}
              </div>
            )}

            {!confirmDisconnect ? (
              <button
                onClick={() => setConfirmDisconnect(true)}
                className="w-full py-3 flex items-center justify-center gap-2 border border-error/40 text-error text-sm font-semibold rounded-xl hover:bg-error-container transition-colors"
              >
                <span className="material-symbols-outlined text-lg">link_off</span>
                Disconnect ABHA ID
              </button>
            ) : (
              <div className="bg-error-container border border-error/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-error text-xl">warning</span>
                  <p className="text-sm font-bold text-on-error-container">Disconnect ABHA ID?</p>
                </div>
                <p className="text-xs text-on-surface-variant">
                  This will unlink your ABHA account from this system. You can reconnect it anytime.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleDisconnect}
                    className="flex-1 py-2.5 bg-error text-white text-sm font-semibold rounded-xl hover:bg-error/90 transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">link_off</span>
                    Yes, Disconnect
                  </button>
                  <button
                    onClick={() => setConfirmDisconnect(false)}
                    className="flex-1 py-2.5 border border-outline-variant text-on-surface-variant text-sm font-semibold rounded-xl hover:bg-surface-container transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
