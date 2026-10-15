/* Signup department choices. Mirrors DEPARTMENTS in comex-frontend-v2
 * (src/config/appConfig.js, read-only reference) so both apps offer the
 * same schools. Keep the order and codes identical. */
export const DEPARTMENTS = [
  { code: 'SET', name: 'School of Engineering and Technology' },
  { code: 'SBA', name: 'School of Business and Accountancy' },
  { code: 'SAS', name: 'School of Arts and Sciences' },
  { code: 'STHM', name: 'School of Tourism and Hospitality Management' },
  { code: 'SOA', name: 'School of Architecture' },
  { code: 'SHS', name: 'Senior High School' },
]

/** "SET — School of Engineering and Technology", as the real signup shows it. */
export const departmentLabel = (d) => `${d.code} — ${d.name}`

/* Non-academic offices that have their own staff. Kept apart from the schools:
 * they are not in comex-frontend-v2's school list. Add an office only when the COMEX office says so. */
export const OFFICES = [
  { code: 'CLINIC', name: 'Clinic' },
  { code: 'LIBRARY', name: 'Library' },
]

/** Every choice a person can register under: schools, then offices. */
export const ALL_UNITS = [...DEPARTMENTS, ...OFFICES]

/** Display name for any department or office code. */
export const unitName = (code) => ALL_UNITS.find((d) => d.code === code)?.name ?? code
