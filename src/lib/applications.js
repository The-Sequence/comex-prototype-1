/* Volunteer applications to opportunities — kept in this browser's localStorage only. */
import { useEffect, useState } from 'react'

const KEY = 'comex-applications'
const EVENT = 'comex-applications-change'

function read() {
  try {
    const list = JSON.parse(window.localStorage.getItem(KEY) || '[]')
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

function write(list) {
  try { window.localStorage.setItem(KEY, JSON.stringify(list)) } catch { /* storage unavailable */ }
  window.dispatchEvent(new Event(EVENT))
}

export function applyToOpportunity(opportunityId, user) {
  const list = read()
  if (list.some(a => a.opportunityId === opportunityId && a.userId === user.id)) return
  write([...list, { opportunityId, userId: user.id, fullName: user.fullName, email: user.email,
    role: user.role, department: user.department, appliedAt: new Date().toISOString() }])
}

/** Live list of applications for one opportunity; updates across components and tabs. */
export function useApplications(opportunityId) {
  const [all, setAll] = useState(read)
  useEffect(() => {
    const sync = () => setAll(read())
    window.addEventListener(EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])
  return all.filter(a => a.opportunityId === opportunityId)
}
