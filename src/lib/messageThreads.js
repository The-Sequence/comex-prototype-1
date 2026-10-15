/* Messaging rules, ported from comex-frontend-v2 (adminRepository.js messaging
 * functions, data/messageThreadHelpers.js and the message_* RLS policies).
 * Pure functions over a plain state object so they run under node tests;
 * src/lib/messages.js keeps that state in localStorage.
 *
 * State: { threads, messages, reads, directory }
 *   thread    { id, createdBy, creatorName, creatorRole, recipientId, contactName, contactRole, preview, lastMessageAt }
 *   message   { id, threadId, senderId, body, sentAt }
 *   read      { threadId, userId, lastReadAt }   one per person per thread
 *   directory { id, fullName, role, department } people who can be messaged
 *
 * recipientId is a person's id, OFFICE_ID for the COMEX Office as a whole, or
 * `dept:<code>` for a department's COMEX Representatives. */
import { ALL_UNITS, unitName } from '../config/departments.js'

export const OFFICE_ID = 'office'
export const OFFICE_ROLES = ['COMEX Head', 'COMEX Associate']
export const MAX_MESSAGE_LENGTH = 2000
const DEPT = 'dept:'

export const emptyState = () => ({ threads: [], messages: [], reads: [], directory: [] })

export const newId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`

export function formatMessageTimestamp(iso) {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

const isOffice = (user) => OFFICE_ROLES.includes(user?.role)
const departmentOf = (recipientId) => (recipientId?.startsWith(DEPT) ? recipientId.slice(DEPT.length) : null)

/** message_threads_select: the creator, the named recipient, the Office for office mail,
 * and a department's representatives for mail addressed to their department. */
export function canSeeThread(thread, user) {
  if (!user?.id) return false
  if (thread.createdBy === user.id || thread.recipientId === user.id) return true
  if (thread.recipientId === OFFICE_ID) return isOffice(user)
  const dept = departmentOf(thread.recipientId)
  return Boolean(dept) && user.role === 'COMEX Representative' && user.department === dept
}

/** A thread as the viewer sees it: the other side's name, their unread count, its messages oldest first. */
export function mapThread(state, thread, user) {
  const lastRead = state.reads.find((r) => r.threadId === thread.id && r.userId === user.id)
  const lastReadMs = lastRead ? new Date(lastRead.lastReadAt).getTime() : 0
  const rows = state.messages
    .filter((m) => m.threadId === thread.id)
    .sort((a, b) => a.sentAt.localeCompare(b.sentAt))
  const iStartedIt = thread.createdBy === user.id
  return {
    id: thread.id,
    contactName: iStartedIt ? thread.contactName : thread.creatorName,
    contactRole: iStartedIt ? thread.contactRole ?? '' : thread.creatorRole ?? '',
    recipientId: iStartedIt ? thread.recipientId : thread.createdBy,
    preview: thread.preview ?? '',
    unreadCount: rows.filter((m) => m.senderId !== user.id && new Date(m.sentAt).getTime() > lastReadMs).length,
    lastMessageAt: formatMessageTimestamp(thread.lastMessageAt),
    lastMessageAtTimestamp: thread.lastMessageAt,
    messages: rows.map((m) => ({ id: m.id, body: m.body, sentAt: formatMessageTimestamp(m.sentAt), sentAtTimestamp: m.sentAt, isMine: m.senderId === user.id })),
  }
}

/** getMessageThreads: every visible conversation, newest first. */
export function listThreads(state, user) {
  return state.threads
    .filter((t) => canSeeThread(t, user))
    .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt))
    .map((t) => mapThread(state, t, user))
}

/** count_unread_threads(): visible threads holding a message from someone else sent after the viewer last read it. */
export function countUnreadThreads(state, user) {
  return listThreads(state, user).filter((t) => t.unreadCount > 0).length
}

/** Inbox search — by contact name, role or any message text. */
export function filterThreads(threads, search) {
  const term = search.trim().toLowerCase()
  if (!term) return threads
  return threads.filter((t) =>
    [t.contactName, t.contactRole].some((v) => v?.toLowerCase().includes(term)) ||
    t.messages.some((m) => m.body.toLowerCase().includes(term)))
}

/** getContactableRecipients: the Office, each department's representatives, then every other person. */
export function recipientsFor(state, user) {
  const people = state.directory
    .filter((p) => p.id !== user?.id)
    .sort((a, b) => a.fullName.localeCompare(b.fullName))
    .map((p) => ({ id: p.id, name: p.fullName, role: p.role, department: p.department, group: 'People' }))
  return [
    { id: OFFICE_ID, name: 'COMEX Office', role: 'General enquiries', group: 'Office' },
    ...ALL_UNITS.map((d) => ({ id: `${DEPT}${d.code}`, name: `${d.code} Representative`, role: unitName(d.code), department: d.code, group: 'Departments' })),
    ...people,
  ]
}

/** Adds or refreshes a person in the directory (what list_contactable_users reads). */
export function rememberPerson(state, user) {
  if (!user?.id || !user.fullName) return state
  const entry = { id: user.id, fullName: user.fullName, role: user.role, department: user.department }
  const current = state.directory.find((p) => p.id === user.id)
  if (current && ['fullName', 'role', 'department'].every((k) => current[k] === entry[k])) return state
  return { ...state, directory: [...state.directory.filter((p) => p.id !== user.id), entry] }
}

function checkBody(body) {
  if (!body?.trim()) return 'Message cannot be empty.'
  if (body.trim().length > MAX_MESSAGE_LENGTH) return `Messages are limited to ${MAX_MESSAGE_LENGTH} characters.`
  return null
}

/** sendMessage: appends a reply and moves the thread's preview. Returns { result, state }. */
export function sendMessage(state, threadId, user, body, now = new Date().toISOString()) {
  const error = checkBody(body)
  if (error) return { result: { success: false, error }, state }
  if (!user?.id) return { result: { success: false, error: 'You must be signed in to send a message.' }, state }
  const thread = state.threads.find((t) => t.id === threadId)
  if (!thread || !canSeeThread(thread, user)) return { result: { success: false, error: 'This conversation is no longer available.' }, state }
  const message = { id: newId(), threadId, senderId: user.id, body: body.trim(), sentAt: now }
  const next = {
    ...state,
    messages: [...state.messages, message],
    threads: state.threads.map((t) => (t.id === threadId ? { ...t, preview: message.body, lastMessageAt: now } : t)),
  }
  return { result: { success: true, data: { ...message, sentAt: formatMessageTimestamp(now), sentAtTimestamp: now, isMine: true } }, state: next }
}

/** startConversation: reuses the existing thread with that recipient (either direction) or opens one. */
export function startConversation(state, user, { recipientId, recipientName, recipientRole, body } = {}, now = new Date().toISOString()) {
  if (!recipientId || !recipientName) return { result: { success: false, error: 'Please choose who to message.' }, state }
  if (!body?.trim()) return { result: { success: false, error: 'Please write a message.' }, state }
  if (!user?.id) return { result: { success: false, error: 'You must be signed in to send a message.' }, state }
  if (recipientId === user.id) return { result: { success: false, error: 'You cannot message yourself.' }, state }
  const existing = state.threads
    .filter((t) => (t.createdBy === user.id && t.recipientId === recipientId) || (t.createdBy === recipientId && t.recipientId === user.id))
    .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt))[0]
  let next = state
  let threadId = existing?.id
  if (!threadId) {
    threadId = newId()
    next = { ...state, threads: [...state.threads, {
      id: threadId, createdBy: user.id, creatorName: user.fullName, creatorRole: user.role,
      recipientId, contactName: recipientName, contactRole: recipientRole ?? '', preview: '', lastMessageAt: now,
    }] }
  }
  const sent = sendMessage(next, threadId, user, body, now)
  if (!sent.result.success) return { result: sent.result, state }
  const thread = sent.state.threads.find((t) => t.id === threadId)
  return { result: { success: true, data: mapThread(sent.state, thread, user) }, state: sent.state }
}

/** markThreadRead: records that THIS person has read the thread up to now. */
export function markThreadRead(state, threadId, user, now = new Date().toISOString()) {
  if (!user?.id) return { result: { success: false, error: 'Not signed in.' }, state }
  const reads = [...state.reads.filter((r) => !(r.threadId === threadId && r.userId === user.id)), { threadId, userId: user.id, lastReadAt: now }]
  return { result: { success: true }, state: { ...state, reads } }
}
