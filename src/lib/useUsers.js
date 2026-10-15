import * as db from './db'
import { useAsyncList } from './useAsyncList'

/** Head-only account list from the live backend: { status, rows, error, reload }. */
export const useUsers = () => useAsyncList(() => db.listUsers(), [])

/** Registrations in one state ('pending' | 'rejected'). */
export const useRegistrations = (status) => useAsyncList(() => db.listRegistrations(status), [status])

export const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

/** Registrations waiting on the office: email verified, not yet decided. */
export const isAwaitingApproval = (user) => user.status === 'pending' && user.emailVerified !== false
