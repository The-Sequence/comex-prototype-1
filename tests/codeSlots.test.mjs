import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fromSlots, pasteSlots, setSlot, toSlots } from '../src/lib/codeSlots.js'
import { validateCode } from '../src/lib/validation.js'

const N = 8

test('a blank middle box keeps later digits in place', () => {
  let v = '12345678'
  v = setSlot(v, N, 3, '') // clear 4th box
  assert.deepEqual(toSlots(v, N), ['1', '2', '3', '', '5', '6', '7', '8'])
  assert.equal(v, '123 5678')
  assert.notEqual(validateCode(v), '') // incomplete: never accepted
})

test('refilling the blank box completes the same code', () => {
  assert.equal(setSlot('123 5678', N, 3, '4'), '12345678')
  assert.equal(validateCode('12345678'), '')
})

test('typing into a later box leaves earlier gaps as gaps', () => {
  const v = setSlot('', N, 5, '9')
  assert.equal(v, '     9')
  assert.deepEqual(toSlots(v, N), ['', '', '', '', '', '9', '', ''])
  assert.notEqual(validateCode(v), '')
})

test('clearing the last digit drops trailing spaces', () => {
  assert.equal(setSlot('12', N, 1, ''), '1')
  assert.equal(setSlot('1', N, 0, ''), '')
})

test('paste fills from a box, ignores non-digits and stops at the last box', () => {
  assert.deepEqual(pasteSlots('', N, 0, '1234 5678'), { value: '12345678', focus: 7 })
  assert.deepEqual(pasteSlots('12345678', N, 6, '9999'), { value: '12345699', focus: 7 })
  assert.deepEqual(pasteSlots('1234', N, 2, 'ab-90'), { value: '1290', focus: 4 })
  assert.deepEqual(pasteSlots('1', N, 3, 'abc'), { value: '1', focus: 3 })
})

test('paste over a gap does not shift other digits', () => {
  const r = pasteSlots('12 45678', N, 2, '3')
  assert.equal(r.value, '12345678')
})

test('fromSlots and toSlots round trip', () => {
  const slots = ['', '2', '', '4', '', '', '', '8']
  assert.deepEqual(toSlots(fromSlots(slots), N), slots)
})
