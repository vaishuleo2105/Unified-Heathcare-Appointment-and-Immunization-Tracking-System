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

const VACCINE_INFO = {
  'BCG': { title: 'Bacillus Calmette–Guérin', protection: 'Tuberculosis (TB)', info: 'Essential newborn vaccine providing protection against severe forms of childhood tuberculosis.' },
  'OPV': { title: 'Oral Polio Vaccine', protection: 'Poliomyelitis (Polio)', info: 'Oral vaccine to build immunity against wild poliovirus strains.' },
  'Hepatitis B': { title: 'Hepatitis B Vaccine', protection: 'Hepatitis B Virus (Liver infection)', info: 'Prevents serious liver infection, chronic hepatitis, and liver cirrhosis.' },
  'DPT': { title: 'Diphtheria, Pertussis, Tetanus', protection: 'Diphtheria, Whooping Cough, Tetanus', info: 'Combination vaccine protecting against three life-threatening bacterial infections.' },
  'Hib': { title: 'Haemophilus Influenzae Type B', protection: 'Meningitis & Pneumonia', info: 'Protects infants from severe bacterial meningitis and pneumonia.' },
  'IPV': { title: 'Inactivated Polio Vaccine', protection: 'Poliomyelitis (Polio)', info: 'Injectable polio vaccine providing systemic poliovirus immunity.' },
  'Rotavirus': { title: 'Rotavirus Vaccine', protection: 'Severe Diarrheal Disease', info: 'Protects young children against severe rotavirus gastroenteritis and dehydration.' },
  'PCV': { title: 'Pneumococcal Conjugate Vaccine', protection: 'Pneumonia, Sepsis & Meningitis', info: 'Defends against Streptococcus pneumoniae bacteria causing severe infections.' },
  'MMR': { title: 'Measles, Mumps, Rubella', protection: 'Measles, Mumps & Rubella', info: 'Combines protection against three contagious viral childhood diseases.' },
  'Varicella': { title: 'Chickenpox Vaccine', protection: 'Varicella Zoster Virus', info: 'Provides effective immunity against chickenpox and its complications.' },
  'Hepatitis A': { title: 'Hepatitis A Vaccine', protection: 'Hepatitis A (Food/Waterborne)', info: 'Prevents acute viral liver illness transmitted through contaminated food/water.' },
  'Typhoid': { title: 'Typhoid Conjugate Vaccine', protection: 'Typhoid Fever', info: 'Protects against Salmonella Typhi bacterial infection.' },
  'COVID-19': { title: 'SARS-CoV-2 Vaccine', protection: 'COVID-19 Respiratory Infection', info: 'Builds antibodies to protect against severe COVID-19 infection and complications.' },
  'Influenza': { title: 'Seasonal Flu Vaccine', protection: 'Influenza Strains', info: 'Annual immunization protecting against seasonal respiratory influenza viruses.' },
  'HPV': { title: 'Human Papillomavirus Vaccine', protection: 'HPV & Cervical Cancer', info: 'Protects against high-risk HPV strains causing cervical and HPV-related cancers.' },
  'Td': { title: 'Tetanus & Diphtheria Toxoid', protection: 'Tetanus & Diphtheria Booster', info: 'Booster immunization for adolescents and adults to maintain tetanus protection.' },
}

