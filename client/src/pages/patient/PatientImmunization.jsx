import DashboardLayout from '../../components/layout/DashboardLayout'

const records = [
  { name: 'BCG', date: 'Jan 01, 2002', dose: 'Dose 1', status: 'Completed', provider: 'Rural Health Center' },
  { name: 'Hepatitis B', date: 'Jan 15, 2002', dose: 'Dose 1', status: 'Completed', provider: 'Rural Health Center' },
  { name: 'Hepatitis B', date: 'Feb 15, 2002', dose: 'Dose 2', status: 'Completed', provider: 'Rural Health Center' },
  { name: 'Polio (OPV)', date: 'Mar 01, 2002', dose: 'Dose 1', status: 'Completed', provider: 'Rural Health Center' },
  { name: 'COVID-19', date: 'Jan 10, 2024', dose: 'Dose 1', status: 'Completed', provider: 'District Hospital' },
  { name: 'COVID-19', date: 'Feb 10, 2024', dose: 'Dose 2', status: 'Completed', provider: 'District Hospital' },
  { name: 'Influenza', date: 'Mar 10, 2024', dose: 'Annual', status: 'Completed', provider: 'Rural Health Center' },
  { name: 'Hepatitis B', date: 'Aug 01, 2026', dose: 'Dose 3', status: 'Upcoming', provider: 'Rural Health Center' },
]

export default function PatientImmunization() {
  const completed = records.filter(r => r.status === 'Completed').length
  const upcoming = records.filter(r => r.status === 'Upcoming').length

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-on-surface">Immunization Records</h1>
        <p className="text-on-surface-variant text-sm mt-1">Your complete vaccination history</p>
      </div>

      {/* Summary Cards */}
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

      {/* Records Table */}
      <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="p-5 border-b border-outline-variant">
          <h2 className="text-base font-bold text-on-surface">Vaccination History</h2>
        </div>
        <div className="divide-y divide-outline-variant">
          {records.map((r, i) => (
            <div key={i} className="flex items-center gap-4 p-5 hover:bg-surface-container-low transition-colors">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                r.status === 'Completed' ? 'bg-secondary-container' : 'bg-primary-fixed'
              }`}>
                <span className={`material-symbols-outlined text-xl ${
                  r.status === 'Completed' ? 'text-secondary' : 'text-primary'
                }`}>vaccines</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-on-surface">{r.name}</p>
                <p className="text-xs text-on-surface-variant">{r.dose} • {r.provider}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-on-surface">{r.date}</p>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${
                  r.status === 'Completed'
                    ? 'bg-secondary-container text-on-secondary-container'
                    : 'bg-primary-fixed text-primary'
                }`}>
                  {r.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
