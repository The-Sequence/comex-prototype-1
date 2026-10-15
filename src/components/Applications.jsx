/* Volunteer applications — the Application Form, the office's List of applicants
 * and the decline confirmation, ported from comex-frontend-v2 (UserHome.jsx and
 * AdminHome.jsx). Data stays in this browser; see src/lib/applications.js. */
import { useEffect, useRef, useState } from 'react'
import { Check, CircleCheck, Users, X } from 'lucide-react'
import { useDialog } from '../lib/useDialog'
import { ALL_UNITS, departmentLabel } from '../config/departments'
import { POSITIONS, VOLUNTEER_ROLES, applicationErrors } from '../lib/applicationErrors'
import { applyToOpportunity, setApplicantStatus } from '../lib/applications'
import { FieldError, Label, OutlineButton, PrimaryButton, TextField } from './Form'

function Modal({ title, subtitle, size = 'max-w-lg', onClose, footer, children, z = 'z-50' }) {
  const dialog = useRef(null)
  useDialog(dialog, onClose)
  return (
    <div className={`fixed inset-0 ${z} flex items-center justify-center bg-black/30 p-4`} onClick={onClose}>
      <div
        ref={dialog}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
        className={`flex max-h-[90vh] w-full ${size} flex-col border border-gray-800 bg-white outline-none shadow-[0_24px_40px_rgba(0,0,0,0.35)]`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-gray-200 px-6 py-4">
          <div className="min-w-0">
            <h2 id="modal-title" className="text-xl font-bold">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-gray-600">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-gray-100">
            <X className="size-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">{footer}</div>}
      </div>
    </div>
  )
}

function SelectField({ id, label, required, error, options, placeholder, helper, ...props }) {
  return (
    <div>
      <Label htmlFor={id} required={required}>{label}</Label>
      <select
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full rounded-sm border bg-white px-2.5 py-2 text-sm outline-none focus:ring-2 disabled:bg-gray-100 disabled:text-gray-600 ${
          error ? 'border-red-500 focus:ring-red-200' : 'border-gray-400 focus:border-navy focus:ring-navy/20'
        }`}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => typeof o === 'string'
          ? <option key={o} value={o}>{o}</option>
          : <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {helper && !error && <p className="mt-1 text-xs text-gray-500">{helper}</p>}
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  )
}

/** A short message in the corner that fades after a few seconds. */
export function Toast({ message, tone = 'success', onDismiss }) {
  // Read through a ref so a parent's inline onDismiss doesn't restart the timer every render.
  const dismiss = useRef(onDismiss)
  useEffect(() => { dismiss.current = onDismiss })
  useEffect(() => {
    if (!message) return undefined
    const timer = setTimeout(() => dismiss.current?.(), 4000)
    return () => clearTimeout(timer)
  }, [message])
  if (!message) return null
  const styles = tone === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-800'
  return (
    <div role="status" className={`fixed bottom-4 right-4 z-[70] flex max-w-sm items-start gap-2 rounded border px-4 py-3 text-sm shadow-lg ${styles}`}>
      {tone !== 'error' && <CircleCheck className="mt-px size-4 shrink-0" />}
      <span>{message}</span>
      <button type="button" onClick={onDismiss} aria-label="Dismiss" className="ml-2"><X className="size-4" /></button>
    </div>
  )
}

/** Volunteer Application Form. Name and department come from the profile and are locked. */
export function ApplicationForm({ opportunity, user, onClose, onSubmitted }) {
  const [position, setPosition] = useState(POSITIONS.includes(user.role) ? user.role : '')
  const [volunteerRole, setVolunteerRole] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')

  const withClear = (field, setter) => (e) => {
    setter(e.target.value)
    setFieldErrors(({ [field]: _, ...rest }) => rest)
  }

  const submit = () => {
    setFormError('')
    const errors = applicationErrors({ fullName: user.fullName, position, department: user.department, volunteerRole })
    setFieldErrors(errors)
    if (Object.keys(errors).length) return
    const result = applyToOpportunity(opportunity.id, user, { position, volunteerRole })
    if (!result.success) return setFormError(result.error ?? 'Could not submit your application.')
    onSubmitted()
  }

  return (
    <Modal
      title="Volunteer Application Form"
      subtitle={opportunity.title}
      onClose={onClose}
      footer={<>
        <OutlineButton type="button" onClick={onClose}>Back</OutlineButton>
        <PrimaryButton type="button" onClick={submit}>Apply</PrimaryButton>
      </>}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <TextField id="apply-name" label="Full Name" required value={user.fullName} disabled error={fieldErrors.fullName} />
          {!fieldErrors.fullName && <p className="mt-1 text-xs text-gray-500">From your profile</p>}
        </div>
        <SelectField id="apply-position" label="Position" required value={position} onChange={withClear('position', setPosition)}
          options={POSITIONS} placeholder="Choose your position" error={fieldErrors.position} />
        <SelectField id="apply-department" label="Department" required value={user.department ?? ''} disabled
          options={ALL_UNITS.map((d) => ({ value: d.code, label: departmentLabel(d) }))} placeholder="e.g. SET, SBA"
          helper="From your profile" error={fieldErrors.department} />
        <SelectField id="apply-role" label="Volunteer Role" required value={volunteerRole} onChange={withClear('volunteerRole', setVolunteerRole)}
          options={VOLUNTEER_ROLES} placeholder="Choose a role" error={fieldErrors.volunteerRole || formError} />
      </div>
      <p className="mt-4 text-xs leading-relaxed text-gray-500">
        Your application is sent to the COMEX Office for review. You will be notified once it has been accepted.
      </p>
    </Modal>
  )
}

function StatusPill({ status }) {
  const styles = {
    Pending: 'bg-amber-50 text-amber-700 border-amber-200',
    Accepted: 'bg-green-50 text-green-700 border-green-200',
    Declined: 'bg-red-50 text-red-700 border-red-200',
  }[status]
  return <span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${styles}`}>{status}</span>
}

