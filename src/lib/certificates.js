/* Volunteer certificates — dispatch records, required hours and the office's
 * stored e-signature, kept in this browser's localStorage only. Same contract
 * as comex-frontend-v2: { success, data } or { success: false, error }.
 * See docs/supabase-migration.md for moving this to Supabase. */
import { useEffect, useState } from 'react'
import { listHourRecords } from './certificateHours.js'
import { HOURS_EVENT } from './volunteerHours.js'
import {
  CURRENT_ACADEMIC_YEAR,
  buildCertificateRows,
  buildMyCertificate,
  normaliseRequiredHours,
} from './certificateRules.js'

const KEYS = { dispatch: 'comex-certificates', required: 'comex-required-hours', signatures: 'comex-signatures' }
const EVENT = 'comex-certificates-change'

function read(key, fallback) {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) ?? 'null')
    return value && typeof value === 'object' ? value : fallback
  } catch {
    return fallback
  }
}

/** False when the browser refuses the write (private mode, full storage). */
function write(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    return false
  }
  window.dispatchEvent(new Event(EVENT))
  return true
}

const dispatchList = () => {
  const list = read(KEYS.dispatch, [])
  return Array.isArray(list) ? list : []
}

function dispatchByUser(academicYear) {
  return new Map(dispatchList().filter((d) => d.academicYear === academicYear).map((d) => [d.userId, d]))
}

/** Department code -> required hours for one academic year (unset departments use the default). */
export function loadRequiredHours(academicYear = CURRENT_ACADEMIC_YEAR) {
  return { ...(read(KEYS.required, {})[academicYear] ?? {}) }
}

/** Only the COMEX Head sets the requirement (V2: can_manage_requirements). */
export function saveRequiredHours(draft, academicYear = CURRENT_ACADEMIC_YEAR, actor) {
  if (actor?.role !== 'COMEX Head') return { success: false, error: 'Only the COMEX Head can change required hours.' }
  const checked = normaliseRequiredHours(draft)
  if (!checked.success) return checked
  const all = read(KEYS.required, {})
  if (!write(KEYS.required, { ...all, [academicYear]: { ...all[academicYear], ...checked.data } })) {
    return { success: false, error: 'Could not save the required hours in this browser.' }
  }
  return { success: true, data: checked.data }
}

/** The office's Certificates page: every volunteer with hours, eligibility and dispatch state. */
export function getCertificateRows(academicYear = CURRENT_ACADEMIC_YEAR) {
  return buildCertificateRows(listHourRecords({ academicYear }), dispatchByUser(academicYear), loadRequiredHours(academicYear), academicYear)
}

/** The volunteer's own certificate for one year ([] when they have no hours). */
export function getMyCertificates(user, academicYear = CURRENT_ACADEMIC_YEAR) {
  if (!user?.id) return []
  return buildMyCertificate(listHourRecords({ academicYear, user }), dispatchByUser(academicYear).get(user.id),
    loadRequiredHours(academicYear), academicYear)
}

/** Send (or re-send) one certificate. `forced` marks one sent before the hours were met. */
export function sendCertificate(userId, academicYear = CURRENT_ACADEMIC_YEAR, { signed = false, forced = false } = {}) {
  if (!userId) return { success: false, error: 'Choose a volunteer to send the certificate to.' }
  const record = { userId, academicYear, dispatchStatus: 'Sent', sentAt: new Date().toISOString().slice(0, 10), signed, forced }
  const rest = dispatchList().filter((d) => !(d.userId === userId && d.academicYear === academicYear))
  if (!write(KEYS.dispatch, [...rest, record])) return { success: false, error: 'Could not save the certificate in this browser.' }
  return { success: true, data: record }
}

/** The signature image an office member saved for reuse ({ dataUrl, name }), or null. */
export function getStoredSignature(userId) {
  return read(KEYS.signatures, {})[userId] ?? null
}

export function setStoredSignature(userId, dataUrl, name) {
  if (!userId) return { success: false, error: 'Please log in again.' }
  if (!String(dataUrl).startsWith('data:image/')) return { success: false, error: 'Choose an image file.' }
  const data = { dataUrl, name }
  if (!write(KEYS.signatures, { ...read(KEYS.signatures, {}), [userId]: data })) {
    return { success: false, error: 'This image is too large to keep in the browser. Try a smaller one.' }
  }
  return { success: true, data }
}

export function clearStoredSignature(userId) {
  const { [userId]: _, ...rest } = read(KEYS.signatures, {})
  return write(KEYS.signatures, rest) ? { success: true } : { success: false, error: 'Could not remove the signature.' }
}

/** Re-renders the caller whenever certificate data changes, in this tab or another. */
export function useCertificateData(load) {
  const [value, setValue] = useState(load)
  useEffect(() => {
    const sync = () => setValue(load())
    sync()
    window.addEventListener(EVENT, sync)
    window.addEventListener(HOURS_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EVENT, sync)
      window.removeEventListener(HOURS_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [load])
  return value
}
