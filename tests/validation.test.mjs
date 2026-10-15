import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  validateCode,
  validateConfirm,
  validateEmail,
  validateFullName,
  validatePassword,
} from '../src/lib/validation.js'
import { initials } from '../src/lib/format.js'

test('email: required, well-formed, and pasted invisible characters ignored', () => {
  assert.equal(validateEmail('  '), 'Email is required.')
  assert.match(validateEmail('name@email'), /valid email/)
  assert.equal(validateEmail('name@email.com​'), '')
})

test('full name: letters and name punctuation only', () => {
  assert.equal(validateFullName(''), 'Full name is required.')
  assert.equal(validateFullName('Jo'), 'Full name is too short.')
  assert.match(validateFullName('Juan 2'), /letters only/)
  assert.equal(validateFullName("Dela Cruz, Juan-Paolo O'Neil"), '')
})

test('password: reports the first rule it fails', () => {
  assert.equal(validatePassword(''), 'Password is required.')
  assert.equal(validatePassword('short1A'), 'Password needs: at least 8 characters.')
  assert.equal(validatePassword('alllower1'), 'Password needs: one uppercase letter.')
  assert.equal(validatePassword('P@ssword123'), '')
})

test('confirm password and 8-digit code', () => {
  assert.equal(validateConfirm('a', ''), 'Please confirm your password.')
  assert.equal(validateConfirm('a', 'b'), 'Passwords do not match.')
  assert.equal(validateConfirm('a', 'a'), '')
  assert.notEqual(validateCode('1234567'), '')
  assert.equal(validateCode('12345678'), '')
  assert.notEqual(validateCode('123456'), '')
  assert.match(validateCode(''), /8 digits/)
})

test('initials from either name order', () => {
  assert.equal(initials('Juan Dela Cruz'), 'JD')
  assert.equal(initials('Dela Cruz, Juan'), 'DC')
})
