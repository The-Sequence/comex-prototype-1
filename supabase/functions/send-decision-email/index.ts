import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const reply = (status: number, value: unknown) => new Response(JSON.stringify(value), {
  status, headers: { ...cors, 'Content-Type': 'application/json' },
})
Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (request.method !== 'POST') return reply(405, { error: 'Method not allowed' })
  const token = request.headers.get('Authorization')?.replace(/^Bearer /i, '')
  if (!token) return reply(401, { error: 'Sign in required' })
  const url = Deno.env.get('SUPABASE_URL')!
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })
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
    return reply(403, { error: 'Only the COMEX Head can send decision emails' })
  }
  let decisionId: string
  try {
    const body = await request.json()
    decisionId = body.decisionId
    if (typeof decisionId !== 'string' || !/^[0-9a-f-]{36}$/i.test(decisionId)) throw new Error()
  } catch { return reply(400, { error: 'Invalid decision' }) }
  const { data: decision, error: readError } = await admin.from('account_decisions').select('*').eq('id', decisionId).single()
  if (readError || !decision) return reply(404, { error: 'Decision not found' })
  if (decision.email_status === 'sent') return reply(200, { emailStatus: 'sent' })
  // Atomic claim stops simultaneous retries. A stale claim can be retried after five minutes.
  const cutoff = new Date(Date.now() - 300000).toISOString()
  const { data: claimed, error: claimError } = await admin.from('account_decisions')
    .update({ email_status: 'sending', email_claimed_at: new Date().toISOString() })
    .eq('id', decisionId).or('email_status.in.(pending,failed),and(email_status.eq.sending,email_claimed_at.lt.' + cutoff + ')')
    .select('id').maybeSingle()
  if (claimError || !claimed) return reply(409, { emailStatus: 'sending' })
  try {
    const { data: profile, error } = await admin.from('profiles').select('full_name,email').eq('id', decision.user_id).single()
    if (error || !profile) throw new Error('Recipient unavailable')
    const approved = decision.decision === 'approved'
    const subject = approved ? 'Your COMEX account is approved' : 'Update on your COMEX registration'
    const text = 'Hello ' + profile.full_name + ',\n\n' + (approved
      ? 'Your COMEX account has been approved. You can now sign in and open your assigned dashboard.'
      : 'Your COMEX registration was not approved. Please contact the COMEX office if you need assistance.')
      + (!approved && decision.reason ? '\n\nMessage from the COMEX office:\n' + decision.reason : '')
      + '\n\nCOMEX Office'
    const key = Deno.env.get('RESEND_API_KEY')
    if (!key) throw new Error('Mail service is not configured')
    const sent = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      signal: AbortSignal.timeout(15000),
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', 'Idempotency-Key': 'comex-decision-' + decisionId },
      body: JSON.stringify({ from: Deno.env.get('MAIL_FROM') || 'COMEX Office <noreply@algovista.dev>', to: [profile.email], subject, text }),
    })
    if (!sent.ok) throw new Error('Mail provider rejected delivery (' + sent.status + ')')
    const { error: saveError } = await admin.from('account_decisions').update({
      email_status: 'sent', email_error: null, email_sent_at: new Date().toISOString(),
    }).eq('id', decisionId)
    if (saveError) throw new Error('Delivery status could not be saved')
    return reply(200, { emailStatus: 'sent' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Email delivery failed'
    await admin.from('account_decisions').update({ email_status: 'failed', email_error: message }).eq('id', decisionId)
    return reply(502, { emailStatus: 'failed', error: message })
  }
})
