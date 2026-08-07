import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/layout/DashboardLayout'
import StatCard from '../../components/StatCard'
import api from '../../api'

export default function PatientDashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState([])
  const [immunizations, setImmunizations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/appointments'),
      api.get('/immunizations'),
    ]).then(([a, i]) => {
      setAppointments(a.data)
      setImmunizations(i.data)
    }).finally(() => setLoading(false))
  }, [])

  const upcoming = appointments.filter(a => ['Pending', 'Confirmed'].includes(a.status))
  const done = immunizations.filter(i => i.status === 'Completed')
  const pending = immunizations.filter(i => i.status === 'Upcoming')

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-on-surface">Welcome back, {user.firstName}! 👋</h1>
        <p className="text-on-surface-variant mt-1">Here's your health summary for today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon="calendar_month" label="Upcoming Appointments" value={loading ? '…' : upcoming.length} color="primary" />
        <StatCard icon="vaccines" label="Immunizations Done" value={loading ? '…' : done.length} color="secondary" />
        <StatCard icon="pending_actions" label="Pending Vaccines" value={loading ? '…' : pending.length} color="tertiary" />
        <StatCard icon="favorite" label="Health Score" value="Good" color="secondary" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <div className="bg-white rounded-xl border border-outline-variant p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-on-surface">Upcoming Appointments</h2>
            <button onClick={() => navigate('/dashboard/appointments')} className="text-xs font-semibold text-primary hover:underline">View All</button>
          </div>
          {loading ? (
            <p className="text-sm text-on-surface-variant">Loading...</p>
          ) : upcoming.length === 0 ? (
            <p className="text-sm text-on-surface-variant">No upcoming appointments.</p>
          ) : (
            <div className="space-y-4">
              {upcoming.slice(0, 3).map(apt => (
                <div key={apt._id} className="flex items-start gap-4 p-4 bg-surface-container-low rounded-xl">
                  <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-primary text-xl">calendar_month</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-on-surface">Dr. {apt.doctorId?.firstName} {apt.doctorId?.lastName}</p>
                    <p className="text-xs text-on-surface-variant">{apt.type}</p>
                    <p className="text-xs text-on-surface-variant mt-1">{apt.date} • {apt.time}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${apt.status === 'Confirmed' ? 'bg-secondary-container text-on-secondary-container' : 'bg-tertiary-fixed text-on-tertiary-container'}`}>
                    {apt.status}
                  </span>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => navigate('/dashboard/appointments')} className="mt-4 w-full py-3 border border-primary text-primary text-sm font-semibold rounded-xl hover:bg-primary-fixed transition-colors">
            + Book New Appointment
          </button>
        </div>

        {/* Immunization Records */}
        <div className="bg-white rounded-xl border border-outline-variant p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-on-surface">Immunization Records</h2>
            <button onClick={() => navigate('/dashboard/immunization')} className="text-xs font-semibold text-primary hover:underline">View All</button>
          </div>
          {loading ? (
            <p className="text-sm text-on-surface-variant">Loading...</p>
          ) : immunizations.length === 0 ? (
            <p className="text-sm text-on-surface-variant">No immunization records found.</p>
          ) : (
            <div className="space-y-4">
              {immunizations.slice(0, 3).map(imm => (
                <div key={imm._id} className="flex items-center gap-4 p-4 bg-surface-container-low rounded-xl">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${imm.status === 'Completed' ? 'bg-secondary-container' : 'bg-tertiary-fixed'}`}>
                    <span className={`material-symbols-outlined text-xl ${imm.status === 'Completed' ? 'text-secondary' : 'text-tertiary'}`}>vaccines</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-on-surface">{imm.vaccineName}{imm.dose ? ` — ${imm.dose}` : ''}</p>
                    <p className="text-xs text-on-surface-variant">{imm.date}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${imm.status === 'Completed' ? 'bg-secondary-container text-on-secondary-container' : 'bg-primary-fixed text-primary'}`}>
                    {imm.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