export default function ImmunizationPage() {
  const { t } = useTranslation()
  const [records, setRecords] = useState([])
  const [reminders, setReminders] = useState([])
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ patientId: '', vaccineName: 'BCG', date: '', dueDate: '', status: 'Completed', dose: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const canAdd = ['staff', 'doctor', 'admin'].includes(user.role)

  useEffect(() => { fetchRecords(); fetchReminders() }, [])

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

  async function fetchReminders() {
    try {
      const { data } = await api.get('/immunizations/reminders')
      setReminders(data)
    } catch {}
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
      fetchReminders()
      setSuccess(t('recordAdded'))
      setShowForm(false)
      setForm({ patientId: '', vaccineName: 'BCG', date: '', dueDate: '', status: 'Completed', dose: '', notes: '' })
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

      {reminders.length > 0 && user.role === 'patient' && (
        <div className="mb-6 bg-tertiary-fixed border border-outline-variant rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2 text-on-tertiary-container"><span className="material-symbols-outlined">notifications_active</span><h2 className="text-sm font-bold">Vaccine due-date reminders</h2></div>
          <div className="space-y-1.5 text-xs text-on-tertiary-container">
            {reminders.map(reminder => <p key={reminder._id}><span className="font-semibold">{reminder.vaccineName}{reminder.dose ? ` (${reminder.dose})` : ''}</span> — {reminder.status} on {reminder.dueDate}</p>)}
          </div>
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
              <label className="text-xs font-semibold text-on-surface-variant">Next due date</label>
              <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} className="w-full mt-1 px-3 py-2.5 border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none" />
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
            <div
              key={r._id}
              onClick={() => setSelectedRecord(r)}
              className="bg-white border border-outline-variant rounded-xl p-5 shadow-sm flex items-center gap-4 hover:border-primary/50 hover:shadow-md cursor-pointer transition-all group"
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${STATUS_COLORS[r.status]}`}>
                <span className="material-symbols-outlined text-xl">vaccines</span>
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">
                    {r.vaccineName}{r.dose ? ` — ${r.dose}` : ''}
                  </p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[r.status]}`}>
                    {r.status}
                  </span>
                  <span className="text-[10px] text-on-surface-variant/70 opacity-0 group-hover:opacity-100 transition-opacity ml-auto flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-xs">visibility</span> Click to view details
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
                  onClick={(e) => { e.stopPropagation(); handleDelete(r._id) }}
                  title="Delete record"
                  className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">delete</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Immunization Record Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-outline-variant rounded-2xl max-w-lg w-full p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setSelectedRecord(null)}
              className="absolute top-4 right-4 p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-full transition-colors"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>

            {/* Modal Header */}
            <div className="flex items-start gap-4 mb-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${STATUS_COLORS[selectedRecord.status]}`}>
                <span className="material-symbols-outlined text-3xl">vaccines</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${STATUS_COLORS[selectedRecord.status]}`}>
                    {selectedRecord.status}
                  </span>
                  <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    {selectedRecord.dose || 'Standard Immunization'}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-on-surface mt-1">{selectedRecord.vaccineName}</h2>
                <p className="text-xs text-on-surface-variant">Digital Health Record ID: IMM-{selectedRecord._id.slice(-8).toUpperCase()}</p>
              </div>
            </div>

            {/* Vaccine Information Card */}
            {VACCINE_INFO[selectedRecord.vaccineName] && (
              <div className="bg-primary-fixed/30 border border-primary/20 rounded-xl p-4 mb-5">
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
                  <span className="material-symbols-outlined text-base">info</span>
                  Vaccine Information & Medical Details
                </div>
                <p className="text-xs font-semibold text-on-surface">
                  Protects Against: <span className="text-primary">{VACCINE_INFO[selectedRecord.vaccineName].protection}</span>
                </p>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                  {VACCINE_INFO[selectedRecord.vaccineName].info}
                </p>
              </div>
            )}

            {/* Grid Details */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="p-3 bg-surface-container-low rounded-xl">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Administered Date</p>
                <p className="text-sm font-semibold text-on-surface mt-0.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-base text-primary">calendar_today</span>
                  {selectedRecord.date}
                </p>
              </div>

              <div className="p-3 bg-surface-container-low rounded-xl">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Next Due Date</p>
                <p className="text-sm font-semibold text-on-surface mt-0.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-base text-secondary">event_repeat</span>
                  {selectedRecord.dueDate || 'Fully Completed'}
                </p>
              </div>

              <div className="p-3 bg-surface-container-low rounded-xl col-span-2">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Administered By / Provider</p>
                <p className="text-sm font-semibold text-on-surface mt-0.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-base text-tertiary">medical_services</span>
                  {selectedRecord.administeredBy
                    ? `Dr. ${selectedRecord.administeredBy.firstName} ${selectedRecord.administeredBy.lastName}`
                    : 'Unified Health Certified Clinic'}
                </p>
              </div>

              {selectedRecord.notes && (
                <div className="p-3 bg-surface-container-low rounded-xl col-span-2">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Clinical Notes & Remarks</p>
                  <p className="text-xs text-on-surface mt-1 italic leading-relaxed">
                    "{selectedRecord.notes}"
                  </p>
                </div>
              )}
            </div>

            {/* Digital Certificate Seal */}
            <div className="border-t border-outline-variant pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-secondary text-lg">verified</span>
                <span>Verified Digital Health Certificate</span>
              </div>
              <button
                onClick={() => window.print()}
                className="w-full sm:w-auto px-4 py-2 bg-surface-container-high hover:bg-surface-container text-on-surface font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">print</span>
                Print Certificate
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
