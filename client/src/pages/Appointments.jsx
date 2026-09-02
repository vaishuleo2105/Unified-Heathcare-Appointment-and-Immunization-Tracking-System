import { useState, useEffect } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'
import api from '../api'

const TYPES = ['General Checkup', 'Follow-up', 'Vaccination', 'Consultation', 'Emergency']
const STATUS_COLORS = {
  Pending:   'bg-tertiary-fixed text-on-tertiary-container',
  Confirmed: 'bg-secondary-container text-on-secondary-container',
  Completed: 'bg-surface-container-high text-on-surface-variant',
  Cancelled: 'bg-error-container text-on-error-container',
}
const LOAD_COLORS = {
  'Available':  'text-secondary bg-secondary-container',
  'Low Load':   'text-primary bg-primary-fixed',
  'Moderate':   'text-on-tertiary-container bg-tertiary-fixed',
  'High Load':  'text-on-error-container bg-error-container',
}

const getUser = () => JSON.parse(localStorage.getItem('user') || '{}')

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([])
  const [doctors, setDoctors] = useState([])
  const [workload, setWorkload] = useState([])
  const [availableSlots, setAvailableSlots] = useState([])
  const [suggestedType, setSuggestedType] = useState('')
  const [suggestedDoctor, setSuggestedDoctor] = useState(null)
  const [suggestionConfidence, setSuggestionConfidence] = useState(0)
  const [suggestionSource, setSuggestionSource] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ doctorId: '', date: '', time: '', type: 'General Checkup', notes: '' })
  const [submitting, setSubmitting] = useState(false)
  const [consultationId, setConsultationId] = useState('')
  const [consultation, setConsultation] = useState({ consultationOutcome: '', consultationNotes: '' })
  const role = getUser().role

  useEffect(() => {
    fetchAppointments()
    if (role === 'patient') {
      fetchDoctors()
      fetchSuggestion()
    }
    if (['patient', 'staff', 'admin'].includes(role)) {
      fetchWorkload()
    }
  }, [])

  const [bookedSlots, setBookedSlots] = useState({ doctorBookedTimes: [], patientBookedTimes: [] })

  useEffect(() => {
    if (role !== 'patient' || !form.doctorId || !form.date) return setAvailableSlots([])
    api.get('/slots', { params: { doctorId: form.doctorId, date: form.date } })
      .then(({ data }) => setAvailableSlots(data))
      .catch(() => setAvailableSlots([]))
  }, [form.doctorId, form.date, role])

  useEffect(() => {
    if (role !== 'patient' || !form.doctorId || !form.date) {
      setBookedSlots({ doctorBookedTimes: [], patientBookedTimes: [] })
      return
    }
    api.get('/appointments/booked-slots', { params: { doctorId: form.doctorId, date: form.date } })
      .then(({ data }) => setBookedSlots(data))
      .catch(() => setBookedSlots({ doctorBookedTimes: [], patientBookedTimes: [] }))
  }, [form.doctorId, form.date, role])

  async function fetchAppointments() {
    setLoading(true)
    try {
      const { data } = await api.get('/appointments')
      setAppointments(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load appointments')
    } finally {
      setLoading(false)
    }
  }

  async function fetchDoctors() {
    try {
      const { data } = await api.get('/appointments/doctors')
      setDoctors(data)
    } catch {}
  }

  async function fetchSuggestion() {
    try {
      const { data } = await api.get('/appointments/suggest-type')
      if (data.suggestedType) {
        setSuggestedType(data.suggestedType)
        setSuggestionConfidence(data.confidence)
        setSuggestionSource(data.source)
        setSuggestedDoctor(data.suggestedDoctor || null)
        setForm(f => ({
          ...f,
          type: data.suggestedType,
          doctorId: f.doctorId || data.suggestedDoctor?._id || ''
        }))
      }
    } catch {}
  }

  async function fetchWorkload() {
    try {
      const { data } = await api.get('/appointments/doctor-workload')
      setWorkload(data)
    } catch {}
  }

  async function handleBook(e) {
    e.preventDefault()
    setError(''); setSuccess('')
    if (!form.doctorId || !form.date || !form.time) return setError('Doctor, date and time are required')
    setSubmitting(true)
    try {
      const { data } = await api.post('/appointments', form)
      setAppointments([data, ...appointments])
      setSuccess('Appointment booked successfully!')
      setShowForm(false)
      setForm({ doctorId: '', date: '', time: '', type: suggestedType || 'General Checkup', notes: '' })
      // Live refresh doctor workload & ML suggestion after booking
      fetchWorkload()
      fetchSuggestion()
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleStatus(id, status) {
    try {
      const { data } = await api.patch(`/appointments/${id}/status`, { status })
      setAppointments(appointments.map(a => a._id === id ? data : a))
      fetchWorkload()
      fetchSuggestion()
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed')
    }
  }

  async function handleCancel(id) {
    try {
      await api.delete(`/appointments/${id}`)
      setAppointments(appointments.filter(a => a._id !== id))
      fetchWorkload()
      fetchSuggestion()
    } catch (err) {
      setError(err.response?.data?.message || 'Cancel failed')
    }
  }

  async function saveConsultation(id) {
    if (!consultation.consultationOutcome.trim()) return setError('Consultation outcome is required')
    try {
      const { data } = await api.patch(`/appointments/${id}/consultation`, consultation)
      setAppointments(appointments.map(a => a._id === id ? data : a))
      setConsultationId('')
      setConsultation({ consultationOutcome: '', consultationNotes: '' })
      setSuccess('Consultation outcome recorded')
      fetchWorkload()
      fetchSuggestion()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save consultation outcome')
    }
  }

  // When a doctor is selected from workload panel, pre-fill the form
  function selectDoctorFromWorkload(docId) {
    setForm(f => ({ ...f, doctorId: docId }))
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function getDoctorWorkload(doctorId) {
    if (!doctorId) return null
    return workload.find(doc => String(doc._id) === String(doctorId))
  }

  function doctorsSortedByWorkload() {
    return [...doctors].sort((first, second) => {
      const firstW = getDoctorWorkload(first._id)
      const secondW = getDoctorWorkload(second._id)
      const firstScore = firstW ? (firstW.workloadScore ?? (firstW.activeAppointments * 2) ?? 0) : 0
      const secondScore = secondW ? (secondW.workloadScore ?? (secondW.activeAppointments * 2) ?? 0) : 0
      if (firstScore !== secondScore) {
        return firstScore - secondScore
      }
      return `${first.firstName} ${first.lastName}`.localeCompare(`${second.firstName} ${second.lastName}`)
    })
  }

  function toggleBookingForm() {
    if (!showForm) {
      const sorted = doctorsSortedByWorkload()
      const lowestLoadDoc = suggestedDoctor?._id || sorted[0]?._id || ''
      setForm(f => ({
        ...f,
        doctorId: f.doctorId || lowestLoadDoc,
        type: suggestedType || f.type || 'General Checkup',
      }))
    }
    setShowForm(!showForm)
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Appointments</h1>
          <p className="text-on-surface-variant mt-1">
            {role === 'patient' ? 'Your scheduled appointments' : 'Manage all clinic appointments & scheduling'}
          </p>
        </div>
        {['patient', 'staff', 'admin'].includes(role) && (
          <button
            onClick={toggleBookingForm}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-xl">add</span>
            {role === 'patient' ? 'Book Appointment' : 'Schedule Appointment'}
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

      {/* ── ML: Doctor Workload Panel (staff/admin) ── */}
      {['staff', 'admin'].includes(role) && workload.length > 0 && (
        <div className="bg-white border border-outline-variant rounded-xl p-5 shadow-sm mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary text-xl">insights</span>
            <h2 className="text-sm font-bold text-on-surface">Doctor Workload Analysis</h2>
            <span className="text-xs bg-primary-fixed text-primary px-2 py-0.5 rounded-full font-semibold ml-auto">AI Assisted</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {workload.map(doc => (
              <div key={doc._id} className="p-4 bg-surface-container-low rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-on-surface">Dr. {doc.firstName} {doc.lastName}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${LOAD_COLORS[doc.recommendation]}`}>
                    {doc.recommendation}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center mb-3">
                  <div>
                    <p className="text-lg font-bold text-on-surface">{doc.activeAppointments}</p>
                    <p className="text-xs text-on-surface-variant">Active</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-on-surface">{doc.todayAppointments}</p>
                    <p className="text-xs text-on-surface-variant">Today</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-on-surface">{doc.totalAppointments}</p>
                    <p className="text-xs text-on-surface-variant">Total</p>
                  </div>
                </div>
                <p className="text-xs text-on-surface-variant mb-3">
                  Patient risk: <span className="font-semibold text-on-surface">{doc.riskLevel} ({doc.riskScore}/100)</span>
                </p>
                {/* Load bar */}
                <div className="w-full bg-surface-container-high rounded-full h-1.5 mb-3">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      doc.recommendation === 'Available' ? 'bg-secondary' :
                      doc.recommendation === 'Low Load' ? 'bg-primary' :
                      doc.recommendation === 'Moderate' ? 'bg-tertiary' : 'bg-error'
                    }`}
                    style={{ width: `${Math.min((doc.loadScore / 10) * 100, 100)}%` }}
                  />
                </div>
                <button
                  onClick={() => selectDoctorFromWorkload(doc._id)}
                  className="w-full py-1.5 text-xs font-semibold bg-primary-fixed text-primary rounded-lg hover:bg-primary hover:text-white transition-colors"
                >
                  Book with this Doctor
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Booking Form ── */}
      {showForm && (
        <form onSubmit={handleBook} className="bg-white border border-outline-variant rounded-xl p-6 mb-6 shadow-sm">
          <h2 className="text-base font-bold text-on-surface mb-4">
            {role === 'patient' ? 'New Appointment' : 'Schedule Appointment for Patient'}
          </h2>

          {/* ML Suggestion Banner */}
          {suggestedType && (
            <div className="flex items-center gap-3 bg-primary-fixed border border-outline-variant rounded-xl p-3 mb-4">
              <span className="material-symbols-outlined text-primary text-xl">auto_awesome</span>
              <div className="flex-1">
                <p className="text-xs font-semibold text-on-surface">AI Suggestion</p>
                <p className="text-xs text-on-surface-variant">
                  Based on your {suggestionSource === 'ml_model_plus_history' ? 'medical profile and recent bookings' : 'medical profile'}, <span className="font-semibold text-primary">{suggestedType}</span> is pre-selected
                  {suggestionConfidence > 0 && ` (${suggestionConfidence}% confidence)`}
                </p>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            {role !== 'patient' && (
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-on-surface-variant">Patient ID (optional, defaults to current patient)</label>
                <input
                  value={form.patientId || ''}
                  onChange={e => setForm({ ...form, patientId: e.target.value })}
                  placeholder="Enter Patient User ID (leave blank to book for main patient)"
                  className="w-full mt-1 px-3 py-2.5 border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-on-surface-variant flex items-center justify-between">
                <span>Doctor * (Sorted by Lowest Workload)</span>
                {suggestedDoctor && (
                  <span className="text-[11px] font-semibold text-secondary flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">balance</span> AI Recommended
                  </span>
                )}
              </label>
              <select
                value={form.doctorId}
                onChange={e => setForm({ ...form, doctorId: e.target.value })}
                className="w-full mt-1 px-3 py-2.5 border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="">Select a doctor</option>
                {doctorsSortedByWorkload().map(d => {
                  const doctorWorkload = getDoctorWorkload(d._id)
                  const isSuggested = suggestedDoctor && String(suggestedDoctor._id) === String(d._id)
                  const loadLabel = doctorWorkload
                    ? `${doctorWorkload.recommendation} — ${doctorWorkload.activeAppointments} active`
                    : 'Checking workload...'
                  return (
                    <option key={d._id} value={d._id}>
                      {isSuggested ? '★ Recommended: ' : ''}Dr. {d.firstName} {d.lastName} ({loadLabel})
                    </option>
                  )
                })}
              </select>
              {form.doctorId && getDoctorWorkload(form.doctorId) && (
                <p className="mt-1.5 text-xs text-on-surface-variant">
                  Current workload: <span className="font-semibold text-on-surface">{getDoctorWorkload(form.doctorId).recommendation}</span>
                  {' '}— {getDoctorWorkload(form.doctorId).activeAppointments} active appointment(s),
                  {' '}patient risk score {getDoctorWorkload(form.doctorId).riskScore || 0}/100 ({getDoctorWorkload(form.doctorId).riskLevel}).
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant flex items-center gap-1">
                Type *
                {suggestedType && form.type === suggestedType && (
                  <span className="text-primary text-xs font-normal flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-sm">auto_awesome</span> suggested
                  </span>
                )}
              </label>
              <select
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
                className="w-full mt-1 px-3 py-2.5 border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
              >
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant">Date *</label>
              <input
                type="date"
                value={form.date}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setForm({ ...form, date: e.target.value })}
                className="w-full mt-1 px-3 py-2.5 border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant flex items-center justify-between">
                <span>Time *</span>
                {(bookedSlots.doctorBookedTimes.length > 0 || bookedSlots.patientBookedTimes.length > 0) && (
                  <span className="text-[10px] text-error font-semibold flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-xs">event_busy</span> Booked slots disabled
                  </span>
                )}
              </label>
              <select
                value={form.time}
                onChange={e => setForm({ ...form, time: e.target.value })}
                className="w-full mt-1 px-3 py-2.5 border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                required
              >
                <option value="">Select a time slot</option>
                {['08:00', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00'].map(t => {
                  const isDoctorBooked = bookedSlots.doctorBookedTimes.includes(t)
                  const isPatientBooked = bookedSlots.patientBookedTimes.includes(t)
                  const isDisabled = isDoctorBooked || isPatientBooked

                  let label = `${t}`
                  if (isDoctorBooked) label += ' — Doctor Booked ❌'
                  else if (isPatientBooked) label += ' — You Have Appointment ❌'
                  else label += ' (Available ✅)'

                  return (
                    <option key={t} value={t} disabled={isDisabled}>
                      {label}
                    </option>
                  )
                })}
              </select>
              {form.time && (bookedSlots.doctorBookedTimes.includes(form.time) || bookedSlots.patientBookedTimes.includes(form.time)) && (
                <p className="mt-1 text-xs text-error font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">warning</span>
                  Conflict Warning: This time slot is already booked and unavailable.
                </p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-on-surface-variant">Notes (optional)</label>
              <textarea
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                rows={2}
                placeholder="Describe your symptoms or reason for visit..."
                className="w-full mt-1 px-3 py-2.5 border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none resize-none"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {submitting ? 'Booking...' : 'Confirm Booking'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-6 py-2.5 border border-outline-variant text-on-surface-variant text-sm font-semibold rounded-xl hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ── Appointments List ── */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-on-surface-variant">
          <svg className="animate-spin h-6 w-6 mr-3 text-primary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading appointments...
        </div>
      ) : appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant">
          <span className="material-symbols-outlined text-5xl mb-3 text-outline">calendar_month</span>
          <p className="text-sm font-medium">No appointments found</p>
          {role === 'patient' && <p className="text-xs mt-1">Click "Book Appointment" to get started</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map(apt => (
            <div key={apt._id} className="bg-white border border-outline-variant rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-primary-fixed flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-primary text-xl">calendar_month</span>
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-on-surface">
                    {role === 'patient'
                      ? `Dr. ${apt.doctorId?.firstName} ${apt.doctorId?.lastName}`
                      : `${apt.patientId?.firstName} ${apt.patientId?.lastName}`}
                  </p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[apt.status]}`}>
                    {apt.status}
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant">{apt.type} • {apt.date} • {apt.time}</p>
                {apt.notes && <p className="text-xs text-on-surface-variant mt-1 italic">"{apt.notes}"</p>}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {['staff', 'doctor', 'admin'].includes(role) && apt.status === 'Pending' && (
                  <button
                    onClick={() => handleStatus(apt._id, 'Confirmed')}
                    className="px-3 py-1.5 bg-secondary-container text-on-secondary-container text-xs font-semibold rounded-lg hover:bg-secondary hover:text-white transition-colors"
                  >
                    Confirm
                  </button>
                )}
                {['staff', 'admin'].includes(role) && apt.status === 'Confirmed' && (
                  <button
                    onClick={() => handleStatus(apt._id, 'Completed')}
                    className="px-3 py-1.5 bg-primary-fixed text-primary text-xs font-semibold rounded-lg hover:bg-primary hover:text-white transition-colors"
                  >
                    Complete
                  </button>
                )}
                {role === 'doctor' && apt.status === 'Confirmed' && (
                  <button onClick={() => { setConsultationId(consultationId === apt._id ? '' : apt._id); setConsultation({ consultationOutcome: apt.consultationOutcome || '', consultationNotes: apt.consultationNotes || '' }) }} className="px-3 py-1.5 bg-primary-fixed text-primary text-xs font-semibold rounded-lg hover:bg-primary hover:text-white transition-colors">Record outcome</button>
                )}
                {(role === 'patient' || role === 'admin') && ['Pending', 'Confirmed'].includes(apt.status) && (
                  <button
                    onClick={() => handleCancel(apt._id)}
                    className="px-3 py-1.5 bg-error-container text-on-error-container text-xs font-semibold rounded-lg hover:bg-error hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
              {apt.consultationOutcome && <p className="w-full text-xs bg-secondary-container text-on-secondary-container rounded-lg px-2 py-1.5"><span className="font-semibold">Outcome:</span> {apt.consultationOutcome}{apt.consultationNotes && ` — ${apt.consultationNotes}`}</p>}
              {role === 'doctor' && consultationId === apt._id && (
                <div className="w-full bg-surface-container-low rounded-xl p-3">
                  <input value={consultation.consultationOutcome} onChange={e => setConsultation({ ...consultation, consultationOutcome: e.target.value })} placeholder="Consultation outcome / diagnosis *" className="w-full px-3 py-2 border border-outline-variant rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary" />
                  <textarea value={consultation.consultationNotes} onChange={e => setConsultation({ ...consultation, consultationNotes: e.target.value })} placeholder="Clinical notes, treatment, or follow-up advice" rows={2} className="w-full mt-2 px-3 py-2 border border-outline-variant rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary resize-none" />
                  <div className="flex gap-2 mt-2"><button onClick={() => saveConsultation(apt._id)} className="px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg">Save and complete</button><button onClick={() => setConsultationId('')} className="px-3 py-1.5 text-xs font-semibold text-on-surface-variant">Cancel</button></div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}
