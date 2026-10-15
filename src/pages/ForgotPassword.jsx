import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail } from 'lucide-react'
import AuthCard from '../components/AuthCard'
import { BackToLogin, PrimaryButton, TextField } from '../components/Form'
import * as db from '../lib/db'
import { CODE_TTL_MINUTES } from '../lib/db'
import { codeScreenUrl } from '../lib/urlParams'
import BackendNotice from '../components/BackendNotice'
import { errorText } from '../lib/decisions'
import { validateEmail } from '../lib/validation'

/** Frame 4 — Forgot password. */
export default function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const email = String(new FormData(e.currentTarget).get('email') ?? '') // survives autofill
    setEmail(email)
    const formatError = validateEmail(email)
    if (formatError) return setError(formatError)

    const normalized = email.trim().toLowerCase()
    setBusy(true)
    try {
      // The backend answers the same for unknown emails, so this never reveals who has an account.
      const sent = await db.requestPasswordReset(normalized)
      navigate(codeScreenUrl('/reset-code', normalized), {
        state: { email: normalized, expiresAt: sent?.expiresAt ?? Date.now() + CODE_TTL_MINUTES * 60 * 1000 },
      })
    } catch (err) {
      setError(errorText(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthCard title="FORGOT PASSWORD" subtitle="Enter your registered email to reset your password">
      <BackendNotice />
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <TextField
          id="email"
          name="email"
          label="Email"
          required
          icon={Mail}
          type="email"
          autoComplete="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setError('')
          }}
          error={error}
        />
        <div className="text-center">
          <PrimaryButton type="submit" disabled={busy || db.backendMode !== 'live'} className="px-12">
            Submit
          </PrimaryButton>
          <div>
            <BackToLogin />
          </div>
        </div>
      </form>
    </AuthCard>
  )
}
