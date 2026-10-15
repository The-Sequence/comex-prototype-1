/* Volunteer hour records and required hours — kept in this browser's localStorage only.
 * Mirrors V2's volunteer_hours and department_requirements tables; see
 * supabase/migrations/202610150110_volunteer_hours.sql and docs/supabase-migration.md. */
import { useEffect, useState } from 'react'
import { buildHourRecord, CURRENT_ACADEMIC_YEAR, hoursProgress, normaliseRequirements, requiredHoursFor } from './hoursRules'

const RECORDS_KEY = 'comex-volunteer-hours'
const REQUIREMENTS_KEY = 'comex-required-hours'
const EVENT = 'comex-volunteer-hours-change'

function read(key, fallback) {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || 'null')
    return value && typeof value === 'object' ? value : fallback
  } catch {
    return fallback
  }
}

function write(key, value) {
  try { window.localStorage.setItem(key, JSON.stringify(value)) } catch { /* storage unavailable */ }
  window.dispatchEvent(new Event(EVENT))
}

const readRecords = () => {
  const list = read(RECORDS_KEY, [])
  return Array.isArray(list) ? list : []
}
const readRequirements = () => read(REQUIREMENTS_KEY, {})

/** The office's Encode Volunteer Hours. `volunteer` is the picked account; its identity is copied. */
export function encodeVolunteerHours(entry, volunteer, academicYear = CURRENT_ACADEMIC_YEAR) {
  const id = globalThis.crypto?.randomUUID?.() ?? `h-${Date.now()}-${Math.random().toString(36).slice(2)}`
  const result = buildHourRecord(entry, volunteer, { id, academicYear })
  if (result.success) write(RECORDS_KEY, [...readRecords(), { ...result.data, encodedAt: new Date().toISOString() }])
  return result
}

/** Set required hours per department for one academic year. COMEX Head only, like V2. */
export function saveRequiredHours(hoursByDepartment, user, academicYear = CURRENT_ACADEMIC_YEAR) {
  if (user?.role !== 'COMEX Head') return { success: false, error: 'Only the COMEX Head can change required hours.' }
  const result = normaliseRequirements(hoursByDepartment)
  if (!result.success) return result
  const all = readRequirements()
  write(REQUIREMENTS_KEY, { ...all, [academicYear]: { ...all[academicYear], ...result.data } })
  return { success: true, data: result.data }
}

function useStore(reader) {
  const [value, setValue] = useState(reader)
  useEffect(() => {
    const sync = () => setValue(reader())
    window.addEventListener(EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [reader])
  return value
}

/** Every record for an academic year, oldest first; optionally one person's. */
export function useHourRecords(academicYear = CURRENT_ACADEMIC_YEAR, userId) {
  return useStore(readRecords)
    .filter((r) => r.academicYear === academicYear && (!userId || r.userId === userId))
    .sort((a, b) => a.isoDate.localeCompare(b.isoDate) || (a.encodedAt ?? '').localeCompare(b.encodedAt ?? ''))
}

/** Department code -> required hours for an academic year (unset = 60). */
export function useRequiredHours(academicYear = CURRENT_ACADEMIC_YEAR) {
  return useStore(readRequirements)[academicYear] ?? {}
}

/** A member's totals against their department's requirement. */
export function useMyHours(user, academicYear = CURRENT_ACADEMIC_YEAR) {
  const records = useHourRecords(academicYear, user?.id)
  const required = requiredHoursFor(useRequiredHours(academicYear), user?.department)
  return { ...hoursProgress(records, required), records }
}

/** Hours still needed this academic year, for the Requires attention panel. 0 once met. */
export function useHoursStillNeeded(user) {
  return useMyHours(user).remainingHours
}
