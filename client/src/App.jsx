import { Routes, Route, Navigate } from 'react-router-dom'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import PatientDashboard from './pages/dashboards/PatientDashboard'
import DoctorDashboard from './pages/dashboards/DoctorDashboard'
import StaffDashboard from './pages/dashboards/StaffDashboard'
import AdminDashboard from './pages/dashboards/AdminDashboard'
import PatientAppointments from './pages/patient/PatientAppointments'
import PatientImmunization from './pages/patient/PatientImmunization'
import PatientProfile from './pages/patient/PatientProfile'
import ProtectedRoute from './components/ProtectedRoute'
import MaternalRecord from './pages/MaternalRecord'
import AppointmentsPage from './pages/Appointments'
import ImmunizationPage from './pages/Immunization'
import ProfilePage from './pages/Profile'
import AbhaPage from './pages/AbhaPage'

function Protected({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>
}

export default function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />

      {/* Patient Routes */}
      <Route path="/dashboard/patient" element={<Protected><PatientDashboard /></Protected>} />
      <Route path="/dashboard/patient/appointments" element={<Protected><PatientAppointments /></Protected>} />
      <Route path="/dashboard/patient/immunization" element={<Protected><PatientImmunization /></Protected>} />
      <Route path="/dashboard/patient/profile" element={<Protected><PatientProfile /></Protected>} />

      {/* Other Role Routes */}
      <Route path="/dashboard/doctor" element={<Protected><DoctorDashboard /></Protected>} />
      <Route path="/dashboard/staff" element={<Protected><StaffDashboard /></Protected>} />
      <Route path="/dashboard/admin" element={<Protected><AdminDashboard /></Protected>} />
      <Route path="/dashboard/appointments" element={<Protected><AppointmentsPage /></Protected>} />
      <Route path="/dashboard/immunization" element={<Protected><ImmunizationPage /></Protected>} />
      <Route path="/dashboard/profile" element={<Protected><ProfilePage /></Protected>} />
      <Route path="/maternal" element={<Protected><MaternalRecord /></Protected>} />
      <Route path="/abha" element={<Protected><AbhaPage /></Protected>} />
      <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
  )
}
