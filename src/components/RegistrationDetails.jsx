import { useEffect } from 'react'
import { X } from 'lucide-react'
import { DEPARTMENTS } from '../lib/db'
import { formatDate } from '../lib/useUsers'

/** Frame 8 "Registration Details" window, opened by clicking a name in Pending Approvals. */
export default function RegistrationDetails({ user, onApprove, onReject, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const department = DEPARTMENTS.find((d) => d.code === user.department)?.name ?? user.department
  const rows = [
    ['Name:', user.fullName],
    ['Department:', department],
    ['Email Address:', user.email],
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="details-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg border border-gray-800 bg-white px-8 py-8 shadow-[0_24px_40px_rgba(0,0,0,0.35)]"
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded p-1 text-gray-700 hover:bg-gray-100 hover:text-black"
          aria-label="Close"
        >
          <X className="size-6" />
        </button>
        <h2 id="details-title" className="text-center text-3xl font-bold italic">
          Registration Details
        </h2>
        <p className="mt-1 text-center text-sm font-bold italic">Date Registered: {formatDate(user.registeredAt)}</p>
        <p className="mt-8 text-center text-3xl font-bold italic">{user.role}</p>

        <dl className="mt-8 grid grid-cols-[auto_1fr] gap-x-6 gap-y-5 text-lg">
          {rows.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="font-bold">{label}</dt>
              <dd className="break-words text-center">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-14 flex flex-col items-center gap-4">
          <button
            onClick={onApprove}
            className="w-60 rounded-full bg-sidebar py-3 text-xl font-medium text-white shadow-lg hover:bg-navy-dark"
          >
            Approve
          </button>
          <button
            onClick={onReject}
            className="w-60 rounded-full border border-gray-200 bg-white py-3 text-xl font-medium text-red-600 shadow-[0_6px_14px_rgba(0,0,0,0.25)] hover:bg-red-50"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  )
}
