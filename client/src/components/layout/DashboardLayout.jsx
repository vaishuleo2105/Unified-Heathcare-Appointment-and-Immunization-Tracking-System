import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const navItems = {
  patient: [
    { label: 'Overview', icon: 'dashboard', path: '/dashboard' },
    { label: 'My Appointments', icon: 'calendar_month', path: '/dashboard/appointments' },
    { label: 'Immunization Records', icon: 'vaccines', path: '/dashboard/immunization' },
    { label: 'Maternal ID', icon: 'pregnant_woman', path: '/maternal' },
    { label: 'My Profile', icon: 'person', path: '/dashboard/profile' },
  ],
  doctor: [
    { label: 'Overview', icon: 'dashboard', path: '/dashboard' },
    { label: "Today's Appointments", icon: 'calendar_month', path: '/dashboard/appointments' },
    { label: 'Patient List', icon: 'group', path: '/dashboard/patients' },
    { label: 'Immunization Records', icon: 'vaccines', path: '/dashboard/immunization' },
    { label: 'Maternal ID', icon: 'pregnant_woman', path: '/maternal' },
    { label: 'My Profile', icon: 'person', path: '/dashboard/profile' },
  ],
  staff: [
    { label: 'Overview', icon: 'dashboard', path: '/dashboard' },
    { label: 'Manage Appointments', icon: 'calendar_month', path: '/dashboard/appointments' },
    { label: 'Patient Records', icon: 'folder_shared', path: '/dashboard/patients' },
    { label: 'Immunization Records', icon: 'vaccines', path: '/dashboard/immunization' },
    { label: 'Maternal ID', icon: 'pregnant_woman', path: '/maternal' },
    { label: 'My Profile', icon: 'person', path: '/dashboard/profile' },
  ],
  admin: [
    { label: 'Overview', icon: 'dashboard', path: '/dashboard' },
    { label: 'Manage Users', icon: 'manage_accounts', path: '/dashboard/users' },
    { label: 'All Appointments', icon: 'calendar_month', path: '/dashboard/appointments' },
    { label: 'Immunization Records', icon: 'vaccines', path: '/dashboard/immunization' },
    { label: 'Reports', icon: 'bar_chart', path: '/dashboard/reports' },
    { label: 'Settings', icon: 'settings', path: '/dashboard/settings' },
  ],
}

export default function DashboardLayout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const items = navItems[user.role] || navItems.patient

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/auth')
  }

  return (
    <div className="min-h-screen bg-surface flex">

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full z-40 flex flex-col bg-surface-container-low border-r border-outline-variant transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-16 md:w-64'}`}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-outline-variant">
          <span className="material-symbols-outlined text-primary text-3xl flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
            health_and_safety
          </span>
          <span className={`text-base font-bold text-primary whitespace-nowrap overflow-hidden transition-all ${sidebarOpen ? 'opacity-100' : 'opacity-0 md:opacity-100'}`}>
            Unified Health
          </span>
        </div>

        {/* User Info */}
        <div className={`px-4 py-4 border-b border-outline-variant ${sidebarOpen ? 'block' : 'hidden md:block'}`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-bold text-sm">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </span>
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-on-surface truncate">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-on-surface-variant capitalize">{user.role}</p>
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {items.map((item) => {
            const active = location.pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all hover:bg-surface-container ${
                  active ? 'bg-primary-fixed text-primary border-r-2 border-primary' : 'text-on-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined text-xl flex-shrink-0">{item.icon}</span>
                <span className={`whitespace-nowrap overflow-hidden transition-all ${sidebarOpen ? 'opacity-100' : 'opacity-0 md:opacity-100'}`}>
                  {item.label}
                </span>
              </button>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-outline-variant p-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-2 py-2 text-sm font-medium text-on-surface-variant hover:text-error transition-colors rounded-lg hover:bg-error-container"
          >
            <span className="material-symbols-outlined text-xl flex-shrink-0">logout</span>
            <span className={`whitespace-nowrap overflow-hidden transition-all ${sidebarOpen ? 'opacity-100' : 'opacity-0 md:opacity-100'}`}>
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:ml-64">

        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-16 bg-surface border-b border-outline-variant flex items-center justify-between px-6">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-surface-container text-on-surface-variant"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-on-surface-variant text-xl">location_on</span>
            <span className="text-sm text-on-surface-variant">Rural Health Center</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors">
              <span className="material-symbols-outlined text-xl">notifications</span>
              <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center">
              <span className="text-primary font-bold text-xs">{user.firstName?.[0]}{user.lastName?.[0]}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
