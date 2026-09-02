import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import api from '../../api'

const STATUS_COLORS = {
  Completed: 'bg-secondary-container text-on-secondary-container',
  Upcoming: 'bg-primary-fixed text-primary',
  Missed: 'bg-error-container text-on-error-container',
}

export default function PatientImmunization() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/immunizations')
      .then(({ data }) => setRecords(data))
      .catch(err => setError(err.response?.data?.message || 'Failed to load records'))
      .finally(() => setLoading(false))
  }, [])

  const completed = records.filter(r => r.status === 'Completed').length
  const upcoming = records.filter(r => r.status === 'Upcoming').length

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-on-surface">Immunization Records</h1>
        <p className="text-on-surface-variant text-sm mt-1">Your complete vaccination history</p>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 bg-error-container text-on-error-container px-4 py-3 rounded-lg text-sm">
          <span className="material-symbols-outlined text-base">error</span>{error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-outline-variant p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-secondary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-secondary text-2xl">check_circle</span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Completed</p>
            <p className="text-2xl font-bold text-on-surface">{completed}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-outline-variant p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-2xl">pending</span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Upcoming</p>
            <p className="text-2xl font-bold text-on-surface">{upcoming}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-outline-variant p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-tertiary-fixed flex items-center justify-center">
            <span className="material-symbols-outlined text-tertiary text-2xl">vaccines</span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Total Vaccines</p>
            <p className="text-2xl font-bold text-on-surface">{records.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="p-5 border-b border-outline-variant">
          <h2 className="text-base font-bold text-on-surface">Vaccination History</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <svg className="animate-spin h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant">vaccines</span>
            <p className="text-on-surface-variant mt-3 font-medium">No immunization records found</p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant">
            {records.map((r) => (
              <div key={r._id} className="flex items-center gap-4 p-5 hover:bg-surface-container-low transition-colors">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${STATUS_COLORS[r.status]}`}>
                  <span className="material-symbols-outlined text-xl">vaccines</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-on-surface">{r.vaccineName}{r.dose ? ` — ${r.dose}` : ''}</p>
                  <p className="text-xs text-on-surface-variant">
                    {r.administeredBy ? `Dr. ${r.administeredBy.firstName} ${r.administeredBy.lastName}` : 'Unified Health Clinic'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-on-surface">{r.date}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${STATUS_COLORS[r.status]}`}>
                    {r.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
