import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import DashboardLayout from '../components/layout/DashboardLayout'
import api from '../api'

const STATUS_COLORS = {
  Completed: 'bg-secondary-container text-on-secondary-container',
  Upcoming:  'bg-primary-fixed text-primary',
  Missed:    'bg-error-container text-on-error-container',
}

const VACCINES = [
  'BCG', 'OPV', 'Hepatitis B', 'DPT', 'Hib', 'IPV', 'Rotavirus',
  'PCV', 'MMR', 'Varicella', 'Hepatitis A', 'Typhoid', 'COVID-19',
  'Influenza', 'HPV', 'Td', 'Other',
]

export default function ImmunizationPage() {
  const { t } = useTranslation()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ patientId: '', vaccineName: 'BCG', date: '', status: 'Completed', dose: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const canAdd = ['staff', 'doctor', 'admin'].includes(user.role)

  useEffect(() => { fetchRecords() }, [])

  async function fetchRecords() {
    setLoading(true)
    try {
      const { data } = await api.get('/immunizations')
      setRecords(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load records')
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd(e) {
    e.preventDefault()
    setError(''); setSuccess('')
    if (!form.patientId || !form.vaccineName || !form.date)
      return setError('Patient ID, vaccine name, and date are required')
    setSubmitting(true)
    try {
      const { data } = await api.post('/immunizations', form)
      setRecords([data, ...records])
      setSuccess(t('recordAdded'))
      setShowForm(false)
      setForm({ patientId: '', vaccineName: 'BCG', date: '', status: 'Completed', dose: '', notes: '' })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add record')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/immunizations/${id}`)
      setRecords(records.filter(r => r._id !== id))
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed')
    }
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">{t('immunization')}</h1>
          <p className="text-on-surface-variant mt-1">
            {user.role === 'patient' ? t('yourVaccinations') : t('manageImmunizations')}
          </p>
        </div>
        {canAdd && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">add</span>
            {t('addRecord')}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 bg-error-container text-on-error-container px-4 py-3 rounded-lg text-sm">
          <span className="material-symbols-outlined text-base">error</span>{error}
        </div>
      )}
      {success && (
        <div className="mb-4 flex items-center gap-2 bg-secondary-container text-on-secondary-container px-4 py-3 rounded-lg text-sm">
          <span className="material-symbols-outlined text-base">check_circle</span>{success}
        </div>
      )}

      {showForm && canAdd && (
        <form onSubmit={handleAdd} className="bg-white border border-outline-variant rounded-xl p-6 mb-6 shadow-sm">
          <h2 className="text-base font-bold text-on-surface mb-4">{t('addImmunizationRecord')}</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-on-surface-variant">{t('patientId')} *</label>
              <input
                value={form.patientId}
                onChange={e => setForm({ ...form, patientId: e.target.value })}
                placeholder="Patient's user ID"
                className="w-full mt-1 px-3 py-2.5 border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant">{t('vaccine')} *</label>
              <select
                value={form.vaccineName}
                onChange={e => setForm({ ...form, vaccineName: e.target.value })}
                className="w-full mt-1 px-3 py-2.5 border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
              >
                {VACCINES.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant">{t('date')} *</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                className="w-full mt-1 px-3 py-2.5 border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant">{t('status')}</label>
              <select
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
                className="w-full mt-1 px-3 py-2.5 border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
              >
                <option>Completed</option>
                <option>Upcoming</option>
                <option>Missed</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant">{t('dose')}</label>
              <input
                value={form.dose}
                onChange={e => setForm({ ...form, dose: e.target.value })}
                placeholder="e.g. Dose 1, Booster"
                className="w-full mt-1 px-3 py-2.5 border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant">{t('notes')}</label>
              <input
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="Optional notes"
                className="w-full mt-1 px-3 py-2.5 border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {submitting ? t('savingRecord') : t('saveRecord')}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-6 py-2.5 border border-outline-variant text-on-surface-variant text-sm font-semibold rounded-xl hover:bg-surface-container transition-colors"
            >
              {t('cancel')}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-on-surface-variant">
          <svg className="animate-spin h-6 w-6 mr-3 text-primary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {t('loading')}
        </div>
      ) : records.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant">
          <span className="material-symbols-outlined text-5xl mb-3 text-outline">vaccines</span>
          <p className="text-sm font-medium">{t('noRecordsFound')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map(r => (
            <div key={r._id} className="bg-white border border-outline-variant rounded-xl p-5 shadow-sm flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${STATUS_COLORS[r.status]}`}>
                <span className="material-symbols-outlined text-xl">vaccines</span>
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-on-surface">{r.vaccineName}{r.dose ? ` — ${r.dose}` : ''}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[r.status]}`}>
                    {r.status}
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant">
                  {r.date}
                  {r.patientId && ` • ${r.patientId.firstName} ${r.patientId.lastName}`}
                  {r.administeredBy && ` • By: ${r.administeredBy.firstName} ${r.administeredBy.lastName}`}
                </p>
                {r.notes && <p className="text-xs text-on-surface-variant mt-0.5 italic">"{r.notes}"</p>}
              </div>
              {['staff', 'admin'].includes(user.role) && (
                <button
                  onClick={() => handleDelete(r._id)}
                  className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">delete</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}
