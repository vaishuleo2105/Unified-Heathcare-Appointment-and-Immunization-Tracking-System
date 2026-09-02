import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import api from '../../api'

const statusColors = {
  Confirmed: 'bg-secondary-container text-on-secondary-container',
  Pending: 'bg-tertiary-fixed text-on-tertiary-container',
  Completed: 'bg-surface-container-high text-on-surface-variant',
  Cancelled: 'bg-error-container text-on-error-container',
}

const filters = ['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled']

export default function PatientAppointments() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [error, setError] = useState('')

  useEffect(() => { fetchAppointments() }, [])

  async function fetchAppointments() {
    try {
      const { data } = await api.get('/appointments')
      setAppointments(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load appointments')
    } finally {
      setLoading(false)
    }
  }

  async function handleCancel(id) {
    try {
      await api.delete(`/appointments/${id}`)
      fetchAppointments()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel appointment')
    }
  }

  const filtered = filter === 'All' ? appointments : appointments.filter(a => a.status === filter)

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">My Appointments</h1>
          <p className="text-on-surface-variant text-sm mt-1">Manage all your appointments here</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 bg-error-container text-on-error-container px-4 py-3 rounded-lg text-sm">
          <span className="material-symbols-outlined text-base">error</span>{error}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-xs font-semibold rounded-full transition-all ${
              filter === f ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <svg className="animate-spin h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant">calendar_month</span>
            <p className="text-on-surface-variant mt-3 font-medium">No appointments found</p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant">
            {filtered.map((apt) => (
              <div key={apt._id} className="flex items-start gap-4 p-5 hover:bg-surface-container-low transition-colors">
                <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-primary text-2xl">calendar_month</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-on-surface">
                        Dr. {apt.doctorId?.firstName} {apt.doctorId?.lastName}
                      </p>
                      <p className="text-xs text-on-surface-variant mt-0.5">{apt.type}</p>
                      <p className="text-xs text-on-surface-variant mt-1">{apt.date} • {apt.time}</p>
                      {apt.notes && <p className="text-xs text-on-surface-variant mt-1 italic">Note: {apt.notes}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColors[apt.status]}`}>
                        {apt.status}
                      </span>
                      {(apt.status === 'Pending' || apt.status === 'Confirmed') && (
                        <button onClick={() => handleCancel(apt._id)} className="text-xs text-error hover:underline font-medium">
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
