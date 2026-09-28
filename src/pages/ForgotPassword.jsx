import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail } from 'lucide-react'
import AuthCard from '../components/AuthCard'
import { BackToLogin, PrimaryButton, TextField } from '../components/Form'
import { findUserByEmail, issueCode } from '../lib/db'
import { validateEmail } from '../lib/validation'

/** Frame 4 — Forgot password. */
export default function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const email = String(new FormData(e.currentTarget).get('email') ?? '') // survives autofill
    setEmail(email)
    const formatError = validateEmail(email)
    if (formatError) return setError(formatError)
    if (!findUserByEmail(email)) return setError('No account is registered with this email.')

    const normalized = email.trim().toLowerCase()
    issueCode(normalized, 'reset')
    navigate('/reset-code', { state: { email: normalized } })
  }

  return (
    <AuthCard title="FORGOT PASSWORD" subtitle="Enter your registered email to reset your password">
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
          <PrimaryButton type="submit" className="px-12">
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
