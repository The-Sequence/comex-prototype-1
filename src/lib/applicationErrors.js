/* Volunteer Application Form rules — mirrors comex-frontend-v2 (src/lib/applicationErrors.js
 * and src/config/appConfig.js). One message per empty field, so the form marks each one. */

export const POSITIONS = ['Student', 'Faculty', 'ASP', 'COMEX Representative']

export const VOLUNTEER_ROLES = [
  'Technical Support',
  'Facilitator',
  'Documentation',
  'Logistics',
  'Registration',
  'Project Lead',
]

export const APPLICATION_STATUSES = ['Pending', 'Accepted', 'Declined']

const REQUIRED_FIELDS = {
  fullName: 'Enter your full name.',
  position: 'Choose your position.',
  department: 'Choose your department.',
  volunteerRole: 'Choose a volunteer role.',
}

/** @returns {Record<string,string>} field -> message; {} when complete. */
export function applicationErrors(form) {
  const errors = {}
  Object.entries(REQUIRED_FIELDS).forEach(([field, message]) => {
    if (!String(form?.[field] ?? '').trim()) errors[field] = message
  })
  return errors
}
