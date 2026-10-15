import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import AuthCard from '../components/AuthCard'
import CodeInput from '../components/CodeInput'
import { Alert, BackToLogin, PrimaryButton } from '../components/Form'
import * as db from '../lib/db'
import { errorText } from '../lib/decisions'
import { CODE_LENGTH } from '../config/otp'
import { validateCode } from '../lib/validation'
import { emailFromSearch } from '../lib/urlParams'

export const RESET_GRANT_KEY = 'comex-reset-grant'
// Supabase sends at most one auth email a minute per address; resending sooner only hits the rate limit.
const RESEND_COOLDOWN_MS = 60 * 1000

const formatRemaining = (ms) => {
  const total = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

/**
 * Frame 5 — Enter verification code.
 * purpose="verify": email verification after sign-up  -> Frame 3
 * purpose="reset":  password-reset code               -> Frame 6
 */
export default function EnterCode({ purpose }) {
  const { state, search } = useLocation()
  const navigate = useNavigate()
  // State from the previous screen, else the ?email= prefill (reload / email link). Neither grants access.
  const email = state?.email ?? emailFromSearch(search)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  // A code was just sent when we arrive from the previous screen, so the countdown starts right away.
  const [cooldownUntil, setCooldownUntil] = useState(() => (state?.expiresAt ? Date.now() + RESEND_COOLDOWN_MS : 0))
  const [expiresAt, setExpiresAt] = useState(state?.expiresAt ?? null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  if (!email) return <Navigate to="/login" replace />

  const expired = expiresAt !== null && now > expiresAt
  const cooldownLeft = Math.max(0, Math.ceil((cooldownUntil - now) / 1000))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setNotice('')
    const formatError = validateCode(code)
    if (formatError) return setError(formatError)

    setBusy(true)
    try {
      const result =
        purpose === 'verify' ? await db.verifySignupCode(email, code) : await db.verifyResetCode(email, code)
      if (!result.ok) return setError(result.reason)

      if (purpose === 'verify') {
        navigate('/registration-success', { replace: true })
      } else {
        // The backend now holds a recovery session for the next screen only; this marker just gates the route.
        sessionStorage.setItem(RESET_GRANT_KEY, JSON.stringify({ email, expiresAt: Date.now() + 10 * 60 * 1000 }))
        navigate('/reset-password', { replace: true })
      }
    } catch (err) {
      setError(errorText(err))
    } finally {
      setBusy(false)
    }
  }

  const resend = async () => {
    if (Date.now() < cooldownUntil) return setError('Please wait a moment before requesting another code.')
    setCooldownUntil(Date.now() + RESEND_COOLDOWN_MS)
    setNotice('')
    try {
      const sent = purpose === 'verify' ? await db.resendSignupCode(email) : await db.requestPasswordReset(email)
      setExpiresAt(sent?.expiresAt ?? Date.now() + db.CODE_TTL_MINUTES * 60 * 1000)
      setCode('')
      setError('')
      setNotice(`A new code was sent to ${email}.`)
    } catch (err) {
      setError(errorText(err))
    }
  }

  return (
    <AuthCard title="Enter Verification Code">
      <p className="-mt-3 mb-5 text-center text-xs text-gray-700">
        Enter the {CODE_LENGTH}-digit code sent to <span className="font-semibold">{email}</span>.
        <br />
        Check your inbox or spam folder.
      </p>
      <form onSubmit={handleSubmit} noValidate>
        <Alert tone="success">{notice}</Alert>
        <CodeInput
          value={code}
          onChange={(v) => {
            setCode(v)
            setError('')
          }}
          error={error}
        />
        {error && (
          <p className="mt-2 text-center text-xs text-red-600" role="alert">
            {error}
          </p>
        )}
        <p className="mt-3 text-center text-[11px] text-gray-600">
          {expiresAt === null ? (
            <>Codes expire {db.CODE_TTL_MINUTES} minutes after sending.</>
          ) : expired ? (
            <span className="text-red-600">Code expired.</span>
          ) : (
            <>Code expires in {formatRemaining(expiresAt - now)}.</>
          )}{' '}
          <button type="button" onClick={resend} disabled={cooldownLeft > 0}
            className="font-semibold text-navy underline disabled:cursor-not-allowed disabled:text-gray-500 disabled:no-underline">
            {cooldownLeft > 0 ? `Resend code in ${cooldownLeft}s` : 'Resend code'}
          </button>
        </p>
        <div className="mt-6 text-center">
          <PrimaryButton type="submit" disabled={busy} className="px-12">
            {busy ? 'Verifying…' : 'Verify'}
          </PrimaryButton>
          <div>
            <BackToLogin />
          </div>
        </div>
      </form>
    </AuthCard>
  )
}
