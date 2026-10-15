import { useRef, useState } from 'react'
import { useDialog } from '../lib/useDialog'
import { MAX_REASON_LENGTH, validateReason } from '../lib/decisions'

/**
 * Confirms an approve / reject decision. The reason is optional: left blank,
 * the user gets the generic notice. onConfirm(reason) resolves when saved.
 */
export default function ReasonDialog({ user, approved, onConfirm, onClose }) {
  const dialog = useRef(null)
  const field = useRef(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useDialog(dialog, busy ? () => {} : onClose, field)

  const submit = async (e) => {
    e.preventDefault()
    const invalid = validateReason(reason)
    if (invalid) return setError(invalid)
    setBusy(true)
    setError('')
    try {
      await onConfirm(approved ? '' : reason.trim())
    } catch (err) {
      setError(err?.message || 'The decision could not be saved. Please try again.')
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4" onClick={busy ? undefined : onClose}>
      <form
        ref={dialog}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reason-title"
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md border border-gray-800 bg-white px-7 py-7 outline-none shadow-[0_24px_40px_rgba(0,0,0,0.35)]"
      >
        <h2 id="reason-title" className="text-xl font-bold">
          {approved ? 'Approve' : 'Reject'} {user.fullName}?
        </h2>
        <p className="mt-2 text-sm text-gray-700">
          An email will tell {user.email} the result.
          {approved ? '' : ' Add a reason if you want it included; otherwise a generic message is sent.'}
        </p>
        {!approved && (<>
        <label htmlFor="decision-reason" className="mt-4 block text-sm font-semibold">
          Reason <span className="font-normal text-gray-500">(optional)</span>
        </label>
        <textarea
          id="decision-reason"
          ref={field}
          rows={3}
          maxLength={MAX_REASON_LENGTH}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="mt-1 w-full rounded-sm border border-gray-400 p-2 text-sm outline-none focus:ring-2 focus:ring-navy/20"
        />
        <p className="text-right text-[11px] text-gray-500">
          {reason.length}/{MAX_REASON_LENGTH}
        </p>
        </>)}
        {error && (
          <p className="mt-1 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-full border border-gray-400 py-2 font-medium hover:bg-canvas disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className={`rounded-full py-2 font-medium text-white disabled:opacity-60 ${approved ? 'bg-sidebar hover:bg-navy-dark' : 'bg-red-600 hover:bg-red-700'}`}
          >
            {busy ? 'Saving…' : approved ? 'Approve' : 'Reject'}
          </button>
        </div>
      </form>
    </div>
  )
}
