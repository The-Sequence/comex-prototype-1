import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Mail, KeyRound } from 'lucide-react'
import AuthCard from '../components/AuthCard'
import { Alert, PasswordField, PrimaryButton, TextField } from '../components/Form'
import { useAuth } from '../context/AuthContext'
import { dashboardPathFor } from '../config/navigation'
import { issueCode, resetDb } from '../lib/db'
import { validateEmail } from '../lib/validation'

/** Frame 1 — Login page. */
export default function Login() {
  const { user, signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to={dashboardPathFor(user)} replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    // Read the fields straight from the form: browser / password-manager
    // autofill can change them without React seeing an input event.
    const data = new FormData(e.currentTarget)
    const email = String(data.get('email') ?? '')
    const password = String(data.get('password') ?? '')
    setEmail(email)
    setPassword(password)
    const next = { email: validateEmail(email), password: password ? '' : 'Password is required.' }
    setErrors(next)
    setFormError(null)
    if (next.email || next.password) return

    setBusy(true)
    const result = await signIn(email, password)
    setBusy(false)
    if (result.user) return navigate(dashboardPathFor(result.user), { replace: true })
    setFormError(result)
  }

  const resendVerification = () => {
    issueCode(email, 'verify')
    navigate('/verify-email', { state: { email: email.trim().toLowerCase() } })
  }

  const handleReset = async () => {
    if (!window.confirm('Reset demo data? Accounts created during the demo will be removed.')) return
    await resetDb()
    setFormError(null)
  }

  return (
    <AuthCard title="LOGIN PAGE">
      <p className="-mt-3 mb-4 text-center text-[11px] italic text-gray-700">
        Disclaimer: This system is intended for COMEX use only
      </p>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Alert>
          {formError && (
            <>
              {formError.error}
              {formError.code === 'unverified' && (
                <button type="button" onClick={resendVerification} className="ml-1 font-semibold underline">
                  Send a new code
                </button>
              )}
            </>
          )}
        </Alert>
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
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <div>
          <PasswordField
            id="password"
            name="password"
            label="Password"
            required
            icon={KeyRound}
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />
          <div className="mt-1 text-right">
            <Link to="/forgot-password" className="text-[11px] font-semibold text-navy underline">
              Forgot password?
            </Link>
          </div>
        </div>
        <div className="pt-2 text-center">
          <PrimaryButton type="submit" disabled={busy} className="px-12">
            {busy ? 'Logging in…' : 'Log in'}
          </PrimaryButton>
          <div className="mt-3">
            <Link to="/signup" className="text-[11px] font-semibold text-navy underline">
              Don’t have an account?
            </Link>
          </div>
        </div>
      </form>
      <button
        type="button"
        onClick={handleReset}
        className="mx-auto mt-6 block text-[10px] text-gray-400 hover:text-gray-600 hover:underline"
      >
        Reset demo data
      </button>
    </AuthCard>
  )
}
