import { test } from 'node:test'
import assert from 'node:assert/strict'
import { unitValue, validateStaff } from '../src/lib/staff.js'

test('staff type and office are both required', () => {
  assert.deepEqual(Object.keys(validateStaff({ staffType: '', unit: '', otherUnit: '' })).sort(), ['staffType', 'unit'])
  assert.deepEqual(validateStaff({ staffType: 'ASP', unit: 'Clinic', otherUnit: '' }), {})
})

test('"Other" needs text, within the limit', () => {
  assert.ok(validateStaff({ staffType: 'ASP', unit: 'Other', otherUnit: '  ' }).otherUnit)
  assert.ok(validateStaff({ staffType: 'ASP', unit: 'Other', otherUnit: 'x'.repeat(101) }).otherUnit)
  assert.deepEqual(validateStaff({ staffType: 'ASP', unit: 'Other', otherUnit: 'Print shop' }), {})
})

test('unknown choices are rejected; stored value follows the choice', () => {
  assert.ok(validateStaff({ staffType: 'Boss', unit: 'Clinic', otherUnit: '' }).staffType)
  assert.ok(validateStaff({ staffType: 'ASP', unit: 'Registrar', otherUnit: '' }).unit)
  assert.equal(unitValue({ unit: 'Library', otherUnit: 'ignored' }), 'Library')
  assert.equal(unitValue({ unit: 'Other', otherUnit: ' Print shop ' }), 'Print shop')
})
