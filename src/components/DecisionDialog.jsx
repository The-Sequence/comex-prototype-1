import { useRef, useState } from 'react'
import { Check } from 'lucide-react'
import logo from '../assets/comex-logo.png'
import { useDialog } from '../lib/useDialog'
import { emailOutcome } from '../lib/decisions'

/**
 * Frame 8 result dialog shown after the office approves or disapproves an
 * account. `emailStatus` is the adapter's result; when the notice email
 * failed, Retry calls onRetry (which resolves to the new status).
 */
export default function DecisionDialog({ approved, emailStatus = 'sent', onRetry, onClose }) {
  const dialog = useRef(null)
  const okay = useRef(null)
  const [status, setStatus] = useState(emailStatus)
  const [retrying, setRetrying] = useState(false)
  const [retryError, setRetryError] = useState('')
  useDialog(dialog, onClose, okay)

  const outcome = emailOutcome(status)
  const retry = async () => {
    setRetrying(true)
    setRetryError('')
    try {
      setStatus(await onRetry())
    } catch (err) {
      setRetryError(err?.message || 'The email could not be sent. Try again later.')
    } finally {
      setRetrying(false)
    }
  }

  const title = approved ? 'Account Approved!' : 'Account Disapproved!'
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div
        ref={dialog}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="decision-title"
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-sm flex-col outline-none items-center border border-gray-800 bg-white px-8 py-8 text-center shadow-[0_24px_40px_rgba(0,0,0,0.35)]"
      >
        <img src={logo} alt="NU Fairview Community Extension Office" className="h-14 w-auto" />
        {approved ? (
          <Check className="mt-10 size-14 stroke-[1.5]" aria-hidden="true" />
        ) : (
          <span className="mt-10 flex size-12 items-center justify-center rounded-full bg-gray-900 text-3xl font-black text-white" aria-hidden="true">
            !
          </span>
        )}
        <h2 id="decision-title" className="mt-5 text-2xl font-bold italic">
          {title}
        </h2>
        <p className={`mt-8 text-lg leading-snug ${outcome.ok ? '' : 'text-red-700'}`} role={outcome.ok ? undefined : 'alert'}>
          {outcome.text}
        </p>
        {retryError && <p className="mt-2 text-sm text-red-700">{retryError}</p>}
        {!outcome.ok && !outcome.inProgress && onRetry && (
          <button
            onClick={retry}
            disabled={retrying}
            className="mt-4 rounded-full border border-sidebar px-6 py-1.5 text-sm font-semibold text-sidebar hover:bg-canvas disabled:opacity-60"
          >
            {retrying ? 'Sending…' : 'Retry email'}
          </button>
        )}
        <button
          ref={okay}
          onClick={onClose}
          className="mt-10 w-40 rounded-full bg-sidebar py-2 text-lg font-medium text-white shadow-lg hover:bg-navy-dark"
        >
          Okay
        </button>
      </div>
    </div>
  )
}
