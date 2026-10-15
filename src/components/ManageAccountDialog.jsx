import { useRef, useState } from 'react'
import { X } from 'lucide-react'
import * as db from '../lib/db'
import { useDialog } from '../lib/useDialog'
import { changesFrom, editableFields, roleOptions, validateManage } from '../lib/accountRules'
import { errorText } from '../lib/decisions'
import { unitShort } from '../config/departments'
import { FieldError } from './Form'

const inputClass = (error) =>
  `w-full rounded-sm border bg-white px-2 py-2 text-sm outline-none focus:ring-2 disabled:bg-gray-100 disabled:text-gray-500 ${
    error ? 'border-red-500 focus:ring-red-200' : 'border-gray-400 focus:ring-navy/20'
  }`

/**
 * COMEX Head: manage one account — name, email, role and active/inactive.
 * Fields the server would refuse (own role/status, privileged accounts) are
 * shown disabled with a reason.
 */
export default function ManageAccountDialog({ actor, user, onSaved, onClose }) {
  const dialog = useRef(null)
  const first = useRef(null)
  const fields = editableFields(actor, user)
  const [form, setForm] = useState({
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    active: user.status === 'approved',
  })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  useDialog(dialog, busy ? () => {} : onClose, first)

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  const note =
    actor.id === user.id
      ? 'This is your own account: only the name can be changed.'
      : !fields.role
        ? 'Role, status and email of this account type are managed outside this screen.'
        : ''

  const submit = async (e) => {
    e.preventDefault()
    const found = validateManage(form, fields)
    setErrors(found)
    if (Object.keys(found).length) return
    const changes = changesFrom(user, form, fields)
    if (Object.keys(changes).length === 0) return onClose()
    setBusy(true)
    setFormError('')
    let saved = ''
    try {
      const { email, ...profile } = changes
      if (Object.keys(profile).length) await db.updateAccount(user.id, profile)
      saved = Object.keys(profile).length ? 'Name, role or status saved. ' : ''
      if (email) await db.changeAccountEmail(user.id, email)
      const notify = 'role' in profile || 'active' in profile
      const mailed = notify ? await db.notifyAccountChange(user.id) : 'sent'
      onSaved(
        `${user.fullName}'s account was updated.` +
          (mailed === 'sent' ? '' : ' The notice email could not be sent; the change itself is saved.'),
      )
    } catch (err) {
      setFormError(`${saved}${errorText(err)}`)
      setBusy(false)
      if (saved) onSaved(null) // refresh the list behind the dialog; it stays open
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={busy ? undefined : onClose}>
      <form
        ref={dialog}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="manage-title"
        onSubmit={submit}
        noValidate
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md border border-gray-800 bg-white px-7 py-7 outline-none shadow-[0_24px_40px_rgba(0,0,0,0.35)]"
      >
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="absolute right-3 top-3 rounded p-1 text-gray-700 hover:bg-gray-100"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>
        <h2 id="manage-title" className="text-xl font-bold">
          Manage account
        </h2>
        {note && <p className="mt-1 text-xs text-gray-600">{note}</p>}

        <div className="mt-4 space-y-3">
          <div>
            <label htmlFor="m-name" className="mb-1 block text-sm font-semibold">
              Full name
            </label>
            <input id="m-name" ref={first} value={form.fullName} onChange={set('fullName')} disabled={!fields.name || busy} className={inputClass(errors.fullName)} />
            <FieldError>{errors.fullName}</FieldError>
          </div>
          <div>
            <label htmlFor="m-email" className="mb-1 block text-sm font-semibold">
              Email
            </label>
            <input id="m-email" type="email" value={form.email} onChange={set('email')} disabled={!fields.email || busy} className={inputClass(errors.email)} />
            <FieldError>{errors.email}</FieldError>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="m-role" className="mb-1 block text-sm font-semibold">
                Role
              </label>
              <select id="m-role" value={form.role} onChange={set('role')} disabled={!fields.role || busy} className={inputClass()}>
                {roleOptions(user).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="m-status" className="mb-1 block text-sm font-semibold">
                Status
              </label>
              <select
                id="m-status"
                value={form.active ? 'active' : 'inactive'}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.value === 'active' }))}
                disabled={!fields.status || busy}
                className={inputClass()}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          {fields.role && (
            <p className="text-[11px] text-gray-500">
              A COMEX Representative covers the user's own department or office ({unitShort(user.department)}). An inactive account cannot sign in; set it
              back to Active to restore access.
            </p>
          )}
        </div>

        {formError && (
          <p className="mt-3 text-sm text-red-700" role="alert">
            {formError}
          </p>
        )}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button type="button" onClick={onClose} disabled={busy} className="rounded-full border border-gray-400 py-2 font-medium hover:bg-canvas disabled:opacity-60">
            Cancel
          </button>
          <button type="submit" disabled={busy || !(fields.name || fields.role)} className="rounded-full bg-sidebar py-2 font-medium text-white hover:bg-navy-dark disabled:opacity-60">
            {busy ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
