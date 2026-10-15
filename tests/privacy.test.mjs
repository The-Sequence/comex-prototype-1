import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PRIVACY_KEY, PRIVACY_NOTICE_VERSION, acknowledge, hasAcknowledged } from '../src/lib/privacy.js'
import { DEPARTMENTS, departmentLabel } from '../src/config/departments.js'

const memory = () => {
  const m = new Map()
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) }
}

test('privacy acknowledgement is per notice version', () => {
  const s = memory()
  assert.equal(hasAcknowledged(s), false)
  acknowledge(s)
  assert.equal(hasAcknowledged(s), true)
  s.setItem(PRIVACY_KEY, 'older-version')
  assert.equal(hasAcknowledged(s), false)
  assert.ok(PRIVACY_NOTICE_VERSION)
})

test('blocked storage never throws', () => {
  const broken = { getItem: () => { throw new Error('x') }, setItem: () => { throw new Error('x') } }
  assert.equal(hasAcknowledged(broken), false)
  assert.doesNotThrow(() => acknowledge(broken))
})

test('departments match the real signup list', () => {
  assert.deepEqual(DEPARTMENTS.map((d) => d.code), ['SET', 'SBA', 'SAS', 'STHM', 'SOA', 'SHS'])
  assert.equal(departmentLabel(DEPARTMENTS[1]), 'SBA — School of Business and Accountancy')
})

import { MAX_REASON_LENGTH, emailOutcome, errorText, validateReason } from '../src/lib/decisions.js'

test('decision reason is optional and length-limited', () => {
  assert.equal(validateReason(''), '')
  assert.equal(validateReason('x'.repeat(MAX_REASON_LENGTH)), '')
  assert.match(validateReason('x'.repeat(MAX_REASON_LENGTH + 1)), /under 500/)
})

test('email outcome never claims a failed email was sent', () => {
  assert.equal(emailOutcome('sent').ok, true)
  assert.equal(emailOutcome('failed').ok, false)
  assert.match(emailOutcome('sending').text, /still being sent/)
  assert.equal(emailOutcome('sending').inProgress, true)
  assert.equal(emailOutcome(undefined).ok, false)
  assert.equal(errorText(new Error('Nope')), 'Nope')
  assert.match(errorText(null), /try again/)
})

import { ACCESS_NOTE, RIGHTS_NOTE, SHARING } from '../src/lib/privacy.js'

test('privacy copy states real access, sharing and limits', () => {
  assert.match(ACCESS_NOTE, /Only an approved COMEX Head/)
  assert.doesNotMatch(ACCESS_NOTE, /approver roles who/)
  const sharing = SHARING.join(' ')
  assert.match(sharing, /Supabase/)
  assert.match(sharing, /Singapore/)
  assert.match(sharing, /Resend/)
  assert.match(RIGHTS_NOTE, /does not state a retention period/)
})

import { canRetry, emailStatusLabel } from '../src/lib/decisions.js'

test('retry follows the server flag; stale sending is not called failed', () => {
  assert.equal(canRetry({ emailStatus: 'failed', retryAvailable: true }), true)
  assert.equal(canRetry({ emailStatus: 'sending', retryAvailable: false }), false)
  assert.equal(canRetry({ emailStatus: 'sending', retryAvailable: true }), true)
  assert.equal(canRetry({ emailStatus: 'sending' }), false) // no flag: stay conservative
  assert.equal(canRetry({ emailStatus: 'pending' }), true)
  assert.equal(emailStatusLabel({ emailStatus: 'sending', retryAvailable: false }), 'Sending…')
  assert.equal(emailStatusLabel({ emailStatus: 'sending', retryAvailable: true }), 'Sending… retry available')
  assert.equal(emailStatusLabel({ emailStatus: 'failed' }), 'Failed')
})
