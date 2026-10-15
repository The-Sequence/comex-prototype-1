import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, CircleAlert, Eye, EyeOff, CheckCircle2 } from 'lucide-react'

export function Label({ htmlFor, children, required }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-sm font-semibold text-gray-900">
      {children}
      {required && <span className="text-red-600">*</span>}
    </label>
  )
}

export function FieldError({ id, children }) {
  if (!children) return null
  return (
    <p id={id} className="mt-1 text-xs text-red-600" role="alert">
      {children}
    </p>
  )
}

const inputClass = (error) =>
  `w-full rounded-sm border bg-white py-2 text-sm outline-none transition placeholder:text-gray-400 focus:ring-2 ${
    error ? 'border-red-500 focus:ring-red-200' : 'border-gray-400 focus:border-navy focus:ring-navy/20'
  }`

/** Text input with optional leading icon and inline error. */
export function TextField({ id, label, required, error, icon: Icon, className = '', ...props }) {
  return (
    <div className={className}>
      {label && (
        <Label htmlFor={id} required={required}>
          {label}
        </Label>
      )}
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-gray-700" />}
        <input
          id={id}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`${inputClass(error)} ${Icon ? 'pl-8' : 'pl-2.5'} pr-2.5`}
          {...props}
        />
      </div>
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  )
}

/** Password input with the show/hide eye toggle from the Figma frames. */
export function PasswordField({ id, label, required, error, icon: Icon, className = '', ...props }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className={className}>
      {label && (
        <Label htmlFor={id} required={required}>
          {label}
        </Label>
      )}
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-gray-700" />}
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`${inputClass(error)} ${Icon ? 'pl-8' : 'pl-2.5'} pr-9`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-700 hover:text-navy"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
        </button>
      </div>
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  )
}

export function PrimaryButton({ children, className = '', ...props }) {
  return (
    <button
      className={`rounded-full bg-navy px-8 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-navy-dark disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function OutlineButton({ children, className = '', ...props }) {
  return (
    <button
      className={`rounded-full border border-gray-400 bg-white px-8 py-2 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function BackToLogin() {
  return (
    <Link to="/login" className="mt-3 inline-flex items-center text-xs text-gray-800 hover:text-navy hover:underline">
      <ChevronLeft className="size-3.5" /> Back to login
    </Link>
  )
}

/** Banner for form-level errors / notices (e.g. "Invalid email or password"). */
export function Alert({ tone = 'error', children }) {
  if (!children) return null
  const styles =
    tone === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-800'
  const Icon = tone === 'error' ? CircleAlert : CheckCircle2
  return (
    <div className={`mb-4 flex items-start gap-2 rounded-sm border px-3 py-2 text-xs ${styles}`} role="alert">
      <Icon className="mt-px size-4 shrink-0" />
      <div>{children}</div>
    </div>
  )
}
