import { Routes, Route, Navigate } from 'react-router-dom'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import PatientDashboard from './pages/dashboards/PatientDashboard'
import DoctorDashboard from './pages/dashboards/DoctorDashboard'
import StaffDashboard from './pages/dashboards/StaffDashboard'
import AdminDashboard from './pages/dashboards/AdminDashboard'
import ProtectedRoute from './components/ProtectedRoute'

function Protected({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>
}

export default function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
      <Route path="/dashboard/patient" element={<Protected><PatientDashboard /></Protected>} />
      <Route path="/dashboard/doctor" element={<Protected><DoctorDashboard /></Protected>} />
      <Route path="/dashboard/staff" element={<Protected><StaffDashboard /></Protected>} />
      <Route path="/dashboard/admin" element={<Protected><AdminDashboard /></Protected>} />
      <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
  )
}
