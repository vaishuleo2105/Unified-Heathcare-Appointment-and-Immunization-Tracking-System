import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import axios from 'axios'
import RoleCard from '../components/RoleCard'
import LanguageSwitcher from '../components/LanguageSwitcher'

const ROLES = [
  { value: 'patient', icon: 'person' },
  { value: 'doctor', icon: 'medical_services' },
  { value: 'staff', icon: 'clinical_notes' },
  { value: 'admin', icon: 'admin_panel_settings' },
]

const API = '/api/auth'

export default function AuthPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const existingToken = localStorage.getItem('token')
  const existingUser = localStorage.getItem('user')
  if (existingToken && existingUser) {
    navigate('/dashboard', { replace: true })
  }

  const [mode, setMode] = useState('login')
  const [role, setRole] = useState('patient')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' })

  const isRegister = mode === 'register'

  function handleChange(e) {
    setForm({ ...form, [e.target.id]: e.target.value })
    setError('')
  }

  function switchMode(m) {
    setMode(m)
    setError('')
    setSuccess('')
    setForm({ firstName: '', lastName: '', email: '', password: '' })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!form.email || !form.password) return setError('Email and password are required')
    if (isRegister && (!form.firstName || !form.lastName)) return setError('First name and last name are required')

    setLoading(true)
    try {
      const endpoint = isRegister ? '/register' : '/login'
      const payload = isRegister
        ? { firstName: form.firstName, lastName: form.lastName, email: form.email, password: form.password, role }
        : { email: form.email, password: form.password, role }

      const { data } = await axios.post(`${API}${endpoint}`, payload)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      setSuccess(isRegister ? t('registerSuccess') : t('loginSuccess'))
      setTimeout(() => navigate('/dashboard'), 1000)
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden bg-surface">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-10 h-16 bg-surface border-b border-outline-variant">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            health_and_safety
          </span>
          <span className="text-xl font-bold text-primary">{t('appName')}</span>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:bg-surface-container-low p-2 rounded-full transition-colors">
            help
          </span>
        </div>
      </nav>

      {/* Main */}
      <main className="flex-grow flex items-center justify-center pt-24 pb-12 px-5 md:px-0 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 blur-3xl opacity-50 pointer-events-none bg-primary-fixed rounded-full" />
        <div className="absolute -bottom-24 -left-24 w-[30rem] h-[30rem] blur-3xl opacity-30 pointer-events-none bg-secondary-fixed" style={{ borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%' }} />

        <div className="w-full max-w-[1200px] grid lg:grid-cols-5 bg-white rounded-xl shadow-[0px_4px_20px_rgba(186,137,77,0.08)] border border-outline-variant overflow-hidden z-10">

          {/* Left Brand Panel */}
          <div className="hidden lg:flex lg:col-span-2 flex-col justify-center p-12 bg-surface-container-low relative overflow-hidden border-r border-outline-variant">
            <div className="relative z-10">
              <h1 className="text-4xl font-bold text-primary mb-6 leading-tight">
                Unified Health Appointment and Immunization Tracking System
              </h1>
              <p className="text-lg text-on-surface-variant mb-8 max-w-md">
                Our Modern Pastoral approach connects professional clinical excellence with the grounded stability of rural care.
              </p>
              <div className="space-y-4">
                {[
                  { icon: 'verified_user', text: 'Secure Patient Records' },
                  { icon: 'calendar_month', text: 'Seamless Scheduling' },
                  { icon: 'vaccines', text: 'Immunization Tracking' },
                ].map(({ icon, text }) => (
                  <div key={icon} className="flex items-center gap-3 text-secondary">
                    <span className="material-symbols-outlined">{icon}</span>
                    <span className="text-sm font-semibold uppercase tracking-wider">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Form Panel */}
          <div className="lg:col-span-3 p-8 md:p-12 flex flex-col">

            {/* Toggle */}
            <div className="flex justify-center mb-10">
              <div className="inline-flex p-1 bg-surface-container rounded-lg border border-outline-variant">
                {['login', 'register'].map((m) => (
                  <button
                    key={m}
                    onClick={() => switchMode(m)}
                    className={`px-8 py-2 text-sm font-semibold rounded-md transition-all capitalize ${
                      mode === m ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant hover:text-primary'
                    }`}
                  >
                    {t(m)}
                  </button>
                ))}
              </div>
            </div>

            {/* Header */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-on-surface mb-2">
                {isRegister ? t('createAccount') : t('login')}
              </h2>
              <p className="text-base text-on-surface-variant">
                {isRegister ? t('joinNetwork') : t('secureAccess')}
              </p>
            </div>

            {/* Role Selection */}
            <div className="mb-8">
              <label className="text-sm font-semibold uppercase tracking-wider text-on-surface mb-4 block">
                {t('selectRole')}
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {ROLES.map((r) => (
                  <RoleCard key={r.value} {...r} label={t(r.value)} selected={role === r.value} onChange={setRole} />
                ))}
              </div>
            </div>

            {/* Error / Success */}
            {error && (
              <div className="mb-4 flex items-center gap-2 bg-error-container text-on-error-container px-4 py-3 rounded-lg text-sm font-medium">
                <span className="material-symbols-outlined text-base">error</span>
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 flex items-center gap-2 bg-secondary-container text-on-secondary-container px-4 py-3 rounded-lg text-sm font-medium">
                <span className="material-symbols-outlined text-base">check_circle</span>
                {success}
              </div>
            )}

            {/* Form */}
            <form className="space-y-5" onSubmit={handleSubmit}>
              {isRegister && (
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-on-surface-variant ml-1" htmlFor="firstName">{t('firstName')}</label>
                    <input id="firstName" value={form.firstName} onChange={handleChange} placeholder="John"
                      className="w-full px-4 py-3 bg-white border border-outline-variant rounded-lg text-base focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-on-surface-variant ml-1" htmlFor="lastName">{t('lastName')}</label>
                    <input id="lastName" value={form.lastName} onChange={handleChange} placeholder="Doe"
                      className="w-full px-4 py-3 bg-white border border-outline-variant rounded-lg text-base focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface-variant ml-1" htmlFor="email">{t('email')}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline text-xl">mail</span>
                  </div>
                  <input id="email" type="email" value={form.email} onChange={handleChange} placeholder="email@example.com"
                    className="w-full pl-12 pr-4 py-3 bg-white border border-outline-variant rounded-lg text-base focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface-variant ml-1" htmlFor="password">{t('password')}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline text-xl">lock</span>
                  </div>
                  <input id="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={handleChange} placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-3 bg-white border border-outline-variant rounded-lg text-base focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-outline hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-xl">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between py-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" className="w-5 h-5 rounded border-outline-variant accent-primary" />
                  <span className="text-sm font-semibold text-on-surface-variant group-hover:text-on-surface transition-colors">
                    {isRegister ? t('agreeTerms') : t('rememberMe')}
                  </span>
                </label>
                {!isRegister && (
                  <a href="#" className="text-sm font-semibold text-primary hover:underline">{t('forgotPassword')}</a>
                )}
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-primary-container hover:bg-primary text-white font-semibold py-4 rounded-lg shadow-sm hover:shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed">
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>{t('processing')}</span>
                  </>
                ) : (
                  <>
                    <span>{isRegister ? t('registerBtn') : t('loginBtn')}</span>
                    <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform text-xl">arrow_forward</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 flex items-center justify-center gap-2 bg-surface-container p-3 rounded-lg">
              <span className="material-symbols-outlined text-secondary text-sm">cell_tower</span>
              <span className="text-[11px] font-medium uppercase tracking-wider text-on-surface-variant">
                {t('lowBandwidth')}
              </span>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-6 px-10 flex flex-col md:flex-row justify-between items-center text-on-surface-variant">
        <p className="text-xs font-medium">© 2024 Unified Health Tracking System. All rights reserved.</p>
        <div className="flex gap-6 mt-4 md:mt-0">
          <a href="#" className="text-xs font-medium hover:text-primary transition-colors">Privacy Policy</a>
          <a href="#" className="text-xs font-medium hover:text-primary transition-colors">Terms of Service</a>
          <a href="#" className="text-xs font-medium hover:text-primary transition-colors">Support</a>
        </div>
      </footer>
    </div>
  )
}
