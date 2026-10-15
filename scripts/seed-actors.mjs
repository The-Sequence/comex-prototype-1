import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL } from '../src/config/backend.js'

// Explicitly scoped to this account service project. Run server-side only.
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!key) throw new Error('Set the service-role key in the process environment.')
const password = process.env.COMEX_ACCOUNT_PASSWORD
if (!password) throw new Error('Set COMEX_ACCOUNT_PASSWORD before seeding.')
const admin = createClient(SUPABASE_URL, key, { auth: { persistSession: false } })
const actors = [
  ['head@comex.com', 'COMEX Head', 'COMEX', 'COMEX Head'],
  ['volunteer@comex.com', 'Juan Dela Cruz', 'SET', 'Volunteer'],
  ['comexrep@comex.com', 'Mavi Sia', 'SET', 'COMEX Representative'],
  ['approver@comex.com', 'Elena Ramos', 'SET', 'Approver'],
]
for (const [email, full_name, department, role] of actors) {
  const existing = await admin.from('profiles').select('id').eq('email', email).maybeSingle()
  if (existing.error) throw existing.error
  if (existing.data) { console.log('Preserved existing actor: ' + email); continue }
  const { data, error } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { full_name, department: 'SET', role: 'Student' },
  })
  if (error) throw error
  const updated = await admin.from('profiles').update({ role, department, status: 'approved', decided_at: new Date().toISOString() }).eq('id', data.user.id)
  if (updated.error) throw updated.error
  console.log('Created approved actor: ' + email)
}
