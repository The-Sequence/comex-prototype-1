import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import AuthCard from '../components/AuthCard'
import { BackToLogin, PasswordField, PrimaryButton } from '../components/Form'
import { updatePassword } from '../lib/db'
import { validateConfirm, validatePassword } from '../lib/validation'
import { RESET_GRANT_KEY } from './EnterCode'

function readGrant() {
  try {
    const grant = JSON.parse(sessionStorage.getItem(RESET_GRANT_KEY))
    return grant && Date.now() < grant.expiresAt ? grant : null
  } catch {
    return null
  }
}

/** Frame 6 — Reset password. Only reachable right after a valid reset code. */
export default function ResetPassword() {
  const navigate = useNavigate()
  const [grant] = useState(readGrant)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState({})

  if (!grant) return <Navigate to="/forgot-password" replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    const next = { password: validatePassword(password), confirm: validateConfirm(password, confirm) }
    setErrors(next)
    if (next.password || next.confirm) return

    await updatePassword(grant.email, password)
    sessionStorage.removeItem(RESET_GRANT_KEY) // one reset per code
    navigate('/reset-success', { replace: true })
  }

  return (
    <AuthCard title="Reset Password" subtitle="You may now reset your password. Enter a new one below.">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <PasswordField
          id="password"
          label="New password"
          autoComplete="new-password"
          placeholder="Enter new password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        <PasswordField
          id="confirm"
          label="Confirm new password"
          autoComplete="new-password"
          placeholder="Confirm new password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={errors.confirm}
        />
        <p className="text-[11px] text-gray-500">At least 8 characters with an uppercase letter, a lowercase letter and a number.</p>
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
