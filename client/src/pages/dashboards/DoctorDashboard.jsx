import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/layout/DashboardLayout'
import StatCard from '../../components/StatCard'
import api from '../../api'

const STATUS_COLORS = {
  Completed:   'bg-surface-container-high text-on-surface-variant',
  'In Progress': 'bg-primary-fixed text-primary',
  Pending:     'bg-tertiary-fixed text-on-tertiary-container',
  Confirmed:   'bg-secondary-container text-on-secondary-container',
  Cancelled:   'bg-error-container text-on-error-container',
}

export default function DoctorDashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/appointments').then(r => setAppointments(r.data)).finally(() => setLoading(false))
  }, [])

  const today = new Date().toISOString().split('T')[0]
  const todayApts = appointments.filter(a => a.date === today)
  const completed = todayApts.filter(a => a.status === 'Completed').length

  async function handleStatus(id, status) {
    const { data } = await api.patch(`/appointments/${id}/status`, { status })
    setAppointments(appointments.map(a => a._id === id ? data : a))
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-on-surface">Good Morning, Dr. {user.firstName}! 👨‍⚕️</h1>
        <p className="text-on-surface-variant mt-1">You have {todayApts.length} appointments scheduled today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon="today" label="Today's Appointments" value={loading ? '…' : todayApts.length} color="primary" />
        <StatCard icon="group" label="Total Appointments" value={loading ? '…' : appointments.length} color="secondary" />
        <StatCard icon="check_circle" label="Completed Today" value={loading ? '…' : completed} color="secondary" />
        <StatCard icon="pending_actions" label="Pending Today" value={loading ? '…' : todayApts.filter(a => a.status === 'Pending').length} color="tertiary" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Today's Appointments */}
        <div className="bg-white rounded-xl border border-outline-variant p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-on-surface">Today's Appointments</h2>
            <span className="text-xs font-semibold bg-primary-fixed text-primary px-2 py-1 rounded-full">
              {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
          {loading ? (
            <p className="text-sm text-on-surface-variant">Loading...</p>
          ) : todayApts.length === 0 ? (
            <p className="text-sm text-on-surface-variant">No appointments today.</p>
          ) : (
            <div className="space-y-3">
              {todayApts.map(apt => (
                <div key={apt._id} className="flex items-center gap-4 p-4 bg-surface-container-low rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold text-sm">{apt.patientId?.firstName?.[0]}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-on-surface">{apt.patientId?.firstName} {apt.patientId?.lastName}</p>
                    <p className="text-xs text-on-surface-variant">{apt.type} • {apt.time}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[apt.status]}`}>{apt.status}</span>
                    {apt.status === 'Confirmed' && (
                      <button onClick={() => handleStatus(apt._id, 'Completed')} className="text-xs px-2 py-1 bg-secondary-container text-on-secondary-container rounded-lg font-semibold hover:bg-secondary hover:text-white transition-colors">
                        Done
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* All Upcoming */}
        <div className="bg-white rounded-xl border border-outline-variant p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-on-surface">Upcoming Appointments</h2>
            <button onClick={() => navigate('/dashboard/appointments')} className="text-xs font-semibold text-primary hover:underline">View All</button>
          </div>
          {loading ? (
            <p className="text-sm text-on-surface-variant">Loading...</p>
          ) : appointments.filter(a => ['Pending', 'Confirmed'].includes(a.status)).length === 0 ? (
            <p className="text-sm text-on-surface-variant">No upcoming appointments.</p>
          ) : (
            <div className="space-y-3">
              {appointments.filter(a => ['Pending', 'Confirmed'].includes(a.status)).slice(0, 4).map(apt => (
                <div key={apt._id} className="flex items-center gap-4 p-4 bg-surface-container-low rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center flex-shrink-0">
                    <span className="text-secondary font-bold text-sm">{apt.patientId?.firstName?.[0]}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-on-surface">{apt.patientId?.firstName} {apt.patientId?.lastName}</p>
                    <p className="text-xs text-on-surface-variant">{apt.type}</p>
                  </div>
                  <p className="text-xs text-on-surface-variant">{apt.date}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
