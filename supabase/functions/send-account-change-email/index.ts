import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const reply = (status: number, value: unknown) => new Response(JSON.stringify(value), {
  status, headers: { ...cors, 'Content-Type': 'application/json' },
})

// Head-only: emails a user about their unsent role/status changes (content comes from the audit rows).
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
    return reply(403, { error: 'Only the COMEX Head can send account notices' })
  }
  let userId: string
  try {
    userId = (await request.json()).userId
    if (typeof userId !== 'string' || !/^[0-9a-f-]{36}$/i.test(userId)) throw new Error()
  } catch { return reply(400, { error: 'Invalid request' }) }

  const { data: changes } = await admin.from('account_changes').select('id,field,new_value,created_at')
    .eq('user_id', userId).in('field', ['role', 'status']).is('notified_at', null).order('created_at')
  if (!changes?.length) return reply(200, { emailStatus: 'sent', nothingToSend: true })
  const { data: profile } = await admin.from('profiles').select('full_name,email').eq('id', userId).single()
  if (!profile) return reply(404, { error: 'Account not found' })

  // Only the latest value of each field matters to the reader.
  const latest: Record<string, string> = {}
  for (const c of changes) latest[c.field] = c.new_value
  const lines: string[] = []
  if (latest.role) lines.push('Your COMEX role is now ' + latest.role + '. You will see your new dashboard the next time you open COMEX.')
  if (latest.status === 'inactive') lines.push('Your COMEX account has been set to inactive. You cannot sign in until the COMEX office makes it active again.')
  if (latest.status === 'approved') lines.push('Your COMEX account is active again. You can sign in as usual.')
  const text = 'Hello ' + profile.full_name + ',\n\n' + lines.join('\n\n') +
    '\n\nContact the COMEX office if you have questions.\n\nCOMEX Office'
  const key = Deno.env.get('RESEND_API_KEY')
  if (!key) return reply(502, { emailStatus: 'failed', error: 'Mail service is not configured' })
  try {
    const sent = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      signal: AbortSignal.timeout(15000),
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', 'Idempotency-Key': 'comex-change-' + changes[0].id },
      body: JSON.stringify({ from: Deno.env.get('MAIL_FROM') || 'COMEX Office <noreply@algovista.dev>', to: [profile.email], subject: 'Update to your COMEX account', text }),
    })
    if (!sent.ok) return reply(502, { emailStatus: 'failed', error: 'Mail provider rejected delivery (' + sent.status + ')' })
  } catch { return reply(502, { emailStatus: 'failed', error: 'Mail delivery timed out' }) }
  await admin.from('account_changes').update({ notified_at: new Date().toISOString() }).in('id', changes.map(c => c.id))
  return reply(200, { emailStatus: 'sent' })
})
