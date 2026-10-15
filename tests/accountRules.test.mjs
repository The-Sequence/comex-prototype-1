import { test } from 'node:test'
import assert from 'node:assert/strict'
import { changesFrom, editableFields, roleOptions, validateManage } from '../src/lib/accountRules.js'

const head = { id: 'h', role: 'COMEX Head', status: 'approved' }
const member = { id: 'm', fullName: 'Juan Dela Cruz', email: 'juan@x.com', department: 'SET', role: 'Student', status: 'approved' }

test('only the COMEX Head can edit, and only decided accounts', () => {
  assert.deepEqual(editableFields({ id: 'a', role: 'Approver' }, member), { name: false, email: false, role: false, status: false })
  assert.equal(editableFields(head, { ...member, status: 'pending' }).name, false)
  assert.deepEqual(editableFields(head, member), { name: true, email: true, role: true, status: true })
})

test('own account: name only; privileged accounts: name only', () => {
  assert.deepEqual(editableFields(head, head), { name: true, email: false, role: false, status: false })
  assert.deepEqual(editableFields(head, { ...member, id: 'x', role: 'Approver' }), { name: true, email: false, role: false, status: false })
})

test('role options are the four self-service roles, representative scoped to the department', () => {
  const opts = roleOptions(member)
  assert.deepEqual(opts.map((o) => o.value), ['Student', 'ASP', 'Faculty', 'COMEX Representative'])
  assert.equal(opts[3].label, 'COMEX Representative (SET)')
  assert.equal(roleOptions({ ...member, role: 'Volunteer' })[0].value, 'Volunteer')
})

test('changes include only what differs', () => {
  const f = { name: true, email: true, role: true, status: true }
  const base = { fullName: member.fullName, email: member.email, role: member.role, active: true }
  assert.deepEqual(changesFrom(member, base, f), {})
  assert.deepEqual(
    changesFrom(member, { fullName: ' New Name ', email: 'NEW@x.com', role: 'COMEX Representative', active: false }, f),
    { fullName: 'New Name', role: 'COMEX Representative', active: false, email: 'new@x.com' },
  )
  assert.deepEqual(changesFrom({ ...member, status: 'inactive' }, { ...base, active: true }, f), { active: true })
})

test('form validation uses the signup rules only for editable fields', () => {
  const f = { name: true, email: true, role: true, status: true }
  assert.ok(validateManage({ fullName: 'J', email: 'bad' }, f).fullName)
  assert.ok(validateManage({ fullName: 'Juan Dela Cruz', email: 'bad' }, f).email)
  assert.deepEqual(validateManage({ fullName: '', email: 'bad' }, { name: false, email: false }), {})
})
