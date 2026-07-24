import { useState } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'

export default function PatientProfile() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    email: user.email || '',
    phone: '',
    dob: '',
    gender: '',
    bloodGroup: '',
    address: '',
    emergencyContact: '',
  })
  const [saved, setSaved] = useState(false)

  function handleSave(e) {
    e.preventDefault()
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-on-surface">My Profile</h1>
        <p className="text-on-surface-variant text-sm mt-1">Manage your personal health information</p>
      </div>

      {saved && (
        <div className="mb-6 flex items-center gap-2 bg-secondary-container text-on-secondary-container px-4 py-3 rounded-xl text-sm font-medium">
          <span className="material-symbols-outlined text-base">check_circle</span>
          Profile updated successfully!
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">

        {/* Profile Card */}
        <div className="bg-white rounded-xl border border-outline-variant p-6 shadow-sm flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-primary-fixed flex items-center justify-center mb-4">
            <span className="text-primary font-bold text-3xl">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </span>
          </div>
          <h2 className="text-lg font-bold text-on-surface">{user.firstName} {user.lastName}</h2>
          <p className="text-sm text-on-surface-variant capitalize mt-1">{user.role}</p>
          <p className="text-xs text-on-surface-variant mt-1">{user.email}</p>
          <div className="mt-4 w-full p-3 bg-surface-container-low rounded-xl">
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Patient ID</p>
            <p className="text-sm font-bold text-primary mt-1">#{user.id?.slice(-8).toUpperCase()}</p>
          </div>
          <div className="mt-3 w-full p-3 bg-secondary-container rounded-xl">
            <p className="text-xs font-semibold text-on-secondary-container uppercase tracking-wider">Status</p>
            <p className="text-sm font-bold text-secondary mt-1">Active Patient</p>
          </div>
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-outline-variant p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-bold text-on-surface">Personal Information</h2>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-4 py-2 border border-primary text-primary text-sm font-semibold rounded-xl hover:bg-primary-fixed transition-colors"
              >
                <span className="material-symbols-outlined text-base">edit</span>
                Edit
              </button>
            ) : (
              <button
                onClick={() => setEditing(false)}
                className="text-sm text-on-surface-variant hover:text-error font-medium"
              >
                Cancel
              </button>
            )}
          </div>

          <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { label: 'First Name', key: 'firstName', type: 'text' },
              { label: 'Last Name', key: 'lastName', type: 'text' },
              { label: 'Email Address', key: 'email', type: 'email' },
              { label: 'Phone Number', key: 'phone', type: 'tel', placeholder: '+91 XXXXX XXXXX' },
              { label: 'Date of Birth', key: 'dob', type: 'date' },
              { label: 'Emergency Contact', key: 'emergencyContact', type: 'tel', placeholder: '+91 XXXXX XXXXX' },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key} className="space-y-1">
                <label className="text-xs font-semibold text-on-surface-variant">{label}</label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={e => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder || ''}
                  disabled={!editing}
                  className={`w-full px-4 py-3 border rounded-xl text-sm outline-none transition-all ${
                    editing
                      ? 'border-outline-variant focus:ring-2 focus:ring-primary bg-white'
                      : 'border-transparent bg-surface-container-low text-on-surface cursor-default'
                  }`}
                />
              </div>
            ))}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-on-surface-variant">Gender</label>
              <select
                value={form.gender}
                onChange={e => setForm({ ...form, gender: e.target.value })}
                disabled={!editing}
                className={`w-full px-4 py-3 border rounded-xl text-sm outline-none transition-all ${
                  editing
                    ? 'border-outline-variant focus:ring-2 focus:ring-primary bg-white'
                    : 'border-transparent bg-surface-container-low text-on-surface cursor-default'
                }`}
              >
                <option value="">Select gender</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-on-surface-variant">Blood Group</label>
              <select
                value={form.bloodGroup}
                onChange={e => setForm({ ...form, bloodGroup: e.target.value })}
                disabled={!editing}
                className={`w-full px-4 py-3 border rounded-xl text-sm outline-none transition-all ${
                  editing
                    ? 'border-outline-variant focus:ring-2 focus:ring-primary bg-white'
                    : 'border-transparent bg-surface-container-low text-on-surface cursor-default'
                }`}
              >
                <option value="">Select blood group</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                  <option key={bg}>{bg}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-on-surface-variant">Address</label>
              <textarea
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                placeholder="Your full address"
                rows={2}
                disabled={!editing}
                className={`w-full px-4 py-3 border rounded-xl text-sm outline-none transition-all resize-none ${
                  editing
                    ? 'border-outline-variant focus:ring-2 focus:ring-primary bg-white'
                    : 'border-transparent bg-surface-container-low text-on-surface cursor-default'
                }`}
              />
            </div>

            {editing && (
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-container transition-colors"
                >
                  Save Changes
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}
