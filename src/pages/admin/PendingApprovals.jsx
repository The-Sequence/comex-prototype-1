import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { setUserStatus } from '../../lib/db'
import { formatDate, isAwaitingApproval, useUsers } from '../../lib/useUsers'
import DecisionDialog from '../../components/DecisionDialog'
import RegistrationDetails from '../../components/RegistrationDetails'

/** Frame 8 — Admin: Pending approvals. */
export default function PendingApprovals() {
  const users = useUsers()
  const [decision, setDecision] = useState(null) // 'approved' | 'denied' | null
  const [viewing, setViewing] = useState(null) // user whose Registration Details are open

  const pending = users
    .filter(isAwaitingApproval)
    .sort((a, b) => a.registeredAt.localeCompare(b.registeredAt))

  const decide = (user, status) => {
    setUserStatus(user.id, status) // removes them from the list
    setViewing(null)
    setDecision(status)
  }

  return (
    <div>
      <h1 className="text-lg font-bold">Approval Requests</h1>
      <div className="mt-4 max-w-4xl">
        <ul className="space-y-2">
          {pending.map((u) => (
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
                <p className="text-[11px] text-gray-500">{formatDate(u.registeredAt)}</p>
              </div>
              <button
                onClick={() => decide(u, 'denied')}
                className="rounded p-1 text-red-600 hover:bg-red-50"
                aria-label={`Disapprove ${u.fullName}`}
                title="Disapprove"
              >
                <X className="size-5" />
              </button>
              <button
                onClick={() => decide(u, 'approved')}
                className="rounded p-1 text-green-600 hover:bg-green-50"
                aria-label={`Approve ${u.fullName}`}
                title="Approve"
              >
                <Check className="size-5" />
              </button>
            </li>
          ))}
          {pending.length === 0 && (
            <li className="rounded border border-dashed border-gray-300 py-10 text-center text-sm text-gray-500">
              No pending registrations.
            </li>
          )}
        </ul>
      </div>
      {viewing && (
        <RegistrationDetails
          user={viewing}
          onApprove={() => decide(viewing, 'approved')}
          onReject={() => decide(viewing, 'denied')}
          onClose={() => setViewing(null)}
        />
      )}
      {decision && <DecisionDialog approved={decision === 'approved'} onClose={() => setDecision(null)} />}
    </div>
  )
}
