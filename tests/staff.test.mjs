import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validateStaff } from '../src/lib/staff.js'
import { ALL_UNITS, DEPARTMENTS, OFFICES, unitName } from '../src/config/departments.js'

test('staff type is required and must be a known type', () => {
  assert.ok(validateStaff({ staffType: '' }).staffType)
  assert.ok(validateStaff({ staffType: 'Boss' }).staffType)
  assert.deepEqual(validateStaff({ staffType: 'ASP' }), {})
})

test('offices are separate from schools but selectable at signup', () => {
  assert.deepEqual(OFFICES.map((o) => o.code), ['CLINIC', 'LIBRARY'])
  assert.equal(DEPARTMENTS.length, 6)
  assert.equal(ALL_UNITS.length, 8)
  assert.equal(unitName('LIBRARY'), 'Library')
  assert.equal(unitName('SET'), 'School of Engineering and Technology')
  assert.equal(unitName('???'), '???')
})
