/* Who may change what on an account. Mirrors the checks in the database
 * function and the admin-change-email function, so the dialog never offers
 * something the server will refuse. */
import { validateEmail, validateFullName } from './validation.js'

export const PRIVILEGED_ROLES = ['COMEX Head', 'COMEX Associate', 'Approver']
export const ASSIGNABLE_ROLES = ['Student', 'ASP', 'Faculty', 'COMEX Representative']

export const canManageAccounts = (actor) => actor?.role === 'COMEX Head'
export const isManageable = (target) => ['approved', 'inactive'].includes(target?.status)

/** Which fields the actor may edit on this target. */
export function editableFields(actor, target) {
  const open = canManageAccounts(actor) && isManageable(target)
  const self = actor?.id === target?.id
  const privileged = PRIVILEGED_ROLES.includes(target?.role)
  return { name: open, email: open && !self && !privileged, role: open && !self && !privileged, status: open && !self && !privileged }
}

/** Role choices for a target. A COMEX Representative role applies to the user's own department. */
export function roleOptions(target) {
  const current = target?.role
  const list = ASSIGNABLE_ROLES.includes(current) ? ASSIGNABLE_ROLES : [current, ...ASSIGNABLE_ROLES]
  return list.map((role) => ({
    value: role,
    label: role === 'COMEX Representative' && target?.department ? `COMEX Representative (${target.department})` : role,
  }))
}

/** Field errors for the manage form; empty object when valid. */
export function validateManage(form, fields) {
  const errors = {}
  if (fields.name) {
    const e = validateFullName(form.fullName)
    if (e) errors.fullName = e
  }
  if (fields.email) {
    const e = validateEmail(form.email)
    if (e) errors.email = e
  }
  return errors
}

/** Only what actually changed, so unchanged fields are never rewritten or logged. */
export function changesFrom(target, form, fields) {
  const out = {}
  if (fields.name && form.fullName.trim() !== target.fullName) out.fullName = form.fullName.trim()
  if (fields.role && form.role !== target.role) out.role = form.role
  if (fields.status && form.active !== (target.status === 'approved')) out.active = form.active
  if (fields.email && form.email.trim().toLowerCase() !== target.email) out.email = form.email.trim().toLowerCase()
  return out
}
