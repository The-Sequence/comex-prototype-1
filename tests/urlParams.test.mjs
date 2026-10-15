import { test } from 'node:test'
import assert from 'node:assert/strict'
import { withSearchParam } from '../src/lib/urlParams.js'

test('a value is added without disturbing other parameters', () => {
  assert.equal(withSearchParam('?account=7', 'department', 'SET', ''), '?account=7&department=SET')
})

test('a value equal to the default is dropped from the URL', () => {
  assert.equal(withSearchParam('?department=SET&account=7', 'department', '', ''), '?account=7')
  assert.equal(withSearchParam('?tab=all', 'tab', 'all', 'all'), '')
})

test('an existing value is replaced in place', () => {
  assert.equal(withSearchParam('?department=SET', 'department', 'SBA', ''), '?department=SBA')
})

test('an empty query string stays empty when nothing changes', () => {
  assert.equal(withSearchParam('', 'department', '', ''), '')
})

import { codeScreenUrl, emailFromSearch } from '../src/lib/urlParams.js'

test('code-screen email prefill is validated and normalised', () => {
  assert.equal(emailFromSearch('?email=Name%40Email.com'), 'name@email.com')
  assert.equal(emailFromSearch('?email=not-an-email'), '')
  assert.equal(emailFromSearch(''), '')
  assert.equal(emailFromSearch('?email=' + 'a'.repeat(260) + '%40x.com'), '')
  assert.equal(codeScreenUrl('/verify-email', 'a+b@x.com'), '/verify-email?email=a%2Bb%40x.com')
})
