import { useEffect, useRef } from 'react'
import { Check } from 'lucide-react'
import logo from '../assets/comex-logo.png'

/** Frame 8 result dialog shown after the office approves or disapproves an account. */
export default function DecisionDialog({ approved, onClose }) {
  const okay = useRef(null)
  useEffect(() => {
    okay.current?.focus()
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const title = approved ? 'Account Approved!' : 'Account Disapproved!'
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="decision-title"
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-sm flex-col items-center border border-gray-800 bg-white px-8 py-8 text-center shadow-[0_24px_40px_rgba(0,0,0,0.35)]"
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
        <p className="mt-8 text-lg leading-snug">The user will be notified through their registered email address.</p>
        <button
          ref={okay}
          onClick={onClose}
          className="mt-14 w-40 rounded-full bg-sidebar py-2 text-lg font-medium text-white shadow-lg hover:bg-navy-dark"
        >
          Okay
        </button>
      </div>
    </div>
  )
}
