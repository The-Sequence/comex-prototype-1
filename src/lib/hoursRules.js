/* Volunteer hours rules, ported from comex-frontend-v2 (adminRepository.js
 * encodeVolunteerHours, volunteerRepositoryHelpers.js, settingsStore.js and
 * AdminVolunteerHours.jsx). Pure functions: no storage, no React. */

export const ACADEMIC_YEARS = ['A.Y. 2025-2026', 'A.Y. 2024-2025', 'A.Y. 2023-2024']
export const CURRENT_ACADEMIC_YEAR = ACADEMIC_YEARS[0]
export const CURRENT_TERM_LABEL = '1st term'
export const REQUIRED_VOLUNTEER_HOURS = 60

/* Position tabs in each department panel. Tab labels are plural, stored roles singular. */
export const POSITION_TABS = ['Faculty', 'ASP', 'Students', 'COMEX Representatives']

export function matchesPositionTab(summary, tab) {
  const position = summary.position ?? ''
  if (tab === 'Students') return position === 'Student'
  if (tab === 'Faculty') return position === 'Faculty'
  if (tab === 'ASP') return position === 'ASP'
  if (tab === 'COMEX Representatives') return position.startsWith('COMEX Representative')
  return false
}

const toMinutes = (value) => {
  const [h, m] = String(value ?? '').split(':').map(Number)
  return Number.isNaN(h) || Number.isNaN(m) || value === '' ? null : h * 60 + m
}

/** Minutes between two "HH:MM" values; null while either is unset. */
export function minutesBetween(timeIn, timeOut) {
  if (!timeIn || !timeOut) return null
  const start = toMinutes(timeIn)
  const end = toMinutes(timeOut)
  return start === null || end === null ? null : end - start
}

/** Whole hours rendered, rounded to the nearest hour like the office's paper sheets. */
export function computeHoursBetween(timeIn, timeOut) {
  const minutes = minutesBetween(timeIn, timeOut)
  return minutes === null ? 0 : Math.max(0, Math.round(minutes / 60))
}

/** "3 hours 30 min" */
export function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest} min`
  const unit = hours === 1 ? 'hour' : 'hours'
  return rest === 0 ? `${hours} ${unit}` : `${hours} ${unit} ${rest} min`
}

/** "07:30" -> "7:30 AM" */
export function formatTimeForDisplay(value) {
  const minutes = toMinutes(value)
  if (minutes === null) return value
  const h = Math.floor(minutes / 60)
  const suffix = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 === 0 ? 12 : h % 12}:${String(minutes % 60).padStart(2, '0')} ${suffix}`
}

/** "2026-05-09" -> "May 9, 2026", in UTC so it never shows the previous day. */
export function formatHourDate(isoDate) {
  return new Date(isoDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

/** Validates the Encode Volunteer Hours form and builds the record. Same contract as V2. */
export function buildHourRecord(entry, volunteer, { id, academicYear = CURRENT_ACADEMIC_YEAR } = {}) {
  const missing = ['userId', 'project', 'volunteerRole', 'timeIn', 'timeOut', 'date'].filter((f) => !entry?.[f])
  if (missing.length) return { success: false, error: 'Please complete every field before adding the record.' }
  if (!volunteer || volunteer.id !== entry.userId) return { success: false, error: 'Volunteer not found.' }
  const hours = computeHoursBetween(entry.timeIn, entry.timeOut)
  if (hours <= 0) return { success: false, error: 'Time out must be later than time in.' }
  if (!ACADEMIC_YEARS.includes(academicYear)) return { success: false, error: 'Choose a valid academic year.' }
  // Identity is copied from the account, never typed (V2's fill_volunteer_hours_identity trigger).
  return {
    success: true,
    data: {
      id, userId: volunteer.id, fullName: volunteer.fullName, department: volunteer.department ?? '',
      position: volunteer.role ?? '', project: entry.project, volunteerRole: entry.volunteerRole,
      isoDate: entry.date, date: formatHourDate(entry.date),
      timeIn: formatTimeForDisplay(entry.timeIn), timeOut: formatTimeForDisplay(entry.timeOut),
      hours, academicYear,
    },
  }
}

/** One row per person with their running total, in first-seen order. */
export function summariseHoursByUser(records) {
  const totals = new Map()
  records.forEach((r) => {
    const existing = totals.get(r.userId)
    if (existing) existing.totalHours += r.hours
    else totals.set(r.userId, { userId: r.userId, fullName: r.fullName, department: r.department, position: r.position, totalHours: r.hours })
  })
  return [...totals.values()]
}

/** Name or department contains the search term. */
export function matchesHourSearch(summary, search) {
  const term = search.trim().toLowerCase()
  return !term || summary.fullName.toLowerCase().includes(term) || summary.department.toLowerCase().includes(term)
}

/** Required hours for a department; unset departments use the global default. */
export function requiredHoursFor(requirements, department) {
  return requirements?.[department] ?? REQUIRED_VOLUNTEER_HOURS
}

/** Cleans the Set required hours form: whole numbers, at least 1. */
export function normaliseRequirements(hoursByDepartment) {
  const out = {}
  for (const [department, value] of Object.entries(hoursByDepartment)) {
    const hours = Math.round(Number(value))
    if (!Number.isFinite(hours) || hours < 1) return { success: false, error: `Required hours for ${department} must be at least 1.` }
    out[department] = hours
  }
  return { success: true, data: out }
}

/** The member's progress card (V2 getMyVolunteerHours). */
export function hoursProgress(records, requiredHours) {
  const completedHours = records.reduce((total, r) => total + r.hours, 0)
  return {
    completedHours,
    requiredHours,
    remainingHours: Math.max(0, requiredHours - completedHours),
    percent: Math.min(100, Math.round((completedHours / requiredHours) * 100)),
    met: completedHours >= requiredHours,
  }
}
