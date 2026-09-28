import { Link } from 'react-router-dom'
import { Check, ChevronLeft, Clock } from 'lucide-react'
import AuthCard from '../components/AuthCard'

function BackToLoginButton() {
  return (
    <Link
      to="/login"
      className="inline-flex items-center rounded-full bg-navy px-5 py-2 text-sm font-semibold text-white hover:bg-navy-dark"
    >
      <ChevronLeft className="size-4" /> Back to Login
    </Link>
  )
}

/** Frame 3 — After registration. */
export function RegistrationSuccess() {
  return (
    <AuthCard>
      <div className="text-center">
        <Clock className="mx-auto size-12 stroke-[1.5] text-gray-900" />
        <h1 className="mt-4 text-lg font-extrabold italic">Registration successful!</h1>
        <p className="mt-5 text-sm font-medium">Your account is now pending approval</p>
        <p className="mt-1 text-xs text-gray-700">Please wait while the admin reviews your account and role.</p>
        <p className="mt-5 text-[11px] italic text-gray-700">
          <span className="font-semibold">Note:</span> You will be able to log in once your account is approved.
        </p>
        <div className="mt-6">
          <BackToLoginButton />
        </div>
      </div>
    </AuthCard>
  )
}

/** Frame 6b — Password reset successful. */
export function ResetSuccess() {
  return (
    <AuthCard>
      <div className="text-center">
        <Check className="mx-auto size-14 stroke-1 text-gray-900" />
        <h1 className="mt-4 text-lg font-extrabold italic">Password reset successful!</h1>
        <p className="mt-4 text-sm">You may now log in with your new password.</p>
        <div className="mt-10">
          <BackToLoginButton />
        </div>
      </div>
    </AuthCard>
  )
}
