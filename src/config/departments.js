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
