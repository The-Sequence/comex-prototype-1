import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
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

/* Cleared items are remembered per user in this browser, keyed by id and title.
 * The title carries the count, so a cleared item comes back once its count changes. */
const dismissedKey = (userId) => `comex-dismissed-attention-${userId ?? 'anonymous'}`
const signature = (item) => `${item.to ?? ''}::${item.title}`

function readDismissed(userId) {
  try {
    return new Set(JSON.parse(localStorage.getItem(dismissedKey(userId)) ?? '[]'))
  } catch {
    return new Set()
  }
}

/** Each item's action opens the page that resolves it (`to`, relative to the dashboard) or runs `onAction`. */
export function AttentionPanel({ items }) {
  const { user } = useOutletContext() ?? {}
  const navigate = useNavigate()
  const [dismissed, setDismissed] = useState(() => readDismissed(user?.id))
  const visible = items.filter(item => !dismissed.has(signature(item)))
  if (visible.length === 0) return null

  const clearAll = () => {
    const next = new Set([...dismissed, ...visible.map(signature)])
    try { localStorage.setItem(dismissedKey(user?.id), JSON.stringify([...next])) } catch { /* items just return next load */ }
    setDismissed(next)
  }

  return (
    <section className="mt-8 max-w-4xl rounded-xl border border-gray-400 bg-white p-5 shadow-md" aria-label="Needs your attention">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Requires attention</h2>
        <button type="button" onClick={clearAll} className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded border border-gray-800 px-3 py-2 text-sm font-medium shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy">Clear all</button>
      </div>
      <ul className="divide-y divide-gray-200">
        {visible.map(({ title, detail, action, onAction, to }) => (
          <li key={title} className="flex items-center justify-between gap-4 py-3">
            <div className="min-w-0"><p className="font-semibold">{title}</p><p className="mt-1 text-sm text-gray-600">{detail}</p></div>
            {onAction || to
              ? <button type="button" onClick={onAction ?? (() => navigate(`../${to}`, { relative: 'path' }))} className="shrink-0 cursor-pointer rounded border border-gray-800 bg-gold px-3 py-2.5 text-sm shadow-sm focus-visible:outline-2 focus-visible:outline-navy">{action}</button>
              : <DisplayButton className="shrink-0 bg-gold">{action}</DisplayButton>}
          </li>
        ))}
      </ul>
    </section>
  )
}
