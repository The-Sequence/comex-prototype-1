/* Pre-login privacy acknowledgement. Bump the version whenever the notice
 * text changes so people are asked again. This is only a reminder shown
 * before the account screens; it is not a consent record. */
export const PRIVACY_NOTICE_VERSION = '2026-10-sprint1-r5'
export const PRIVACY_KEY = 'comex-privacy-ack'
export const DATA_PRIVACY_ACT_URL = 'https://privacy.gov.ph/data-privacy-act/'

export function hasAcknowledged(storage) {
  try {
    return storage.getItem(PRIVACY_KEY) === PRIVACY_NOTICE_VERSION
  } catch {
    return false
  }
}

export function acknowledge(storage) {
  try {
    storage.setItem(PRIVACY_KEY, PRIVACY_NOTICE_VERSION)
  } catch {
    /* storage blocked: the notice simply shows again next visit */
  }
}

/** What the Sprint 1 account screens actually collect and why. */
export const ACCOUNT_DATA = [
  ['Full name, department or office and requested role (and, for staff, staff type)', 'to identify you and let the COMEX Head decide whether to approve you.'],
  ['Email address', 'to send your verification code, password-reset code and the approval or rejection notice.'],
  ['Password', 'to sign you in. It is handled by the sign-in service and is never shown to COMEX staff.'],
  ['Account status and decision record', 'pending, approved or rejected, with who decided, when, and the reason if one was given.'],
  ['Sign-in session', 'to keep you signed in and send you to the dashboard for your role.'],
  ['Notice version you acknowledged', 'saved with your account so the office knows which notice applied when you registered.'],
  ['Authentication and security logs', 'kept by the sign-in service (for example sign-in and verification activity) to run and protect the service.'],
]

/** Who else processes the data, and who can see it. */
export const SHARING = [
  'Supabase provides sign-in and the account database. Account data is stored in Singapore, outside the Philippines.',
  'Resend delivers the verification, password-reset and approval or rejection emails, so it receives your email address and the message text.',
]

export const ACCESS_NOTE =
  'Only an approved COMEX Head can review registrations and the account list. Every other user, approvers included, can see only their own profile.'

export const RIGHTS_NOTE =
  'To ask about, correct or request removal of your data, or to exercise your other rights under the Act, contact the COMEX Office. This notice does not state a retention period or a data protection officer contact; ask the COMEX Office for those.'

/** Data that belongs to the full COMEX system, not to this release. */
export const FUTURE_DATA = [
  'Engagement and project records',
  'Volunteer hours',
  'Certificates',
  'Messages',
  'COMEX forms and documents',
]
