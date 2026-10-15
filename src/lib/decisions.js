export const MAX_REASON_LENGTH = 500

/** The reason is optional; when given it must fit the audit column. */
export function validateReason(reason) {
  return reason.trim().length > MAX_REASON_LENGTH ? `Keep the reason under ${MAX_REASON_LENGTH} characters.` : ''
}

/** Wording for the result dialog, from the adapter's emailStatus. */
export function emailOutcome(emailStatus) {
  if (emailStatus === 'sent') return { ok: true, text: 'The user will be notified through their registered email address.' }
  if (emailStatus === 'sending') {
    return { ok: true, inProgress: true, text: 'The decision was saved. The notification email is still being sent; check Email notifications below.' }
  }
  return {
    ok: false,
    text: 'The decision was saved, but the notification email could not be sent. You can try sending it again.',
  }
}

/** Short user-safe text for any adapter failure. */
export const errorText = (err, fallback = 'Something went wrong. Please try again.') =>
  (err && typeof err.message === 'string' && err.message) || fallback

/** Retry is offered when the server says a send can be (re)claimed. */
export const canRetry = (row) =>
  typeof row.retryAvailable === 'boolean' ? row.retryAvailable : row.emailStatus !== 'sending'

/** Badge text for a notification row; a stale send is not called a failure. */
export function emailStatusLabel(row) {
  if (row.emailStatus === 'sending') return canRetry(row) ? 'Sending… retry available' : 'Sending…'
  return { pending: 'Not sent yet', failed: 'Failed' }[row.emailStatus] ?? row.emailStatus
}
