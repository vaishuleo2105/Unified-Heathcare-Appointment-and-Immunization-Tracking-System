import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/layout/DashboardLayout'
import StatCard from '../../components/StatCard'
import api from '../../api'

const ROLE_COLORS = {
  patient: 'bg-primary-fixed text-primary',
  doctor:  'bg-secondary-container text-on-secondary-container',
  staff:   'bg-tertiary-fixed text-on-tertiary-container',
  admin:   'bg-error-container text-on-error-container',
}

export default function AdminDashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState([])
  const [immunizations, setImmunizations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get('/appointments'), api.get('/immunizations')])
      .then(([a, i]) => { setAppointments(a.data); setImmunizations(i.data) })
      .finally(() => setLoading(false))
  }, [])

  const thisMonth = new Date().getMonth()
  const monthApts = appointments.filter(a => new Date(a.date).getMonth() === thisMonth)
  const monthVax  = immunizations.filter(i => new Date(i.date).getMonth() === thisMonth)

  // Unique patients from appointments
  const patientIds = [...new Set(appointments.map(a => a.patientId?._id).filter(Boolean))]
  const doctorIds  = [...new Set(appointments.map(a => a.doctorId?._id).filter(Boolean))]

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-on-surface">System Overview 🛡️</h1>
        <p className="text-on-surface-variant mt-1">Welcome, {user.firstName}. Here's the full system status.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon="calendar_month" label="Appointments This Month" value={loading ? '…' : monthApts.length} color="primary" />
        <StatCard icon="vaccines" label="Vaccinations This Month" value={loading ? '…' : monthVax.length} color="secondary" />
        <StatCard icon="group" label="Unique Patients" value={loading ? '…' : patientIds.length} color="tertiary" />
        <StatCard icon="medical_services" label="Active Doctors" value={loading ? '…' : doctorIds.length} color="secondary" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Appointments */}
        <div className="bg-white rounded-xl border border-outline-variant p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-on-surface">Recent Appointments</h2>
            <button onClick={() => navigate('/dashboard/appointments')} className="text-xs font-semibold text-primary hover:underline">View All</button>
          </div>
          {loading ? (
            <p className="text-sm text-on-surface-variant">Loading...</p>
          ) : appointments.length === 0 ? (
            <p className="text-sm text-on-surface-variant">No appointments yet.</p>
          ) : (
            <div className="space-y-3">
              {appointments.slice(0, 4).map(apt => (
                <div key={apt._id} className="flex items-center gap-4 p-4 bg-surface-container-low rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold text-sm">{apt.patientId?.firstName?.[0]}</span>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-semibold text-on-surface truncate">{apt.patientId?.firstName} {apt.patientId?.lastName}</p>
                    <p className="text-xs text-on-surface-variant truncate">{apt.type} • Dr. {apt.doctorId?.firstName} {apt.doctorId?.lastName}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      apt.status === 'Confirmed' ? 'bg-secondary-container text-on-secondary-container' :
                      apt.status === 'Completed' ? 'bg-surface-container-high text-on-surface-variant' :
                      apt.status === 'Cancelled' ? 'bg-error-container text-on-error-container' :
                      'bg-tertiary-fixed text-on-tertiary-container'
                    }`}>{apt.status}</span>
                    <p className="text-xs text-on-surface-variant">{apt.date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-outline-variant p-6 shadow-sm">
          <h2 className="text-base font-bold text-on-surface mb-5">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: 'calendar_month', label: 'All Appointments', path: '/dashboard/appointments', color: 'bg-primary-fixed text-primary' },
              { icon: 'vaccines', label: 'Immunization Records', path: '/dashboard/immunization', color: 'bg-secondary-container text-secondary' },
              { icon: 'pregnant_woman', label: 'Maternal Records', path: '/maternal', color: 'bg-tertiary-fixed text-tertiary' },
              { icon: 'health_and_safety', label: 'ABHA Health ID', path: '/abha', color: 'bg-surface-container-high text-on-surface' },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center gap-2 p-4 bg-surface-container-low rounded-xl hover:bg-surface-container transition-colors"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.color}`}>
                  <span className="material-symbols-outlined text-xl">{action.icon}</span>
                </div>
                <span className="text-xs font-semibold text-on-surface text-center">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* System Health */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-outline-variant p-6 shadow-sm">
          <h2 className="text-base font-bold text-on-surface mb-5">System Health</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Database', status: 'Online', icon: 'storage', ok: true },
              { label: 'API Server', status: 'Running', icon: 'dns', ok: true },
              { label: 'ABHA Integration', status: 'Sandbox Mode', icon: 'health_and_safety', ok: true },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3 p-4 bg-surface-container-low rounded-xl">
                <div className="w-10 h-10 rounded-xl bg-secondary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-secondary text-xl">{s.icon}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-on-surface">{s.label}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className={`w-2 h-2 rounded-full ${s.ok ? 'bg-secondary' : 'bg-error'}`}></div>
                    <p className="text-xs text-on-surface-variant">{s.status}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
