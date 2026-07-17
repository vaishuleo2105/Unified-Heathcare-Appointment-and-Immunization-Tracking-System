import DashboardLayout from '../../components/layout/DashboardLayout'
import StatCard from '../../components/StatCard'

const recentUsers = [
  { name: 'Vaishali S', role: 'patient', email: 'svaishali2105@gmail.com', joined: 'Jul 16, 2026' },
  { name: 'Dr. Ramesh Kumar', role: 'doctor', email: 'ramesh.kumar@health.com', joined: 'Jul 10, 2026' },
  { name: 'Priya Staff', role: 'staff', email: 'priya.staff@health.com', joined: 'Jul 08, 2026' },
  { name: 'Arjun Patel', role: 'patient', email: 'arjun.patel@gmail.com', joined: 'Jul 05, 2026' },
]

const systemStats = [
  { label: 'Appointments This Month', value: 142, icon: 'calendar_month', color: 'primary' },
  { label: 'Vaccinations This Month', value: 89, icon: 'vaccines', color: 'secondary' },
  { label: 'New Registrations', value: 34, icon: 'person_add', color: 'tertiary' },
  { label: 'Active Doctors', value: 8, icon: 'medical_services', color: 'secondary' },
]

const roleColors = {
  patient: 'bg-primary-fixed text-primary',
  doctor: 'bg-secondary-container text-on-secondary-container',
  staff: 'bg-tertiary-fixed text-on-tertiary-container',
  admin: 'bg-error-container text-on-error-container',
}

export default function AdminDashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-on-surface">System Overview 🛡️</h1>
        <p className="text-on-surface-variant mt-1">Welcome, {user.firstName}. Here's the full system status.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {systemStats.map((s) => (
          <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} color={s.color} />
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">

        {/* Recent Users */}
        <div className="bg-white rounded-xl border border-outline-variant p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-on-surface">Recent Registrations</h2>
            <button className="text-xs font-semibold text-primary hover:underline">Manage Users</button>
          </div>
          <div className="space-y-3">
            {recentUsers.map((u, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-surface-container-low rounded-xl">
                <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold text-sm">{u.name[0]}</span>
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-semibold text-on-surface truncate">{u.name}</p>
                  <p className="text-xs text-on-surface-variant truncate">{u.email}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${roleColors[u.role]}`}>
                    {u.role}
                  </span>
                  <p className="text-xs text-on-surface-variant">{u.joined}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-outline-variant p-6 shadow-sm">
          <h2 className="text-base font-bold text-on-surface mb-5">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: 'person_add', label: 'Add User', color: 'bg-primary-fixed text-primary' },
              { icon: 'calendar_month', label: 'View Appointments', color: 'bg-secondary-container text-secondary' },
              { icon: 'vaccines', label: 'Immunization Report', color: 'bg-tertiary-fixed text-tertiary' },
              { icon: 'bar_chart', label: 'System Reports', color: 'bg-surface-container-high text-on-surface' },
              { icon: 'settings', label: 'Settings', color: 'bg-surface-container-high text-on-surface' },
              { icon: 'download', label: 'Export Data', color: 'bg-secondary-container text-secondary' },
            ].map((action, i) => (
              <button
                key={i}
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
              { label: 'Backup', status: 'Last: Today', icon: 'backup', ok: true },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3 p-4 bg-surface-container-low rounded-xl">
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
