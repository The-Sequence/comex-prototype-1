import { ChevronDown, Search } from 'lucide-react'

/** Visible controls for later sprints. They deliberately have no handlers. */
export function DisplayButton({ children, icon: Icon, label, className = '' }) {
  return (
    <button
      type="button"
      aria-label={label}
      title="Not available yet"
      className={`inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded border border-gray-800 px-3 py-2 text-sm font-medium shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy ${className}`}
    >
      {Icon && <Icon className="size-4 shrink-0" aria-hidden="true" />}
      {children}
    </button>
  )
}

export function DisplaySearch({ placeholder = 'Search', className = '' }) {
  return (
    <div className={`flex min-w-0 items-center gap-2 rounded border border-gray-800 bg-white px-3 py-2.5 shadow-sm ${className}`}>
      <button type="button" aria-label={placeholder} className="cursor-pointer text-gray-600 focus-visible:outline-2 focus-visible:outline-navy"><Search className="size-4 shrink-0" aria-hidden="true" /></button>
      <input aria-label={placeholder} placeholder={placeholder} className="min-w-0 w-full bg-transparent text-sm outline-none focus-visible:ring-2 focus-visible:ring-navy/20" />
    </div>
  )
}

export function DisplayFilter({ children }) {
  return <DisplayButton className="bg-white">{children}<ChevronDown className="size-4" aria-hidden="true" /></DisplayButton>
}

export function AttentionPanel({ items }) {
  return (
    <section className="mt-8 max-w-4xl rounded-xl border border-gray-400 bg-white p-5 shadow-md" aria-label="Needs your attention">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Requires attention</h2>
        <DisplayButton>Clear all</DisplayButton>
      </div>
      <ul className="divide-y divide-gray-200">
        {items.map(({ title, detail, action }) => (
          <li key={title} className="flex items-center justify-between gap-4 py-3">
            <div className="min-w-0"><p className="font-semibold">{title}</p><p className="mt-1 text-sm text-gray-600">{detail}</p></div>
            <DisplayButton className="shrink-0 bg-gold">{action}</DisplayButton>
          </li>
        ))}
      </ul>
    </section>
  )
}
