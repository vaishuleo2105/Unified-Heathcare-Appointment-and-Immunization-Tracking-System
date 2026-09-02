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
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [roleFilter, setRoleFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    Promise.all([
      api.get('/appointments'),
      api.get('/immunizations'),
      api.get('/auth/users'),
    ])
      .then(([a, i, u]) => {
        setAppointments(a.data)
        setImmunizations(i.data)
        setUsers(u.data)
      })
      .finally(() => setLoading(false))
  }, [])

  const filteredUsers = users.filter(u => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter
    const name = `${u.firstName || ''} ${u.lastName || ''} ${u.email || ''} ${u._id || ''}`.toLowerCase()
    const matchesSearch = name.includes(searchQuery.toLowerCase().trim())
    return matchesRole && matchesSearch
  })

  const patientCount = users.filter(u => u.role === 'patient').length
  const doctorCount  = users.filter(u => u.role === 'doctor').length
  const staffCount   = users.filter(u => u.role === 'staff').length

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-on-surface">System Administration 🛡️</h1>
        <p className="text-on-surface-variant mt-1">Welcome, {user.firstName}. Here is the live system user directory and operational status.</p>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon="group" label="Total Registered Users" value={loading ? '…' : users.length} color="primary" />
        <StatCard icon="person" label="Total Patients" value={loading ? '…' : patientCount} color="secondary" />
        <StatCard icon="medical_services" label="Doctors & Staff" value={loading ? '…' : (doctorCount + staffCount)} color="tertiary" />
        <StatCard icon="calendar_month" label="Total Appointments" value={loading ? '…' : appointments.length} color="primary" />
      </div>

      {/* ── Registered Users Directory ── */}
      <div className="bg-white rounded-xl border border-outline-variant p-6 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">manage_accounts</span>
              <h2 className="text-base font-bold text-on-surface">Existing System Users ({filteredUsers.length})</h2>
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">Manage and inspect all accounts registered in the healthcare system.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-base">search</span>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search name, email..."
                className="w-full pl-9 pr-3 py-2 border border-outline-variant rounded-xl text-xs focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            {/* Role Filter Tabs */}
            <div className="flex items-center bg-surface-container rounded-xl p-1 text-xs font-semibold self-stretch sm:self-auto">
              {['all', 'patient', 'doctor', 'staff', 'admin'].map(r => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-3 py-1.5 rounded-lg capitalize transition-colors ${
                    roleFilter === r ? 'bg-white text-primary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-on-surface-variant text-sm">
            <svg className="animate-spin h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading user directory...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 text-on-surface-variant text-sm">
            <span className="material-symbols-outlined text-4xl text-outline mb-2">person_search</span>
            <p>No matching users found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-outline-variant text-on-surface-variant uppercase tracking-wider font-semibold bg-surface-container-low">
                  <th className="p-3 rounded-l-xl">User Name & ID</th>
                  <th className="p-3">Email Address</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Health Profile / Details</th>
                  <th className="p-3">ABHA Status</th>
                  <th className="p-3 rounded-r-xl">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50">
                {filteredUsers.map(u => (
                  <tr key={u._id} className="hover:bg-surface-container-low/60 transition-colors">
                    <td className="p-3 font-semibold text-on-surface flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-fixed text-primary font-bold flex items-center justify-center flex-shrink-0">
                        {u.firstName?.[0]}{u.lastName?.[0]}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-on-surface">{u.firstName} {u.lastName}</p>
                        <p className="text-[10px] text-on-surface-variant font-mono">ID: {u._id}</p>
                      </div>
                    </td>
                    <td className="p-3 text-on-surface-variant font-medium">{u.email}</td>
                    <td className="p-3">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize ${ROLE_COLORS[u.role] || 'bg-surface-container text-on-surface'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 text-on-surface-variant">
                      {u.role === 'patient' ? (
                        <span>
                          {u.age ? `${u.age} yrs` : 'N/A'} • {u.gender || 'N/A'} • <span className="font-semibold text-primary">{u.bloodType || 'O+'}</span>
                        </span>
                      ) : (
                        <span className="italic text-on-surface-variant/70">Clinical Provider</span>
                      )}
                    </td>
                    <td className="p-3">
                      {u.abhaId ? (
                        <span className="text-[10px] bg-secondary-container text-on-secondary-container font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                          <span className="material-symbols-outlined text-xs">verified</span> Connected
                        </span>
                      ) : (
                        <span className="text-[10px] text-on-surface-variant/60">Not Linked</span>
                      )}
                    </td>
                    <td className="p-3 text-on-surface-variant">
                      {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
      </div>
    </DashboardLayout>
  )
}
