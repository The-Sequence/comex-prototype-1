/* Volunteer applications to opportunities — kept in this browser's localStorage only. */
import { useEffect, useState } from 'react'
import { APPLICATION_STATUSES, applicationErrors } from './applicationErrors'

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

/** Same write contract as V2: { success, data } or { success: false, error }. New applications start Pending. */
export function applyToOpportunity(opportunityId, user, answers = {}) {
  if (!opportunityId) return { success: false, error: 'Choose an opportunity to apply to.' }
  if (!user?.id) return { success: false, error: 'Please log in with the account making this application.' }
  if (Object.keys(applicationErrors({ fullName: user.fullName, department: user.department, ...answers })).length) {
    return { success: false, error: 'Please complete every field before applying.' }
  }
  const list = read()
  if (list.some(a => a.opportunityId === opportunityId && a.userId === user.id)) {
    return { success: false, error: 'You have already applied to this opportunity.' }
  }
  const application = { opportunityId, userId: user.id, fullName: user.fullName, email: user.email,
    role: user.role, department: user.department, position: answers.position, volunteerRole: answers.volunteerRole,
    status: 'Pending', appliedAt: new Date().toISOString() }
  write([...list, application])
  return { success: true, data: application }
}

/** The office's accept / decline. Only a Pending application can be decided. */
export function setApplicantStatus(opportunityId, userId, status) {
  if (!['Accepted', 'Declined'].includes(status)) return { success: false, error: 'Choose Accepted or Declined.' }
  const list = read()
  const index = list.findIndex(a => a.opportunityId === opportunityId && a.userId === userId)
  if (index === -1) return { success: false, error: 'This application no longer exists.' }
  if ((list[index].status ?? 'Pending') !== 'Pending') return { success: false, error: 'A decision was already recorded.' }
  const updated = { ...list[index], status, decidedAt: new Date().toISOString() }
  write(list.map((a, i) => (i === index ? updated : a)))
  return { success: true, data: updated }
}

function useAllApplications() {
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
  return all.map(a => ({ ...a, status: APPLICATION_STATUSES.includes(a.status) ? a.status : 'Pending' }))
}

/** Live list of applications for one opportunity, oldest first; updates across components and tabs. */
export function useApplications(opportunityId) {
  return useAllApplications()
    .filter(a => a.opportunityId === opportunityId)
    .sort((a, b) => a.appliedAt.localeCompare(b.appliedAt))
}

/** How many applications, on any post, still wait for the office's decision. */
export function usePendingApplicationCount() {
  return useAllApplications().filter(a => a.status === 'Pending').length
}
