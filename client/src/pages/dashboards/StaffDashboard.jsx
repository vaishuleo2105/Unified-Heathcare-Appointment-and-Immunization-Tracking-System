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

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <section className="bg-white rounded-xl border border-outline-variant p-6 shadow-sm">
          <h2 className="text-base font-bold text-on-surface mb-4">Appointment Slot Management</h2>
          <form onSubmit={addSlot} className="grid grid-cols-3 gap-2 mb-4">
            <select required value={slotForm.doctorId} onChange={e => setSlotForm({ ...slotForm, doctorId: e.target.value })} className="px-2 py-2 border border-outline-variant rounded-lg text-xs"><option value="">Doctor</option>{doctors.map(doctor => <option key={doctor._id} value={doctor._id}>Dr. {doctor.firstName} {doctor.lastName}</option>)}</select>
            <input required type="date" value={slotForm.date} onChange={e => setSlotForm({ ...slotForm, date: e.target.value })} className="px-2 py-2 border border-outline-variant rounded-lg text-xs" />
            <div className="flex gap-2"><input required type="time" value={slotForm.time} onChange={e => setSlotForm({ ...slotForm, time: e.target.value })} className="min-w-0 flex-1 px-2 py-2 border border-outline-variant rounded-lg text-xs" /><button className="px-2 bg-primary text-white rounded-lg text-xs font-semibold">Add</button></div>
          </form>
          <div className="space-y-2 max-h-52 overflow-y-auto">
            {slots.map(slot => <div key={slot._id} className="flex items-center justify-between text-xs bg-surface-container-low rounded-lg px-3 py-2"><span>Dr. {slot.doctorId?.firstName} {slot.doctorId?.lastName} — {slot.date}, {slot.time}</span>{slot.isBooked ? <span className="font-semibold text-on-surface-variant">Booked</span> : <button onClick={() => removeSlot(slot._id)} className="font-semibold text-error">Remove</button>}</div>)}
            {slots.length === 0 && <p className="text-xs text-on-surface-variant">No appointment slots created yet.</p>}
          </div>
        </section>

        <section className="bg-white rounded-xl border border-outline-variant p-6 shadow-sm">
          <h2 className="text-base font-bold text-on-surface mb-4">Patient Record Management</h2>
          <select value={selectedPatient || ''} onChange={e => loadPatient(e.target.value)} className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm mb-4"><option value="">Select a patient</option>{patients.map(patient => <option key={patient._id} value={patient._id}>{patient.firstName} {patient.lastName} — {patient.email}</option>)}</select>
          {patientRecord && <div>
            <div className="grid grid-cols-2 gap-2">
              <input type="number" value={profile.age || ''} onChange={e => setProfile({ ...profile, age: e.target.value })} placeholder="Age" className="px-2 py-2 border border-outline-variant rounded-lg text-xs" />
              <input value={profile.bloodType || ''} onChange={e => setProfile({ ...profile, bloodType: e.target.value })} placeholder="Blood type" className="px-2 py-2 border border-outline-variant rounded-lg text-xs" />
              <input value={profile.medicalCondition || ''} onChange={e => setProfile({ ...profile, medicalCondition: e.target.value })} placeholder="Medical condition" className="px-2 py-2 border border-outline-variant rounded-lg text-xs" />
              <input value={profile.medication || ''} onChange={e => setProfile({ ...profile, medication: e.target.value })} placeholder="Medication" className="px-2 py-2 border border-outline-variant rounded-lg text-xs" />
            </div>
            <button onClick={savePatientProfile} className="mt-3 px-3 py-2 bg-primary text-white text-xs font-semibold rounded-lg">Save medical profile</button>
            <p className="mt-3 text-xs text-on-surface-variant">{patientRecord.appointments.length} appointments • {patientRecord.immunizations.length} immunization records • {patientRecord.maternalRecords.length} maternal record(s)</p>
            {patientRecord.appointments.slice(0, 2).map(appointment => <p key={appointment._id} className="text-xs text-on-surface-variant mt-1">{appointment.date}: {appointment.type} — {appointment.status}{appointment.consultationOutcome && ` (${appointment.consultationOutcome})`}</p>)}
          </div>}
        </section>
      </div>
    </DashboardLayout>
  )
}
