import { backendMode, requireBackend } from './supabase.js'
import { ALL_UNITS } from '../config/departments.js'
import { CODE_LENGTH } from '../config/otp.js'
export { backendMode }
export { DEPARTMENTS } from '../config/departments.js'
export const CODE_TTL_MINUTES = 10
export { CODE_LENGTH }
export const SIGNUP_ROLES = ['Student', 'ASP', 'Faculty', 'COMEX Representative']
export const ADMIN_ROLES = ['COMEX Head', 'COMEX Associate']
export function roleGroup(role) {
  if (ADMIN_ROLES.includes(role)) return 'admin'
  if (role === 'Approver') return 'approver'
  if (role === 'COMEX Representative') return 'rep'
  return 'volunteer'
}
const normalizeEmail = email => email.trim().toLowerCase()
const expiry = () => Date.now() + CODE_TTL_MINUTES * 60000
const RECOVERY = 'comex-recovery'
let recovering = false
function recoveryActive() {
  try { return recovering || sessionStorage.getItem(RECOVERY) === 'true' } catch { return recovering }
}
function setRecovery(value) {
  recovering = value
  try { if (value) sessionStorage.setItem(RECOVERY, 'true'); else sessionStorage.removeItem(RECOVERY) } catch { /* memory fallback */ }
}
export function profileFromRow(row) {
  return { id: row.id, fullName: row.full_name, email: row.email, department: row.department,
    role: row.role, status: row.status, emailVerified: Boolean(row.email_verified_at),
    createdAt: row.created_at, registeredAt: row.created_at,
    approvedAt: row.status === 'approved' ? row.decided_at : null, staffType: row.staff_type,
    decisionReason: row.decision_reason, decidedAt: row.decided_at }
}
async function ownProfile(id) {
  const { data, error } = await requireBackend().from('profiles').select('*').eq('id', id).single()
  if (error) throw new Error('Unable to load your account details. Please try again.')
  return profileFromRow(data)
}
export async function signUp({ fullName, department, email, password, role, privacyNoticeVersion, staffType }) {
  if (!SIGNUP_ROLES.includes(role)) throw new Error('Select a valid registration role.')
  if (!ALL_UNITS.some(item => item.code === department)) throw new Error('Select a valid department or office.')
  const { error } = await requireBackend().auth.signUp({ email: normalizeEmail(email), password,
    options: { data: { full_name: fullName.trim(), department, role, privacy_notice_version: privacyNoticeVersion, ...(staffType ? { staff_type: staffType } : {}) } } })
  if (error) throw new Error(error.message)
  return { email: normalizeEmail(email), expiresAt: expiry() }
}
async function verifyCode(email, code, type) {
  if (!new RegExp('^\\d{' + CODE_LENGTH + '}$').test(code)) return { ok: false, reason: 'Enter all ' + CODE_LENGTH + ' digits of the code.' }
  if (type === 'recovery') setRecovery(true)
  const { error } = await requireBackend().auth.verifyOtp({ email: normalizeEmail(email), token: code, type })
  if (error) {
    if (type === 'recovery') setRecovery(false)
    return { ok: false, reason: 'The code is invalid or expired. Request a new code and try again.' }
  }
  if (type === 'signup') await signOut().catch(() => {})
  return { ok: true }
}
export const verifySignupCode = (email, code) => verifyCode(email, code, 'signup')
export const verifyResetCode = (email, code) => verifyCode(email, code, 'recovery')
export async function resendSignupCode(email) {
  const { error } = await requireBackend().auth.resend({ type: 'signup', email: normalizeEmail(email) })
  if (error) throw new Error(error.message)
  return { expiresAt: expiry() }
}
export async function signIn(email, password) {
  setRecovery(false)
  const { data, error } = await requireBackend().auth.signInWithPassword({ email: normalizeEmail(email), password })
  if (error && (!error.status || error.status === 429 || error.status >= 500)) {
    return { code: 'error', error: 'Unable to sign in right now. Please try again shortly.' }
  }
  if (error) return { code: error.code === 'email_not_confirmed' ? 'unverified' : 'invalid',
    error: error.code === 'email_not_confirmed' ? 'Verify your email before signing in.' : 'Invalid email or password.' }
  try {
    const user = await ownProfile(data.user.id)
    if (!user.emailVerified || user.status !== 'approved') {
      await signOut()
      const code = !user.emailVerified ? 'unverified' : ['rejected', 'inactive'].includes(user.status) ? user.status : 'pending'
      const messages = {
        rejected: 'Your account was rejected. Please contact the COMEX office.',
        inactive: 'Your account is inactive. Please contact the COMEX office.',
      }
      return { code, error: messages[code] ?? 'Your account is awaiting COMEX approval.' }
    }
    return { user }
  } catch (error) { await signOut(); throw error }
}
export async function signOut() {
  try {
    const { error } = await requireBackend().auth.signOut({ scope: 'local' })
    if (error) throw new Error('Unable to sign out. Please try again.')
  } finally { setRecovery(false) }
}
export async function getCurrentUser() {
  if (backendMode !== 'live' || recoveryActive()) return null
  const { data, error } = await requireBackend().auth.getUser()
  if (error || !data.user) return null
  const { data: sessionData } = await requireBackend().auth.getSession()
  try {
    const payload = sessionData.session.access_token.split('.')[1]
    const claims = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    if (!claims.amr?.some(item => item.method === 'password')) return null
  } catch { return null }
  const user = await ownProfile(data.user.id)
  return user.status === 'approved' && user.emailVerified ? user : null
}
export function onAuthChange(callback) {
  if (backendMode !== 'live') return () => {}
  const { data } = requireBackend().auth.onAuthStateChange(event => {
    if (event === 'PASSWORD_RECOVERY') setRecovery(true)
    // Supabase callbacks must not await other Auth calls under its session lock.
    setTimeout(() => callback(), 0)
  })
  return () => data.subscription.unsubscribe()
}
export async function requestPasswordReset(email) {
  const { error } = await requireBackend().auth.resetPasswordForEmail(normalizeEmail(email))
  if (error) throw new Error('Unable to request a reset right now. Please try again later.')
  return { expiresAt: expiry() }
}
export async function updatePassword(password) {
  if (!recoveryActive()) throw new Error('Verify a password reset code first.')
  const { error } = await requireBackend().auth.updateUser({ password })
  if (error) throw new Error(error.message)
  await signOut().catch(() => {})
}
export async function listUsers() {
  const { data, error } = await requireBackend().from('profiles').select('*').order('created_at', { ascending: false })
  if (error) throw new Error('Unable to load accounts. Please try again.')
  return data.map(profileFromRow)
}
export async function listRegistrations(status = 'pending') {
  if (!['pending', 'rejected'].includes(status)) throw new Error('Invalid registration status.')
  const { data, error } = await requireBackend().from('profiles').select('*').eq('status', status)
    .not('email_verified_at', 'is', null).order('created_at', { ascending: false })
  if (error) throw new Error('Unable to load registrations. Please try again.')
  return data.map(profileFromRow)
}
export async function retryDecisionEmail(decisionId) {
  try {
    const { data, error } = await requireBackend().functions.invoke('send-decision-email', { body: { decisionId } })
    if (error?.context?.status === 409) return { emailStatus: 'sending' }
    return { emailStatus: !error && ['sent', 'sending'].includes(data?.emailStatus) ? data.emailStatus : 'failed' }
  } catch { return { emailStatus: 'failed' } }
}
export async function listDecisionEmails() {
  const { data, error } = await requireBackend().from('account_decisions')
    .select('id,decision,email_status,email_claimed_at,created_at,profiles!account_decisions_user_id_fkey(full_name,email)')
    .in('email_status', ['pending', 'failed', 'sending']).order('created_at', { ascending: false })
  if (error) throw new Error('Unable to load email notifications. Please try again.')
  return data.map(row => ({ decisionId: row.id, fullName: row.profiles?.full_name,
    email: row.profiles?.email, decision: row.decision, emailStatus: row.email_status, createdAt: row.created_at,
    retryAvailable: row.email_status !== 'sending' || Date.parse(row.email_claimed_at) < Date.now() - 300000 }))
}
export async function decideRegistration(userId, decision, reason) {
  const { data, error } = await requireBackend().rpc('decide_registration', {
    p_user: userId, p_decision: decision, p_reason: reason?.trim() || null })
  if (error) throw new Error(error.message)
  const decisionId = data
  const { emailStatus } = await retryDecisionEmail(decisionId)
  return { decisionId, emailStatus }
}

/** Head only: change a decided account's name, role and/or active state. Fields left undefined are unchanged. */
export async function updateAccount(userId, { fullName, role, active }) {
  const { error } = await requireBackend().rpc('admin_update_account', {
    p_user: userId, p_full_name: fullName ?? null, p_role: role ?? null, p_active: active ?? null })
  if (error) throw new Error(error.message)
}
/** Head only: change another account's sign-in email. */
export async function changeAccountEmail(userId, email) {
  const { data, error } = await requireBackend().functions.invoke('admin-change-email', { body: { userId, email } })
  if (error) {
    let message = 'The email could not be changed. Please try again.'
    try { message = (await error.context.json()).error || message } catch { /* keep the generic message */ }
    throw new Error(message)
  }
  return { email: data.email }
}
