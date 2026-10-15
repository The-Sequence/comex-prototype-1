import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  OFFICE_ID, canSeeThread, countUnreadThreads, emptyState, filterThreads, listThreads,
  markThreadRead, recipientsFor, rememberPerson, sendMessage, startConversation,
} from '../src/lib/messageThreads.js'

const head = { id: 'h', fullName: 'Hana Head', role: 'COMEX Head', department: 'COMEX' }
const student = { id: 's', fullName: 'Sam Student', role: 'Student', department: 'SET' }
const rep = { id: 'r', fullName: 'Rita Rep', role: 'COMEX Representative', department: 'SET' }
const otherRep = { id: 'o', fullName: 'Omar Rep', role: 'COMEX Representative', department: 'SBA' }

const at = (minute) => `2026-10-15T10:${String(minute).padStart(2, '0')}:00.000Z`

test('starting a conversation validates the draft', () => {
  const s = emptyState()
  assert.equal(startConversation(s, student, { body: 'hi' }).result.error, 'Please choose who to message.')
  assert.equal(startConversation(s, student, { recipientId: OFFICE_ID, recipientName: 'COMEX Office', body: '  ' }).result.error, 'Please write a message.')
  assert.equal(startConversation(s, student, { recipientId: 's', recipientName: 'Me', body: 'x' }).result.success, false)
})

test('office mail is read by the office only, and each side sees the other name', () => {
  const { result, state } = startConversation(emptyState(), student, { recipientId: OFFICE_ID, recipientName: 'COMEX Office', body: 'Hello' }, at(1))
  assert.equal(result.success, true)
  assert.equal(result.data.contactName, 'COMEX Office')
  assert.equal(listThreads(state, head)[0].contactName, 'Sam Student')
  assert.equal(listThreads(state, rep).length, 0)
  assert.equal(countUnreadThreads(state, head), 1)
  assert.equal(countUnreadThreads(state, student), 0)
})

test('department mail reaches that department representatives only', () => {
  const { state } = startConversation(emptyState(), head, { recipientId: 'dept:SET', recipientName: 'SET Representative', body: 'Forms?' }, at(1))
  const thread = state.threads[0]
  assert.equal(canSeeThread(thread, rep), true)
  assert.equal(canSeeThread(thread, otherRep), false)
  assert.equal(canSeeThread(thread, student), false)
})

test('a second message to the same person reuses the thread in either direction', () => {
  let { state } = startConversation(emptyState(), head, { recipientId: 's', recipientName: 'Sam Student', body: 'One' }, at(1))
  ;({ state } = startConversation(state, student, { recipientId: 'h', recipientName: 'Hana Head', body: 'Two' }, at(2)))
  assert.equal(state.threads.length, 1)
  assert.equal(state.threads[0].preview, 'Two')
  assert.deepEqual(listThreads(state, head)[0].messages.map((m) => [m.body, m.isMine]), [['One', true], ['Two', false]])
})

test('unread is per person and cleared by reading', () => {
  let { state } = startConversation(emptyState(), student, { recipientId: OFFICE_ID, recipientName: 'COMEX Office', body: 'Hi' }, at(1))
  const id = state.threads[0].id
  ;({ state } = markThreadRead(state, id, head, at(2)))
  assert.equal(countUnreadThreads(state, head), 0)
  ;({ state } = sendMessage(state, id, head, 'Reply', at(3)))
  assert.equal(countUnreadThreads(state, student), 1)
  assert.equal(listThreads(state, student)[0].unreadCount, 1)
  assert.equal(countUnreadThreads(state, head), 0)
})

test('sending checks the body and that the sender may see the thread', () => {
  const { state } = startConversation(emptyState(), student, { recipientId: OFFICE_ID, recipientName: 'COMEX Office', body: 'Hi' }, at(1))
  const id = state.threads[0].id
  assert.equal(sendMessage(state, id, head, '').result.error, 'Message cannot be empty.')
  assert.equal(sendMessage(state, id, rep, 'sneaky').result.success, false)
  assert.equal(sendMessage(state, id, head, 'x'.repeat(2001)).result.success, false)
})

test('search matches contact names and message text; threads list newest first', () => {
  let { state } = startConversation(emptyState(), head, { recipientId: 's', recipientName: 'Sam Student', body: 'clean-up drive' }, at(1))
  ;({ state } = startConversation(state, head, { recipientId: 'dept:SBA', recipientName: 'SBA Representative', body: 'forms' }, at(2)))
  const threads = listThreads(state, head)
  assert.deepEqual(threads.map((t) => t.contactName), ['SBA Representative', 'Sam Student'])
  assert.deepEqual(filterThreads(threads, 'CLEAN').map((t) => t.contactName), ['Sam Student'])
  assert.deepEqual(filterThreads(threads, 'sba').map((t) => t.contactName), ['SBA Representative'])
  assert.equal(filterThreads(threads, '  ').length, 2)
})

test('recipients: office, departments, then other people from the directory', () => {
  let state = rememberPerson(emptyState(), student)
  state = rememberPerson(state, head)
  assert.equal(rememberPerson(state, head), state)
  const list = recipientsFor(state, head)
  assert.equal(list[0].id, OFFICE_ID)
  assert.ok(list.some((r) => r.id === 'dept:SET' && r.group === 'Departments'))
  assert.deepEqual(list.filter((r) => r.group === 'People').map((r) => r.id), ['s'])
})
