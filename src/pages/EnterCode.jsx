import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import AuthCard from '../components/AuthCard'
import CodeInput from '../components/CodeInput'
import { Alert, BackToLogin, PrimaryButton } from '../components/Form'
import { activeCodeExpiry, checkCode, issueCode, markEmailVerified } from '../lib/db'
import { validateCode } from '../lib/validation'

export const RESET_GRANT_KEY = 'comex-reset-grant'

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
  const { state } = useLocation()
  const navigate = useNavigate()
  const email = state?.email
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [expiresAt, setExpiresAt] = useState(() => (email ? activeCodeExpiry(email, purpose) : null))
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  if (!email) return <Navigate to="/login" replace />

  const expired = !expiresAt || now > expiresAt

  const handleSubmit = (e) => {
    e.preventDefault()
    setNotice('')
    const formatError = validateCode(code)
    if (formatError) return setError(formatError)

    const result = checkCode(email, purpose, code)
    if (!result.ok) return setError(result.reason)

    if (purpose === 'verify') {
      markEmailVerified(email)
      navigate('/registration-success', { replace: true })
    } else {
      // Short-lived permission to open the reset-password screen.
      sessionStorage.setItem(RESET_GRANT_KEY, JSON.stringify({ email, expiresAt: Date.now() + 10 * 60 * 1000 }))
      navigate('/reset-password', { replace: true })
    }
  }

  const resend = () => {
    setExpiresAt(issueCode(email, purpose))
    setCode('')
    setError('')
    setNotice(`A new code was sent to ${email}.`)
  }

  return (
    <AuthCard title="Enter Verification Code">
      <p className="-mt-3 mb-5 text-center text-xs text-gray-700">
        Enter the 6-digit code sent to <span className="font-semibold">{email}</span>.
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
          {expired ? (
            <span className="text-red-600">Code expired.</span>
          ) : (
            <>Code expires in {formatRemaining(expiresAt - now)}.</>
          )}{' '}
          <button type="button" onClick={resend} className="font-semibold text-navy underline">
            Resend code
          </button>
        </p>
        <div className="mt-6 text-center">
          <PrimaryButton type="submit" className="px-12">
            Verify
          </PrimaryButton>
          <div>
            <BackToLogin />
          </div>
        </div>
      </form>
    </AuthCard>
  )
}
