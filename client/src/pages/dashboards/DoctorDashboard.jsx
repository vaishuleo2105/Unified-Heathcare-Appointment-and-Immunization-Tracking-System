import DashboardLayout from '../../components/layout/DashboardLayout'
import StatCard from '../../components/StatCard'

const todayAppointments = [
  { id: 1, patient: 'Vaishali S', time: '09:00 AM', type: 'General Checkup', status: 'Completed' },
  { id: 2, patient: 'Ravi Kumar', time: '10:30 AM', type: 'Follow-up', status: 'In Progress' },
  { id: 3, patient: 'Meena Devi', time: '12:00 PM', type: 'Vaccination', status: 'Waiting' },
  { id: 4, patient: 'Arjun Patel', time: '02:00 PM', type: 'Consultation', status: 'Scheduled' },
]

const recentPatients = [
  { name: 'Vaishali S', age: 24, lastVisit: 'Jul 16, 2026', condition: 'Routine Checkup' },
  { name: 'Ravi Kumar', age: 45, lastVisit: 'Jul 15, 2026', condition: 'Hypertension' },
  { name: 'Meena Devi', age: 32, lastVisit: 'Jul 14, 2026', condition: 'Vaccination' },
]

const statusColors = {
  Completed: 'bg-secondary-container text-on-secondary-container',
  'In Progress': 'bg-primary-fixed text-primary',
  Waiting: 'bg-tertiary-fixed text-on-tertiary-container',
  Scheduled: 'bg-surface-container-high text-on-surface-variant',
}

export default function DoctorDashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-on-surface">Good Morning, Dr. {user.firstName}! 👨‍⚕️</h1>
        <p className="text-on-surface-variant mt-1">You have 4 appointments scheduled today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon="today" label="Today's Appointments" value="4" color="primary" />
        <StatCard icon="group" label="Total Patients" value="128" color="secondary" />
        <StatCard icon="vaccines" label="Vaccinations Today" value="3" color="tertiary" />
        <StatCard icon="check_circle" label="Completed Today" value="1" color="secondary" />
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
          <div className="space-y-3">
            {todayAppointments.map((apt) => (
              <div key={apt.id} className="flex items-center gap-4 p-4 bg-surface-container-low rounded-xl">
                <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold text-sm">{apt.patient[0]}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-on-surface">{apt.patient}</p>
                  <p className="text-xs text-on-surface-variant">{apt.type} • {apt.time}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColors[apt.status]}`}>
                  {apt.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Patients */}
        <div className="bg-white rounded-xl border border-outline-variant p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-on-surface">Recent Patients</h2>
            <button className="text-xs font-semibold text-primary hover:underline">View All</button>
          </div>
          <div className="space-y-3">
            {recentPatients.map((p, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-surface-container-low rounded-xl">
                <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center flex-shrink-0">
                  <span className="text-secondary font-bold text-sm">{p.name[0]}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-on-surface">{p.name}</p>
                  <p className="text-xs text-on-surface-variant">Age {p.age} • {p.condition}</p>
                </div>
                <p className="text-xs text-on-surface-variant">{p.lastVisit}</p>
              </div>
            ))}
          </div>
          <button className="mt-4 w-full py-3 border border-primary text-primary text-sm font-semibold rounded-xl hover:bg-primary-fixed transition-colors">
            View All Patients
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}
