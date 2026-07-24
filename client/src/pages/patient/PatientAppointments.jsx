import { useState, useEffect } from 'react'
import axios from 'axios'
import DashboardLayout from '../../components/layout/DashboardLayout'
import BookAppointmentModal from '../../components/BookAppointmentModal'

const statusColors = {
  Confirmed: 'bg-secondary-container text-on-secondary-container',
  Pending: 'bg-tertiary-fixed text-on-tertiary-container',
  Completed: 'bg-surface-container-high text-on-surface-variant',
  Cancelled: 'bg-error-container text-on-error-container',
}

const filters = ['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled']

export default function PatientAppointments() {
  const token = localStorage.getItem('token')
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [showModal, setShowModal] = useState(false)

  useEffect(() => { fetchAppointments() }, [])

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



  const filtered = filter === 'All' ? appointments : appointments.filter(a => a.status === filter)

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">My Appointments</h1>
          <p className="text-on-surface-variant text-sm mt-1">Manage all your appointments here</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-container transition-colors"
        >
          <span className="material-symbols-outlined text-xl">add</span>
          Book Appointment
        </button>
      </div>

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

      {/* List */}
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
            <button onClick={() => setShowModal(true)} className="mt-4 px-6 py-2 bg-primary text-white text-sm font-semibold rounded-xl">
              Book Now
            </button>
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
                      <p className="text-sm font-bold text-on-surface">{apt.doctorName}</p>
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

      {showModal && (
        <BookAppointmentModal
          onClose={() => setShowModal(false)}
          onSuccess={fetchAppointments}
        />
      )}
    </DashboardLayout>
  )
}
