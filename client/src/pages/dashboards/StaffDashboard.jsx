import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/layout/DashboardLayout'
import StatCard from '../../components/StatCard'
import api from '../../api'

export default function StaffDashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState([])
  const [immunizations, setImmunizations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([api.get('/appointments'), api.get('/immunizations')])
      .then(([a, i]) => { setAppointments(a.data); setImmunizations(i.data) })
      .catch(() => setError('Failed to load data'))
      .finally(() => setLoading(false))
  }, [])

  async function handleStatus(id, status) {
    try {
      const { data } = await api.patch(`/appointments/${id}/status`, { status })
      setAppointments(appointments.map(a => a._id === id ? data : a))
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed')
    }
  }

  const pending = appointments.filter(a => a.status === 'Pending')
  const confirmed = appointments.filter(a => a.status === 'Confirmed')
  const today = new Date().toISOString().split('T')[0]
  const todayVax = immunizations.filter(i => i.date === today)

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-on-surface">Hello, {user.firstName}! 🏥</h1>
        <p className="text-on-surface-variant mt-1">Manage appointments and patient records.</p>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 bg-error-container text-on-error-container px-4 py-3 rounded-lg text-sm">
          <span className="material-symbols-outlined text-base">error</span>{error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon="pending_actions" label="Pending Appointments" value={loading ? '…' : pending.length} color="primary" />
        <StatCard icon="event_available" label="Confirmed Today" value={loading ? '…' : confirmed.length} color="secondary" />
        <StatCard icon="vaccines" label="Vaccinations Today" value={loading ? '…' : todayVax.length} color="tertiary" />
        <StatCard icon="folder_shared" label="Total Records" value={loading ? '…' : appointments.length} color="secondary" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pending Appointments */}
        <div className="bg-white rounded-xl border border-outline-variant p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-on-surface">Pending Appointments</h2>
            <button onClick={() => navigate('/dashboard/appointments')} className="text-xs font-semibold text-primary hover:underline">View All</button>
          </div>
          {loading ? (
            <p className="text-sm text-on-surface-variant">Loading...</p>
          ) : pending.length === 0 ? (
            <p className="text-sm text-on-surface-variant">No pending appointments.</p>
          ) : (
            <div className="space-y-3">
              {pending.slice(0, 4).map(apt => (
                <div key={apt._id} className="p-4 bg-surface-container-low rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-on-surface">{apt.patientId?.firstName} {apt.patientId?.lastName}</p>
                    <span className="text-xs bg-tertiary-fixed text-on-tertiary-container font-semibold px-2 py-1 rounded-full">Pending</span>
                  </div>
                  <p className="text-xs text-on-surface-variant">Dr. {apt.doctorId?.firstName} {apt.doctorId?.lastName} • {apt.type}</p>
                  <p className="text-xs text-on-surface-variant mt-1">{apt.date} • {apt.time}</p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleStatus(apt._id, 'Confirmed')}
                      className="flex-1 py-1.5 bg-primary-fixed text-primary text-xs font-semibold rounded-lg hover:bg-primary hover:text-white transition-colors"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => handleStatus(apt._id, 'Cancelled')}
                      className="flex-1 py-1.5 bg-error-container text-on-error-container text-xs font-semibold rounded-lg hover:bg-error hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Immunizations */}
        <div className="bg-white rounded-xl border border-outline-variant p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-on-surface">Recent Immunizations</h2>
            <button onClick={() => navigate('/dashboard/immunization')} className="text-xs font-semibold text-primary hover:underline">View All</button>
          </div>
          {loading ? (
            <p className="text-sm text-on-surface-variant">Loading...</p>
          ) : immunizations.length === 0 ? (
            <p className="text-sm text-on-surface-variant">No immunization records yet.</p>
          ) : (
            <div className="space-y-3">
              {immunizations.slice(0, 4).map(imm => (
                <div key={imm._id} className="flex items-center gap-4 p-4 bg-surface-container-low rounded-xl">
                  <div className="w-10 h-10 rounded-xl bg-secondary-container flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-secondary text-xl">vaccines</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-on-surface">{imm.patientId?.firstName} {imm.patientId?.lastName}</p>
                    <p className="text-xs text-on-surface-variant">{imm.vaccineName}{imm.dose ? ` — ${imm.dose}` : ''}</p>
                  </div>
                  <p className="text-xs text-on-surface-variant whitespace-nowrap">{imm.date}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
