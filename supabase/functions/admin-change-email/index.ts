import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const reply = (status: number, value: unknown) => new Response(JSON.stringify(value), {
  status, headers: { ...cors, 'Content-Type': 'application/json' },
})
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PRIVILEGED = ['COMEX Head', 'COMEX Associate', 'Approver']

// Head-only: changes another account's sign-in email (kept confirmed) and records it.
Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (request.method !== 'POST') return reply(405, { error: 'Method not allowed' })
  const token = request.headers.get('Authorization')?.replace(/^Bearer /i, '')
  if (!token) return reply(401, { error: 'Sign in required' })
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })
  const { data: auth, error: authError } = await admin.auth.getUser(token)
  if (authError || !auth.user) return reply(401, { error: 'Sign in required' })
  try {
    const claims = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    if (!claims.amr?.some((item: { method: string }) => item.method === 'password')) {
      return reply(403, { error: 'Sign in with your password first' })
    }
  } catch { return reply(401, { error: 'Invalid session' }) }
  const { data: head } = await admin.from('profiles').select('role,status,email_verified_at').eq('id', auth.user.id).single()
  if (head?.role !== 'COMEX Head' || head.status !== 'approved' || !head.email_verified_at) {
    return reply(403, { error: 'Only the COMEX Head can change account emails' })
  }
  let userId: string, email: string
  try {
    const body = await request.json()
    userId = body.userId
    email = String(body.email ?? '').trim().toLowerCase()
    if (typeof userId !== 'string' || !/^[0-9a-f-]{36}$/i.test(userId)) throw new Error()
    if (email.length > 254 || !EMAIL.test(email)) return reply(400, { error: 'Enter a valid email address.' })
  } catch { return reply(400, { error: 'Invalid request' }) }
  if (userId === auth.user.id) return reply(403, { error: 'You cannot change your own email here.' })
  const { data: target } = await admin.from('profiles').select('email,role,status').eq('id', userId).single()
  if (!target) return reply(404, { error: 'Account not found.' })
  if (!['approved', 'inactive'].includes(target.status)) return reply(409, { error: 'Only decided accounts can be managed here.' })
  if (PRIVILEGED.includes(target.role)) return reply(403, { error: 'This account\'s email cannot be changed here.' })
  if (target.email === email) return reply(200, { email })
  const { error: updateError } = await admin.auth.admin.updateUserById(userId, { email, email_confirm: true })
  if (updateError) {
    const taken = /already|registered|exists/i.test(updateError.message)
    return reply(taken ? 409 : 502, { error: taken ? 'Another account already uses that email.' : 'The email could not be changed. Please try again.' })
  }
  await admin.from('account_changes').insert({ user_id: userId, changed_by: auth.user.id, field: 'email', old_value: target.email, new_value: email })
  return reply(200, { email })
})