function ApplicantActions({ applicant, onDecide, fullWidth = false }) {
  if (applicant.status !== 'Pending') return <span className="text-xs text-gray-500">Decision recorded</span>
  const base = `${fullWidth ? 'flex-1' : 'w-11'} h-11 min-w-11 flex items-center justify-center gap-1.5 rounded-lg border transition-colors cursor-pointer`
  return (
    <div className={`flex gap-2 ${fullWidth ? 'w-full' : ''}`}>
      <button type="button" onClick={() => onDecide(applicant, 'Declined')} aria-label={`Decline ${applicant.fullName}`}
        className={`${base} border-red-200 text-red-600 hover:bg-red-50`}>
        <X className="size-4" />{fullWidth && <span className="text-sm font-semibold">Decline</span>}
      </button>
      <button type="button" onClick={() => onDecide(applicant, 'Accepted')} aria-label={`Accept ${applicant.fullName}`}
        className={`${base} border-green-200 text-green-600 hover:bg-green-50`}>
        <Check className="size-4" />{fullWidth && <span className="text-sm font-semibold">Accept</span>}
      </button>
    </div>
  )
}

const dateApplied = (iso) => iso.slice(0, 10)

/** The office's List of applicants. Accepting is one click; declining asks first. */
export function ApplicantsDialog({ opportunity, applicants, onClose, onToast }) {
  const [pendingDecline, setPendingDecline] = useState(null)

  const commit = (applicant, status) => {
    const result = setApplicantStatus(opportunity.id, applicant.userId, status)
    if (result.success) onToast(`${applicant.fullName} was ${status.toLowerCase()}.`)
    else onToast(result.error ?? 'Could not update the applicant.', 'error')
  }
  const decide = (applicant, status) => (status === 'Declined' ? setPendingDecline(applicant) : commit(applicant, status))

  return (
    <>
      <Modal title="List of applicants" subtitle={opportunity.title} size="max-w-4xl" onClose={pendingDecline ? () => {} : onClose}>
        {applicants.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <Users className="size-8 text-gray-400" />
            <p className="mt-3 font-semibold">No applicants yet</p>
            <p className="mt-1 text-sm text-gray-600">People who apply to this opportunity will appear here.</p>
          </div>
        ) : (<>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="w-10 p-3 text-left font-semibold">#</th>
                  <th className="p-3 text-left font-semibold">Full Name</th>
                  <th className="p-3 text-left font-semibold">Department</th>
                  <th className="p-3 text-left font-semibold">Volunteer Role</th>
                  <th className="p-3 text-left font-semibold">Date Applied</th>
                  <th className="p-3 text-left font-semibold">Status</th>
                  <th className="p-3 text-left font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {applicants.map((a, i) => (
                  <tr key={a.userId} className="border-t border-gray-100">
                    <td className="p-3 text-gray-500">{i + 1}</td>
                    <td className="p-3 font-medium">{a.fullName}</td>
                    <td className="p-3 text-gray-600">{a.department}</td>
                    <td className="p-3 text-gray-600">{a.volunteerRole ?? '—'}</td>
                    <td className="whitespace-nowrap p-3 text-gray-600">{dateApplied(a.appliedAt)}</td>
                    <td className="p-3"><StatusPill status={a.status} /></td>
                    <td className="p-3"><ApplicantActions applicant={a} onDecide={decide} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-3 md:hidden">
            {applicants.map((a) => (
              <div key={a.userId} className="rounded-xl border border-gray-200 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold">{a.fullName}</p>
                  <StatusPill status={a.status} />
                </div>
                <p className="mt-1 text-xs text-gray-500">{a.department} · {a.volunteerRole ?? '—'}</p>
                <p className="mt-0.5 text-xs text-gray-500">Applied {dateApplied(a.appliedAt)}</p>
                <div className="mt-3"><ApplicantActions applicant={a} onDecide={decide} fullWidth /></div>
              </div>
            ))}
          </div>
        </>)}
      </Modal>
      {pendingDecline && (
        <Modal
          title="Decline this applicant?"
          size="max-w-md"
          z="z-[60]"
          onClose={() => setPendingDecline(null)}
          footer={<>
            <OutlineButton type="button" onClick={() => setPendingDecline(null)}>Cancel</OutlineButton>
            <PrimaryButton type="button" className="!bg-red-600 hover:!bg-red-700"
              onClick={() => { commit(pendingDecline, 'Declined'); setPendingDecline(null) }}>
              Decline applicant
            </PrimaryButton>
          </>}
        >
          <p className="text-sm leading-relaxed text-gray-700">
            <span className="font-semibold">{pendingDecline.fullName}</span> will not be accepted for{' '}
            <span className="font-semibold">{opportunity.title}</span>. The decision is recorded straight away and cannot be changed here afterwards.
          </p>
        </Modal>
      )}
    </>
  )
}
