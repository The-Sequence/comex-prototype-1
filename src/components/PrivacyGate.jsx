import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import AuthCard from './AuthCard'
import { PrimaryButton } from './Form'
import {
  ACCESS_NOTE,
  ACCOUNT_DATA,
  DATA_PRIVACY_ACT_URL,
  FUTURE_DATA,
  RIGHTS_NOTE,
  SHARING,
  acknowledge,
  hasAcknowledged,
} from '../lib/privacy'

function safeStorage() {
  try {
    return window.localStorage
  } catch {
    return { getItem: () => null, setItem: () => {} }
  }
}

/** Layout route: shows the privacy acknowledgement before any account screen. */
export default function PrivacyGate() {
  const [done, setDone] = useState(() => hasAcknowledged(safeStorage()))
  const [checked, setChecked] = useState(false)

  if (done) return <Outlet />

  const proceed = () => {
    acknowledge(safeStorage())
    setDone(true)
  }

  return (
    <AuthCard title="BEFORE YOU CONTINUE" subtitle="How COMEX handles your personal data" wide>
      <div className="max-h-[48vh] space-y-3 overflow-y-auto pr-1 text-xs leading-relaxed text-gray-800">
        <p>
          COMEX collects personal information when you create an account. This notice is guided by
          Republic Act No. 10173, the Data Privacy Act of 2012.{' '}
          <a
            href={DATA_PRIVACY_ACT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 font-semibold text-navy underline"
          >
            Read the Act <ExternalLink className="size-3" aria-hidden="true" />
          </a>
        </p>
        <div>
          <h2 className="font-bold">What this account system collects</h2>
          <ul className="mt-1 list-disc space-y-1 pl-4">
            {ACCOUNT_DATA.map(([what, why]) => (
              <li key={what}>
                <span className="font-semibold">{what}</span> — {why}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-bold">Not collected yet</h2>
          <p className="mt-1">
            The full COMEX system will later handle {FUTURE_DATA.join(', ').toLowerCase()}. None of that is collected
            through these account screens. You will be told before any of it is, and what it is used for.
          </p>
        </div>
        <div>
          <h2 className="font-bold">Who handles and sees it</h2>
          <ul className="mt-1 list-disc space-y-1 pl-4">
            {SHARING.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <p className="mt-1">{ACCESS_NOTE}</p>
        </div>
        <p>{RIGHTS_NOTE}</p>
      </div>
      <label className="mt-4 flex cursor-pointer items-start gap-2 text-xs">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="mt-0.5 accent-navy"
        />
        <span>I have read this notice and understand how my account information is used.</span>
      </label>
      <PrimaryButton type="button" disabled={!checked} onClick={proceed} className="mt-4 w-full">
        Continue
      </PrimaryButton>
    </AuthCard>
  )
}
