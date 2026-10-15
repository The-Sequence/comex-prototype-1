import { useMemo, useState } from 'react'
import { Check, X } from 'lucide-react'
import * as db from '../../lib/db'
import { formatDate, isAwaitingApproval, useRegistrations } from '../../lib/useUsers'
import { useUrlSelection } from '../../lib/useUrlSelection'
import DecisionDialog from '../../components/DecisionDialog'
import ReasonDialog from '../../components/ReasonDialog'
import EmailNotifications from '../../components/EmailNotifications'
import ListState from '../../components/ListState'
import RegistrationDetails from '../../components/RegistrationDetails'
import { DisplaySearch } from '../../components/DashboardControls'

/** Frame 8 — Admin: Pending approvals (live), with a Rejected tab. */
export default function PendingApprovals() {
  const [tab, setTab] = useState('pending') // 'pending' | 'rejected'
  const { rows, status, error, reload } = useRegistrations(tab)
  const [action, setAction] = useState(null) // { user, approved } awaiting the reason dialog
  const [emailTick, setEmailTick] = useState(0) // bumps when a decision is saved or its email retried
  const [decision, setDecision] = useState(null) // { approved, emailStatus, decisionId } for the result dialog
  const list = useMemo(
    () =>
      (tab === 'pending' ? rows.filter(isAwaitingApproval) : rows).sort((a, b) =>
        (a.createdAt ?? '').localeCompare(b.createdAt ?? ''),
      ),
    [rows, tab],
  )
  // User whose Registration Details are open. In the URL (?account=<id>),
  // so Back closes the window instead of leaving the page.
  const [viewing, setViewing] = useUrlSelection('account', list)
  const canDecide = tab === 'pending'

  const ask = (user, approved) => setAction({ user, approved })

  const confirm = async (reason) => {
    const { user, approved } = action
    const result = await db.decideRegistration(user.id, approved ? 'approved' : 'rejected', reason || undefined)
    setAction(null)
    setViewing(null)
    setDecision({ approved, emailStatus: result?.emailStatus ?? 'failed', decisionId: result?.decisionId })
    reload()
    setEmailTick((t) => t + 1)
  }

  const tabClass = (name) =>
    `rounded px-4 py-1.5 text-xs font-semibold shadow-sm ${
      tab === name ? 'bg-sidebar text-white' : 'border border-gray-300 bg-white text-gray-800 hover:bg-canvas'
    }`

  return (
    <div>
      <h1 className="text-lg font-bold">Approval Requests</h1>
      <div className="mt-4 flex max-w-4xl flex-wrap items-center gap-3">
        <button onClick={() => setTab('pending')} className={tabClass('pending')} aria-pressed={tab === 'pending'}>
          Pending
        </button>
        <button onClick={() => setTab('rejected')} className={tabClass('rejected')} aria-pressed={tab === 'rejected'}>
          Rejected
        </button>
        <DisplaySearch placeholder="Search registrations" className="min-w-48 flex-1" />
      </div>
      <div className="mt-4 max-w-4xl">
        <ListState status={status} error={error} onRetry={reload} />
        {status === 'ready' && (
        <ul className="space-y-2">
          {list.map((u) => (
            <li
              key={u.id}
              className="flex items-center gap-4 rounded border border-gray-200 bg-white px-4 py-3 shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <button
                  onClick={() => setViewing(u)}
                  className="max-w-full truncate text-left text-sm font-semibold hover:text-navy hover:underline"
                >
                  {u.fullName}
                </button>
                <p className="truncate text-[11px] text-gray-500">
                  Department/Role: {u.department}/{u.role} · {u.email}
                </p>
              </div>
              <div className="text-right leading-tight">
                <p className="text-[11px] font-semibold">Date Registered</p>
                <p className="text-[11px] text-gray-500">{formatDate(u.createdAt)}</p>
              </div>
              {canDecide && (
                <>
                  <button
                    onClick={() => ask(u, false)}
                    className="rounded p-1 text-red-600 hover:bg-red-50"
                    aria-label={`Disapprove ${u.fullName}`}
                    title="Disapprove"
                  >
                    <X className="size-5" />
                  </button>
                  <button
                    onClick={() => ask(u, true)}
                    className="rounded p-1 text-green-600 hover:bg-green-50"
                    aria-label={`Approve ${u.fullName}`}
                    title="Approve"
                  >
                    <Check className="size-5" />
                  </button>
                </>
              )}
            </li>
          ))}
          {list.length === 0 && (
            <li className="rounded border border-dashed border-gray-300 py-10 text-center text-sm text-gray-500">
              {canDecide ? 'No pending registrations.' : 'No rejected registrations.'}
            </li>
          )}
        </ul>
        )}
      </div>
      <EmailNotifications refreshKey={emailTick} />
      {viewing && !action && (
        <RegistrationDetails
          user={viewing}
          readOnly={!canDecide}
          onApprove={() => ask(viewing, true)}
          onReject={() => ask(viewing, false)}
          onClose={() => setViewing(null)}
        />
      )}
      {action && <ReasonDialog user={action.user} approved={action.approved} onConfirm={confirm} onClose={() => setAction(null)} />}
      {decision && (
        <DecisionDialog
          approved={decision.approved}
          emailStatus={decision.emailStatus}
          onRetry={decision.decisionId ? async () => (await db.retryDecisionEmail(decision.decisionId)).emailStatus : undefined}
          onClose={() => {
            setDecision(null)
            setEmailTick((t) => t + 1)
          }}
        />
      )}
    </div>
  )
}
