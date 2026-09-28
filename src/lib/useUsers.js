import { useEffect, useState } from 'react'
import { getDb } from './db'

/** Live list of accounts; re-renders whenever the mock database changes. */
export function useUsers() {
  const [users, setUsers] = useState(() => getDb().users)
  useEffect(() => {
    const refresh = () => setUsers(getDb().users)
    window.addEventListener('comex-db-change', refresh)
    window.addEventListener('storage', refresh) // other tabs
    return () => {
      window.removeEventListener('comex-db-change', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])
  return users
}

export const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

/** Registrations waiting on the office: email verified, not yet decided. */
export const isAwaitingApproval = (user) => user.status === 'pending' && user.emailVerified
