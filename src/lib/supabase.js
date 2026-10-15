import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '../config/backend.js'

const url = import.meta.env?.VITE_SUPABASE_URL ?? SUPABASE_URL
const key = import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY ?? SUPABASE_PUBLISHABLE_KEY
// Never connect this app to the main COMEX project.
const isolated = url && !url.includes('wwoaeohoinciirnrnlvl')
export const backendMode = isolated && key ? 'live' : 'unconfigured'
export const supabase = backendMode === 'live'
  ? createClient(url, key, { auth: { storageKey: 'comex-auth', detectSessionInUrl: false } })
  : null

export function requireBackend() {
  if (!supabase) throw new Error('The COMEX account service is not configured. Please contact the COMEX office.')
  return supabase
}
