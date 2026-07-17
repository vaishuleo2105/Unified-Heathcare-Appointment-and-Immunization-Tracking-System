import { Navigate } from 'react-router-dom'

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  if (!user.role) return <Navigate to="/auth" replace />

  const routes = {
    patient: '/dashboard/patient',
    doctor: '/dashboard/doctor',
    staff: '/dashboard/staff',
    admin: '/dashboard/admin',
  }

  return <Navigate to={routes[user.role] || '/dashboard/patient'} replace />
}
