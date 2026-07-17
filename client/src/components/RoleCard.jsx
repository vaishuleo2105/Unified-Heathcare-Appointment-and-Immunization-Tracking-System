export default function RoleCard({ icon, label, value, selected, onChange }) {
  return (
    <label className="role-card cursor-pointer group">
      <input
        className="hidden"
        type="radio"
        name="userRole"
        value={value}
        checked={selected}
        onChange={() => onChange(value)}
      />
      <div className="flex flex-col items-center p-4 border border-outline-variant rounded-xl transition-all hover:bg-surface-container-low group-hover:border-primary">
        <span
          className="material-symbols-outlined text-3xl mb-2 text-on-surface-variant"
          style={{ fontVariationSettings: "'FILL' 0" }}
        >
          {icon}
        </span>
        <span className="text-[11px] font-medium uppercase tracking-wider text-on-surface-variant">
          {label}
        </span>
      </div>
    </label>
  )
}
