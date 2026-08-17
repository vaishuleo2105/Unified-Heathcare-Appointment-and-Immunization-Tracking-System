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

const user = () => JSON.parse(localStorage.getItem('user') || '{}')

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([])
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ doctorId: '', date: '', time: '', type: 'General Checkup', notes: '' })
  const [submitting, setSubmitting] = useState(false)
  const role = user().role

  useEffect(() => {
    fetchAppointments()
    if (role === 'patient') fetchDoctors()
  }, [])

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
      setForm({ doctorId: '', date: '', time: '', type: 'General Checkup', notes: '' })
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
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed')
    }
  }

  async function handleCancel(id) {
    try {
      await api.delete(`/appointments/${id}`)
      setAppointments(appointments.filter(a => a._id !== id))
    } catch (err) {
      setError(err.response?.data?.message || 'Cancel failed')
    }
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Appointments</h1>
          <p className="text-on-surface-variant mt-1">
            {role === 'patient' ? 'Your scheduled appointments' : 'Manage all appointments'}
          </p>
        </div>
        {role === 'patient' && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">add</span>
            Book Appointment
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

      {/* Booking Form */}
      {showForm && role === 'patient' && (
        <form onSubmit={handleBook} className="bg-white border border-outline-variant rounded-xl p-6 mb-6 shadow-sm">
          <h2 className="text-base font-bold text-on-surface mb-4">New Appointment</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-on-surface-variant">Doctor *</label>
              <select
                value={form.doctorId}
                onChange={e => setForm({ ...form, doctorId: e.target.value })}
                className="w-full mt-1 px-3 py-2.5 border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="">Select a doctor</option>
                {doctors.map(d => (
                  <option key={d._id} value={d._id}>Dr. {d.firstName} {d.lastName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant">Type *</label>
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
              <label className="text-xs font-semibold text-on-surface-variant">Time *</label>
              <input
                type="time"
                value={form.time}
                onChange={e => setForm({ ...form, time: e.target.value })}
                className="w-full mt-1 px-3 py-2.5 border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
              />
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

      {/* Appointments List */}
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
                {['staff', 'doctor', 'admin'].includes(role) && apt.status === 'Confirmed' && (
                  <button
                    onClick={() => handleStatus(apt._id, 'Completed')}
                    className="px-3 py-1.5 bg-primary-fixed text-primary text-xs font-semibold rounded-lg hover:bg-primary hover:text-white transition-colors"
                  >
                    Complete
                  </button>
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
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}
