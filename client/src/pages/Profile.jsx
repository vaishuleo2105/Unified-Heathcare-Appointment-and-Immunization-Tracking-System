import DashboardLayout from '../components/layout/DashboardLayout'

const ROLE_COLORS = {
  patient: 'bg-primary-fixed text-primary',
  doctor:  'bg-secondary-container text-on-secondary-container',
  staff:   'bg-tertiary-fixed text-on-tertiary-container',
  admin:   'bg-error-container text-on-error-container',
}

export default function ProfilePage() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-on-surface">My Profile</h1>
        <p className="text-on-surface-variant mt-1">Your account information</p>
      </div>

      <div className="max-w-lg">
        <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-sm">
          {/* Avatar */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-outline-variant">
            <div className="w-16 h-16 rounded-full bg-primary-fixed flex items-center justify-center">
              <span className="text-primary font-bold text-2xl">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-on-surface">{user.firstName} {user.lastName}</h2>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${ROLE_COLORS[user.role]}`}>
                {user.role}
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4">
            {[
              { icon: 'person', label: 'First Name', value: user.firstName },
              { icon: 'person', label: 'Last Name', value: user.lastName },
              { icon: 'mail', label: 'Email', value: user.email },
              { icon: 'badge', label: 'Role', value: user.role },
              { icon: 'fingerprint', label: 'User ID', value: user.id },
            ].map(({ icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl">
                <span className="material-symbols-outlined text-on-surface-variant text-xl">{icon}</span>
                <div>
                  <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{label}</p>
                  <p className="text-sm font-medium text-on-surface capitalize">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
