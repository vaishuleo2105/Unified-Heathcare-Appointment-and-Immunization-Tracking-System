import DashboardLayout from '../../components/layout/DashboardLayout'
import StatCard from '../../components/StatCard'

const pendingAppointments = [
  { id: 1, patient: 'Vaishali S', doctor: 'Dr. Ramesh Kumar', date: 'Jul 20, 2026', time: '10:00 AM', type: 'General Checkup' },
  { id: 2, patient: 'Ravi Kumar', doctor: 'Dr. Priya Nair', date: 'Jul 20, 2026', time: '11:30 AM', type: 'Follow-up' },
  { id: 3, patient: 'Meena Devi', doctor: 'Dr. Ramesh Kumar', date: 'Jul 21, 2026', time: '09:00 AM', type: 'Vaccination' },
]

const recentRecords = [
  { patient: 'Arjun Patel', action: 'Record Updated', time: '2 hours ago', icon: 'edit_note' },
  { patient: 'Sunita Rao', action: 'Appointment Booked', time: '3 hours ago', icon: 'calendar_month' },
  { patient: 'Kiran Bhat', action: 'Immunization Added', time: '5 hours ago', icon: 'vaccines' },
  { patient: 'Deepa Menon', action: 'Record Created', time: 'Yesterday', icon: 'person_add' },
]

export default function StaffDashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-on-surface">Hello, {user.firstName}! 🏥</h1>
        <p className="text-on-surface-variant mt-1">Manage appointments and patient records.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon="pending_actions" label="Pending Appointments" value="3" color="primary" />
        <StatCard icon="folder_shared" label="Total Records" value="245" color="secondary" />
        <StatCard icon="vaccines" label="Vaccinations Today" value="5" color="tertiary" />
        <StatCard icon="event_available" label="Confirmed Today" value="8" color="secondary" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">

        {/* Pending Appointments */}
        <div className="bg-white rounded-xl border border-outline-variant p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-on-surface">Pending Appointments</h2>
            <button className="text-xs font-semibold text-primary hover:underline">View All</button>
          </div>
          <div className="space-y-3">
            {pendingAppointments.map((apt) => (
              <div key={apt.id} className="p-4 bg-surface-container-low rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-on-surface">{apt.patient}</p>
                  <span className="text-xs bg-tertiary-fixed text-on-tertiary-container font-semibold px-2 py-1 rounded-full">Pending</span>
                </div>
                <p className="text-xs text-on-surface-variant">{apt.doctor} • {apt.type}</p>
                <p className="text-xs text-on-surface-variant mt-1">{apt.date} • {apt.time}</p>
                <div className="flex gap-2 mt-3">
                  <button className="flex-1 py-1.5 bg-primary-fixed text-primary text-xs font-semibold rounded-lg hover:bg-primary hover:text-white transition-colors">
                    Confirm
                  </button>
                  <button className="flex-1 py-1.5 bg-error-container text-error text-xs font-semibold rounded-lg hover:bg-error hover:text-white transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-outline-variant p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-on-surface">Recent Activity</h2>
          </div>
          <div className="space-y-3">
            {recentRecords.map((r, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-surface-container-low rounded-xl">
                <div className="w-10 h-10 rounded-xl bg-secondary-container flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-secondary text-xl">{r.icon}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-on-surface">{r.patient}</p>
                  <p className="text-xs text-on-surface-variant">{r.action}</p>
                </div>
                <p className="text-xs text-on-surface-variant whitespace-nowrap">{r.time}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
