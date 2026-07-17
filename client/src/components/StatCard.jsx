export default function StatCard({ icon, label, value, color = 'primary' }) {
  const colors = {
    primary: 'bg-primary-fixed text-primary',
    secondary: 'bg-secondary-container text-secondary',
    tertiary: 'bg-tertiary-fixed text-tertiary',
    error: 'bg-error-container text-error',
  }

  return (
    <div className="bg-white rounded-xl border border-outline-variant p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
        <span className="material-symbols-outlined text-2xl">{icon}</span>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{label}</p>
        <p className="text-2xl font-bold text-on-surface">{value}</p>
      </div>
    </div>
  )
}
