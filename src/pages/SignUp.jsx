import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, X } from 'lucide-react'
import AuthCard from '../components/AuthCard'
import { Alert, FieldError, Label, OutlineButton, PasswordField, PrimaryButton, TextField } from '../components/Form'
import { DEPARTMENTS, SIGNUP_ROLES, createUser, issueCode } from '../lib/db'
import {
  PASSWORD_RULES,
  validateConfirm,
  validateEmail,
  validateFullName,
  validatePassword,
} from '../lib/validation'

const EMPTY = { fullName: '', department: '', email: '', password: '', confirm: '', role: '', otherRole: '' }

function validate(form) {
  return {
    fullName: validateFullName(form.fullName),
    department: form.department ? '' : 'Select your department.',
    email: validateEmail(form.email),
    password: validatePassword(form.password),
    confirm: validateConfirm(form.password, form.confirm),
    role: !form.role
      ? 'Select your role.'
      : form.role === 'Others' && !form.otherRole.trim()
        ? 'Please specify your role.'
        : '',
  }
}

/** Frame 2 — Create account. */
export default function SignUp() {
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState(false)
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)

  const update = (field) => (e) => {
    const next = { ...form, [field]: e.target.value }
    setForm(next)
    if (touched) setErrors(validate(next)) // live re-validation after the first submit
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setTouched(true)
    setFormError('')
    const next = validate(form)
    setErrors(next)
    if (Object.values(next).some(Boolean)) return

    setBusy(true)
    try {
      const user = await createUser({
        fullName: form.fullName,
        department: form.department,
        email: form.email,
        password: form.password,
        role: form.role === 'Others' ? form.otherRole.trim() : form.role,
      })
      issueCode(user.email, 'verify')
      navigate('/verify-email', { state: { email: user.email } })
    } catch (err) {
      setFormError(err.message)
      setErrors((prev) => ({ ...prev, email: err.message }))
    } finally {
      setBusy(false)
    }
  }

  const roleOptions = [...SIGNUP_ROLES, 'Others']

  return (
    <AuthCard title="CREATE ACCOUNT" wide>
      <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
        <Alert>{formError}</Alert>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1.4fr_1fr]">
          <TextField
            id="fullName"
            label="Full Name"
            required
            placeholder="Ln, Fn, MI"
            autoComplete="name"
            value={form.fullName}
            onChange={update('fullName')}
            error={errors.fullName}
          />
          <div>
            <Label htmlFor="department" required>
              Department
            </Label>
            <select
              id="department"
              value={form.department}
              onChange={update('department')}
              aria-invalid={!!errors.department}
              className={`w-full rounded-sm border bg-white px-2 py-2 text-sm outline-none focus:ring-2 ${
                errors.department ? 'border-red-500 focus:ring-red-200' : 'border-gray-400 focus:ring-navy/20'
              } ${form.department ? '' : 'text-gray-400'}`}
            >
              <option value="">Select one</option>
              {DEPARTMENTS.map((d) => (
                <option key={d.code} value={d.code} title={d.name} className="text-gray-900">
                  {d.code}
                </option>
              ))}
            </select>
            <FieldError>{errors.department}</FieldError>
          </div>
        </div>

        <TextField
          id="email"
          label="Email"
          required
          type="email"
          autoComplete="email"
          placeholder="Enter your email"
          value={form.email}
          onChange={update('email')}
          error={errors.email}
        />

        <div className="space-y-2">
          <PasswordField
            id="password"
            label="Create Password"
            required
            autoComplete="new-password"
            placeholder="Create your password"
            value={form.password}
            onChange={update('password')}
            error={errors.password}
          />
          {form.password && (
            <ul className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px]">
              {PASSWORD_RULES.map((rule) => {
                const ok = rule.test(form.password)
                return (
                  <li key={rule.label} className={`flex items-center gap-1 ${ok ? 'text-green-700' : 'text-gray-500'}`}>
                    {ok ? <Check className="size-3" /> : <X className="size-3" />} {rule.label}
                  </li>
                )
              })}
            </ul>
          )}
          <PasswordField
            id="confirm"
            autoComplete="new-password"
            placeholder="Confirm your password"
            value={form.confirm}
            onChange={update('confirm')}
            error={errors.confirm}
          />
        </div>

        <fieldset>
          <legend className="mb-1 text-sm font-semibold text-gray-900">
            Role<span className="text-red-600">*</span>
          </legend>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs sm:grid-cols-3">
            {roleOptions.map((role) => (
              <label key={role} className="flex cursor-pointer items-center gap-1.5">
                <input
                  type="radio"
                  name="role"
                  value={role}
                  checked={form.role === role}
                  onChange={update('role')}
                  className="accent-navy"
                />
                {role}
              </label>
            ))}
          </div>
          {form.role === 'Others' && (
            <input
              aria-label="Specify your role"
              placeholder="Specify your role"
              value={form.otherRole}
              onChange={update('otherRole')}
              className="mt-2 w-full border-b border-gray-400 py-1 text-xs outline-none focus:border-navy"
            />
          )}
          <FieldError>{errors.role}</FieldError>
        </fieldset>

        <p className="text-[11px] italic leading-snug text-gray-700">
          <span className="font-semibold">Note:</span> After registration, your account will be reviewed and approved by
          the admin before you can access the system.
        </p>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <OutlineButton type="button" onClick={() => navigate('/login')}>
            Back
          </OutlineButton>
          <PrimaryButton type="submit" disabled={busy}>
            {busy ? 'Creating…' : 'Done'}
          </PrimaryButton>
        </div>
      </form>
    </AuthCard>
  )
}
