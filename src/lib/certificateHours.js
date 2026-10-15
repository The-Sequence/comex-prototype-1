/* Where certificate eligibility reads volunteer hours from. The volunteer hours
 * store is built separately; until it lands, the default source returns the
 * sample records the display pages always showed. To wire the real store, call
 * setHourRecordSource(fn) once (or replace defaultSource) where fn returns
 * records shaped { userId, fullName, department, project, hours, date, academicYear }. */
import { CURRENT_ACADEMIC_YEAR } from './certificateRules.js'

const SAMPLE_VOLUNTEERS = [
  { userId: 'sample-juan', fullName: 'Juan Dela Cruz', department: 'SET', hours: [24, 20, 18] },
  { userId: 'sample-maria', fullName: 'Maria Santos', department: 'SET', hours: [24, 20, 16] },
  { userId: 'sample-jose', fullName: 'Jose Mendoza', department: 'SET', hours: [24, 20, 12] },
  { userId: 'sample-ana', fullName: 'Ana Reyes', department: 'SBA', hours: [20, 12] },
]
const SAMPLE_ACTIVITIES = [
  { project: 'EcoWays Project', date: '2026-01-24' },
  { project: 'Digital Literacy Seminar', date: '2026-03-14' },
  { project: 'Tree Planting Drive', date: '2026-05-09' },
]

const sampleRecords = ({ userId, fullName, department, hours }) => hours.map((h, i) => ({
  userId, fullName, department, hours: h, academicYear: CURRENT_ACADEMIC_YEAR, ...SAMPLE_ACTIVITIES[i],
}))

/** Sample data only: the four sample volunteers, plus the signed-in volunteer's own Frame 16.5 hours. */
function defaultSource({ academicYear, user }) {
  if (academicYear !== CURRENT_ACADEMIC_YEAR) return []
  if (user) return sampleRecords({ userId: user.id, fullName: user.fullName, department: user.department, hours: [24, 20, 20] })
  return SAMPLE_VOLUNTEERS.flatMap(sampleRecords)
}

let source = defaultSource

/** Swap in the real volunteer hours store. Pass nothing to go back to the samples. */
export function setHourRecordSource(fn) {
  source = fn ?? defaultSource
}

/** Hour records for one year. With `user`, only that volunteer's records. */
export function listHourRecords({ academicYear, user } = {}) {
  const records = source({ academicYear, user }) ?? []
  return records.filter((r) => r.academicYear === academicYear && (!user || r.userId === user.id))
}
