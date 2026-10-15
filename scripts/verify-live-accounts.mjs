import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
assert.ok(url?.includes('ihswqpgvrcnofrnccwbs'), 'Use the isolated account service project only')
assert.ok(key, 'A publishable key is required')
const password = process.env.COMEX_ACCOUNT_PASSWORD
assert.ok(password, 'Set COMEX_ACCOUNT_PASSWORD (not stored in the repository)')
const client = () => createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
const anon = client()
const anonymous = await anon.from('profiles').select('*')
assert.ok(anonymous.error || anonymous.data.length === 0, 'Anonymous users cannot read profiles')
const unauthMail = await anon.functions.invoke('send-decision-email', { body: { decisionId: crypto.randomUUID() } })
assert.ok(unauthMail.error, 'Email function rejects unauthenticated calls')
console.log('PASS anonymous profile/email restrictions')

for (const [actor, role] of [['head', 'COMEX Head'], ['volunteer', 'Volunteer'], ['comexrep', 'COMEX Representative'], ['approver', 'Approver']]) {
  const c = client()
  const { data, error } = await c.auth.signInWithPassword({ email: actor + '@comex.com', password })
  assert.equal(error, null, actor + ' signs in')
  const { data: rows, error: readError } = await c.from('profiles').select('*')
  assert.equal(readError, null)
  const own = rows.find(row => row.id === data.user.id)
  assert.equal(own.role, role)
  assert.equal(own.status, 'approved')
  if (actor !== 'head') assert.equal(rows.length, 1, actor + ' cannot read other registrations')
  const write = await c.from('profiles').update({ status: 'rejected' }).eq('id', data.user.id)
  assert.ok(write.error, 'Direct profile edits blocked')
  const decision = await c.rpc('decide_registration', { p_user: data.user.id, p_decision: 'approved', p_reason: null })
  assert.ok(decision.error, 'Self approval/non-Head decisions blocked')
  if (actor !== 'head') {
    const mail = await c.functions.invoke('send-decision-email', { body: { decisionId: crypto.randomUUID() } })
    assert.ok(mail.error, 'Non-Head decision emails blocked')
  }
  await c.auth.signOut({ scope: 'local' })
  console.log('PASS ' + actor + ': live authentication, correct role, RLS and decision restrictions')
}
const bad = await client().auth.signInWithPassword({ email: 'head@comex.com', password: 'Incorrect123!' })
assert.ok(bad.error, 'Wrong password is rejected')
console.log('PASS invalid credentials')
