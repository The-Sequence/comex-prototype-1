/* Certificate eligibility, ported from comex-frontend-v2 (adminRepository.js
 * getCertificateRows, userRepository.js getMyCertificates). Eligibility is
 * computed from hour records, never stored, so it can't disagree with the
 * Volunteer Hours pages. Pure functions: no storage, no React. */

export const ACADEMIC_YEARS = ['A.Y. 2025-2026', 'A.Y. 2024-2025', 'A.Y. 2023-2024']
export const CURRENT_ACADEMIC_YEAR = ACADEMIC_YEARS[0]
export const DEFAULT_REQUIRED_HOURS = 60

/** Required hours for one department, falling back to the default. */
export const requiredHoursFor = (requiredMap, department) =>
  Number(requiredMap?.[department]) || DEFAULT_REQUIRED_HOURS

/** One summary per person: { userId, fullName, department, totalHours }. */
export function summariseHoursByUser(records) {
  const byUser = new Map()
  records.forEach((record) => {
    const existing = byUser.get(record.userId)
    if (existing) existing.totalHours += record.hours
    else byUser.set(record.userId, {
      userId: record.userId, fullName: record.fullName, department: record.department, totalHours: record.hours,
    })
  })
  return [...byUser.values()]
}

function withEligibility(summary, dispatch, requiredMap, academicYear) {
  const requiredHours = requiredHoursFor(requiredMap, summary.department)
  return {
    ...summary,
    requiredHours,
    eligible: summary.totalHours >= requiredHours,
    hoursRemaining: Math.max(0, requiredHours - summary.totalHours),
    dispatchStatus: dispatch?.dispatchStatus ?? 'Not Sent',
    sentAt: dispatch?.sentAt ?? null,
    signed: dispatch?.signed ?? false,
    forced: dispatch?.forced ?? false,
    academicYear,
  }
}

/** The office's rows, one per volunteer with hours. dispatchByUser: Map userId -> dispatch row. */
export function buildCertificateRows(records, dispatchByUser, requiredMap, academicYear) {
  return summariseHoursByUser(records)
    .map((summary) => withEligibility(summary, dispatchByUser.get(summary.userId), requiredMap, academicYear))
    .sort((a, b) => a.fullName.localeCompare(b.fullName))
}

const MONTH = (time) => new Date(time).toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' })
const YEAR = (time) => new Date(time).getUTCFullYear()

/** "January – May 2026" from the earliest and latest service dates. */
export function derivePeriodLabel(records) {
  const times = records.map((r) => new Date(r.date).getTime()).filter((t) => !Number.isNaN(t))
  if (!times.length) return ''
  const first = Math.min(...times)
  const last = Math.max(...times)
  if (YEAR(first) !== YEAR(last)) return `${MONTH(first)} ${YEAR(first)} – ${MONTH(last)} ${YEAR(last)}`
  if (MONTH(first) === MONTH(last)) return `${MONTH(first)} ${YEAR(first)}`
  return `${MONTH(first)} – ${MONTH(last)} ${YEAR(last)}`
}

/** A volunteer's own certificate row for one year, or [] when they have no hours. */
export function buildMyCertificate(records, dispatch, requiredMap, academicYear) {
  if (!records.length) return []
  const [summary] = summariseHoursByUser(records)
  return [{
    ...withEligibility(summary, dispatch, requiredMap, academicYear),
    id: `mycert-${summary.userId}-${academicYear}`,
    activities: [...new Set(records.map((r) => r.project))],
    period: derivePeriodLabel(records),
    recipientName: summary.fullName,
  }]
}

/** What the volunteer is told about their certificate. Unsigned ones are not valid until the Head signs. */
export function certificateStatusText(row) {
  if (!row.eligible) return `${row.hoursRemaining} more needed`
  if (row.dispatchStatus !== 'Sent') return 'Awaiting release by the COMEX Office'
  return row.signed ? 'Signed and released' : 'Pending COMEX Head signature'
}

/** Checks the Required hours draft: { success, data } with whole numbers, or { success: false, error }. */
export function normaliseRequiredHours(draft) {
  const data = {}
  for (const [department, value] of Object.entries(draft ?? {})) {
    const hours = Number(value)
    if (value === '' || !Number.isFinite(hours) || hours < 1) {
      return { success: false, error: `Enter at least 1 hour for ${department}.` }
    }
    data[department] = Math.round(hours)
  }
  return { success: true, data }
}
