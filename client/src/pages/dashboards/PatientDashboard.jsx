import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import DashboardLayout from '../../components/layout/DashboardLayout'
import StatCard from '../../components/StatCard'
import BookAppointmentModal from '../../components/BookAppointmentModal'

const healthTips = [
  { icon: 'water_drop', tip: 'Drink at least 8 glasses of water daily.' },
  { icon: 'directions_walk', tip: 'Walk 30 minutes every day for better heart health.' },
  { icon: 'bedtime', tip: 'Get 7–8 hours of sleep for a strong immune system.' },
]

const statusColors = {
  Confirmed: 'bg-secondary-container text-on-secondary-container',
  Pending: 'bg-tertiary-fixed text-on-tertiary-container',
  Completed: 'bg-surface-container-high text-on-surface-variant',
  Cancelled: 'bg-error-container text-on-error-container',
}

export default function PatientDashboard() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const token = localStorage.getItem('token')

  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showBookModal, setShowBookModal] = useState(false)

  useEffect(() => {
    fetchAppointments()
  }, [])

  async function fetchAppointments() {
    try {
      const { data } = await axios.get('/api/appointments', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setAppointments(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }



  async function handleCancel(id) {
    try {
      await axios.delete(`/api/appointments/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchAppointments()
    } catch (err) {
      console.error(err)
    }
  }

  const upcoming = appointments.filter(a => a.status === 'Pending' || a.status === 'Confirmed')
  const completed = appointments.filter(a => a.status === 'Completed').length
  const cancelled = appointments.filter(a => a.status === 'Cancelled').length

  return (
    <DashboardLayout>

      {/* Welcome Banner */}
      <div className="mb-8 p-6 bg-primary-fixed rounded-2xl flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-primary-fixed">Welcome back, {user.firstName}! 👋</h1>
          <p className="text-on-primary-fixed-variant mt-1 text-sm">Here's your health summary for today.</p>
        </div>
        <span className="material-symbols-outlined text-primary text-6xl hidden md:block" style={{ fontVariationSettings: "'FILL' 1" }}>
          health_and_safety
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon="calendar_month" label="Upcoming Appointments" value={upcoming.length} color="primary" />
        <StatCard icon="vaccines" label="Immunizations Done" value="5" color="secondary" />
        <StatCard icon="pending_actions" label="Pending Vaccines" value="1" color="tertiary" />
        <StatCard icon="check_circle" label="Completed Visits" value={completed} color="secondary" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* Upcoming Appointments */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-outline-variant p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-on-surface">Upcoming Appointments</h2>
            <button
              onClick={() => navigate('/dashboard/patient/appointments')}
              className="text-xs font-semibold text-primary hover:underline"
            >
              View All
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <svg className="animate-spin h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : upcoming.length === 0 ? (
            <div className="text-center py-10">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant">calendar_month</span>
              <p className="text-sm text-on-surface-variant mt-2">No upcoming appointments</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.slice(0, 3).map((apt) => (
                <div key={apt._id} className="flex items-start gap-4 p-4 bg-surface-container-low rounded-xl">
                  <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-primary text-xl">calendar_month</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-on-surface">{apt.doctorName}</p>
                    <p className="text-xs text-on-surface-variant">{apt.type}</p>
                    <p className="text-xs text-on-surface-variant mt-1">{apt.date} • {apt.time}</p>
                    {apt.notes && <p className="text-xs text-on-surface-variant mt-1 italic">"{apt.notes}"</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColors[apt.status]}`}>
                      {apt.status}
                    </span>
                    {apt.status !== 'Cancelled' && (
                      <button
                        onClick={() => handleCancel(apt._id)}
                        className="text-xs text-error hover:underline"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => setShowBookModal(true)}
            className="mt-5 w-full py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-container transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-xl">add</span>
            Book New Appointment
          </button>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-outline-variant p-6 shadow-sm">
            <h2 className="text-base font-bold text-on-surface mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { icon: 'add_circle', label: 'Book Appointment', action: () => setShowBookModal(true), color: 'text-primary' },
                { icon: 'vaccines', label: 'Immunization Records', action: () => navigate('/dashboard/patient/immunization'), color: 'text-secondary' },
                { icon: 'person', label: 'My Profile', action: () => navigate('/dashboard/patient/profile'), color: 'text-tertiary' },
                { icon: 'history', label: 'Visit History', action: () => navigate('/dashboard/patient/appointments'), color: 'text-on-surface-variant' },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={item.action}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-low transition-colors text-left"
                >
                  <span className={`material-symbols-outlined text-xl ${item.color}`}>{item.icon}</span>
                  <span className="text-sm font-medium text-on-surface">{item.label}</span>
                  <span className="material-symbols-outlined text-on-surface-variant text-base ml-auto">chevron_right</span>
                </button>
              ))}
            </div>
          </div>

          {/* Health Tips */}
          <div className="bg-white rounded-xl border border-outline-variant p-6 shadow-sm">
            <h2 className="text-base font-bold text-on-surface mb-4">Health Tips</h2>
            <div className="space-y-3">
              {healthTips.map((tip, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-surface-container-low rounded-xl">
                  <span className="material-symbols-outlined text-secondary text-xl flex-shrink-0">{tip.icon}</span>
                  <p className="text-xs text-on-surface-variant">{tip.tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Immunization Summary */}
      <div className="mt-6 bg-white rounded-xl border border-outline-variant p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-on-surface">Immunization Summary</h2>
          <button
            onClick={() => navigate('/dashboard/patient/immunization')}
            className="text-xs font-semibold text-primary hover:underline"
          >
            View All
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { name: 'COVID-19 (Dose 2)', date: 'Jan 15, 2024', status: 'Completed' },
            { name: 'Influenza', date: 'Mar 10, 2024', status: 'Completed' },
            { name: 'Hepatitis B (Dose 3)', date: 'Aug 01, 2026', status: 'Upcoming' },
          ].map((imm, i) => (
            <div key={i} className="flex items-center gap-3 p-4 bg-surface-container-low rounded-xl">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${imm.status === 'Completed' ? 'bg-secondary-container' : 'bg-primary-fixed'}`}>
                <span className={`material-symbols-outlined text-xl ${imm.status === 'Completed' ? 'text-secondary' : 'text-primary'}`}>vaccines</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-on-surface">{imm.name}</p>
                <p className="text-xs text-on-surface-variant">{imm.date}</p>
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${imm.status === 'Completed' ? 'bg-secondary-container text-on-secondary-container' : 'bg-primary-fixed text-primary'}`}>
                {imm.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {showBookModal && (
        <BookAppointmentModal
          onClose={() => setShowBookModal(false)}
          onSuccess={fetchAppointments}
        />
      )}

    </DashboardLayout>
  )
}
