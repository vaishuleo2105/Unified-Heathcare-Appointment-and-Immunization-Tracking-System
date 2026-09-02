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
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])
  const [slots, setSlots] = useState([])
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [patientRecord, setPatientRecord] = useState(null)
  const [profile, setProfile] = useState({})
  const [slotForm, setSlotForm] = useState({ doctorId: '', date: '', time: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([api.get('/appointments'), api.get('/immunizations'), api.get('/patients'), api.get('/appointments/doctors'), api.get('/slots')])
      .then(([a, i, p, d, s]) => { setAppointments(a.data); setImmunizations(i.data); setPatients(p.data); setDoctors(d.data); setSlots(s.data) })
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

  async function loadPatient(id) {
    setSelectedPatient(id)
    if (!id) return setPatientRecord(null)
    try {
      const { data } = await api.get(`/patients/${id}`)
      setPatientRecord(data)
      setProfile(data.patient)
    } catch (err) { setError(err.response?.data?.message || 'Could not load patient record') }
  }

  async function savePatientProfile() {
    try {
      const { data } = await api.put(`/patients/${selectedPatient}/medical-profile`, profile)
      setProfile(data.patient)
      setPatientRecord({ ...patientRecord, patient: data.patient })
    } catch (err) { setError(err.response?.data?.message || 'Could not update patient record') }
  }

  async function addSlot(e) {
    e.preventDefault()
    try {
      const { data } = await api.post('/slots', slotForm)
      setSlots([...slots, data].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)))
      setSlotForm({ doctorId: '', date: '', time: '' })
    } catch (err) { setError(err.response?.data?.message || 'Could not create slot') }
  }

  async function removeSlot(id) {
    try {
      await api.delete(`/slots/${id}`)
      setSlots(slots.filter(slot => slot._id !== id))
    } catch (err) { setError(err.response?.data?.message || 'Could not remove slot') }
  }

  const pending = appointments.filter(a => a.status === 'Pending')
  const confirmed = appointments.filter(a => a.status === 'Confirmed')
  const today = new Date().toLocaleDateString('en-CA')
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
            <h2 className="text-base font-bold text-on-surface">Pending Requests ({pending.length})</h2>
            <button onClick={() => navigate('/dashboard/appointments')} className="text-xs font-semibold text-primary hover:underline">View All</button>
          </div>
          {loading ? (
            <p className="text-sm text-on-surface-variant">Loading...</p>
          ) : pending.length === 0 ? (
            <p className="text-sm text-on-surface-variant">No pending appointment requests.</p>
          ) : (
            <div className="space-y-3">
              {pending.slice(0, 5).map(apt => (
                <div key={apt._id} className="flex items-center gap-4 p-4 bg-surface-container-low rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold text-sm">{apt.patientId?.firstName?.[0]}</span>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-semibold text-on-surface truncate">{apt.patientId?.firstName} {apt.patientId?.lastName}</p>
                    <p className="text-xs text-on-surface-variant truncate">{apt.type} • Dr. {apt.doctorId?.firstName} {apt.doctorId?.lastName}</p>
                    <p className="text-xs text-on-surface-variant">{apt.date} at {apt.time}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleStatus(apt._id, 'Confirmed')} className="px-3 py-1 bg-secondary text-white text-xs font-semibold rounded-lg hover:bg-secondary/90 transition-colors">
                      Confirm
                    </button>
                    <button onClick={() => handleStatus(apt._id, 'Cancelled')} className="px-3 py-1 border border-outline-variant text-on-surface-variant text-xs font-semibold rounded-lg hover:bg-surface-container transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Confirmed Appointments */}
        <div className="bg-white rounded-xl border border-outline-variant p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-on-surface">Confirmed Appointments ({confirmed.length})</h2>
            <button onClick={() => navigate('/dashboard/appointments')} className="text-xs font-semibold text-primary hover:underline">View All</button>
          </div>
          {loading ? (
            <p className="text-sm text-on-surface-variant">Loading...</p>
          ) : confirmed.length === 0 ? (
            <p className="text-sm text-on-surface-variant">No confirmed appointments.</p>
          ) : (
            <div className="space-y-3">
              {confirmed.slice(0, 5).map(apt => (
                <div key={apt._id} className="flex items-center gap-4 p-4 bg-surface-container-low rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center flex-shrink-0">
                    <span className="text-secondary font-bold text-sm">{apt.patientId?.firstName?.[0]}</span>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-semibold text-on-surface truncate">{apt.patientId?.firstName} {apt.patientId?.lastName}</p>
                    <p className="text-xs text-on-surface-variant truncate">{apt.type} • Dr. {apt.doctorId?.firstName} {apt.doctorId?.lastName}</p>
                    <p className="text-xs text-on-surface-variant">{apt.date} at {apt.time}</p>
                  </div>
                  <button onClick={() => handleStatus(apt._id, 'Completed')} className="px-3 py-1 bg-surface-container-high text-on-surface-variant text-xs font-semibold rounded-lg hover:bg-surface-container transition-colors">
                    Complete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
