/* Where certificate eligibility reads volunteer hours from: the records the
 * office encodes on the Volunteer Hours page (src/lib/volunteerHours.js).
 * setHourRecordSource(fn) swaps the source, e.g. for tests or a Supabase query;
 * fn returns records shaped { userId, fullName, department, project, hours, date, academicYear }. */
import { readRecords } from './volunteerHours.js'

function defaultSource() {
  return readRecords()
}

let source = defaultSource

/** Swap the hours source. Pass nothing to go back to the volunteer hours store. */
export function setHourRecordSource(fn) {
  source = fn ?? defaultSource
}

/** Hour records for one year. With `user`, only that volunteer's records. */
export function listHourRecords({ academicYear, user } = {}) {
  const records = source({ academicYear, user }) ?? []
  return records.filter((r) => r.academicYear === academicYear && (!user || r.userId === user.id))
}
