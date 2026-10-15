import { useState } from 'react'
import { Mail, RefreshCw } from 'lucide-react'
import * as db from '../lib/db'
import { useAsyncList } from '../lib/useAsyncList'
import { canRetry, emailStatusLabel, errorText } from '../lib/decisions'
import { formatDate } from '../lib/useUsers'

/**
 * Head-only recovery list: decisions whose notice email is not confirmed
 * sent. Survives a reload, so a failed email can always be retried here.
 * `refreshKey` changes when a new decision is saved.
 */
export default function EmailNotifications({ refreshKey }) {
  const { rows, status, error, reload } = useAsyncList(() => db.listDecisionEmails(), [refreshKey])
  const [busyId, setBusyId] = useState(null)
  const [notes, setNotes] = useState({}) // decisionId -> message

  if (status === 'loading' && rows.length === 0) return null
  if (status === 'ready' && rows.length === 0) return null

  const retry = async (row) => {
    setBusyId(row.decisionId)
    try {
      const { emailStatus } = await db.retryDecisionEmail(row.decisionId)
      const note =
        emailStatus === 'sent'
          ? ''
          : emailStatus === 'sending'
            ? 'Another send is in progress. Refresh in a moment.'
            : 'The email could not be sent. Try again.'
      setNotes((n) => ({ ...n, [row.decisionId]: note }))
    } catch (err) {
      setNotes((n) => ({ ...n, [row.decisionId]: errorText(err) }))
    } finally {
      setBusyId(null)
      reload()
    }
  }

  return (
    <section className="mt-6 max-w-4xl" aria-labelledby="email-notifications-title">
      <div className="flex items-center justify-between">
        <h2 id="email-notifications-title" className="flex items-center gap-1.5 text-sm font-bold">
          <Mail className="size-4" aria-hidden="true" /> Email notifications
        </h2>
        <button onClick={reload} className="flex items-center gap-1 text-[11px] font-semibold text-navy hover:underline">
          <RefreshCw className="size-3" aria-hidden="true" /> Refresh
        </button>
      </div>
      {status === 'error' ? (
        <p className="mt-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700" role="alert">
          {error}
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-gray-100 rounded border border-gray-200 bg-white">
          {rows.map((row) => (
            <li key={row.decisionId} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 text-xs">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">
                  {row.fullName} <span className="font-normal text-gray-500">· {row.email}</span>
                </p>
                <p className="text-[11px] text-gray-500">
                  {row.decision === 'approved' ? 'Approved' : 'Rejected'} · {formatDate(row.createdAt)}
                </p>
                {notes[row.decisionId] && <p className="text-[11px] text-red-700">{notes[row.decisionId]}</p>}
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  row.emailStatus === 'failed' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {emailStatusLabel(row)}
              </span>
              {canRetry(row) && (
                <button
                  onClick={() => retry(row)}
                  disabled={busyId === row.decisionId}
                  className="rounded border border-sidebar px-3 py-1 font-semibold text-sidebar hover:bg-canvas disabled:opacity-60"
                >
                  {busyId === row.decisionId ? 'Sending…' : 'Retry email'}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
