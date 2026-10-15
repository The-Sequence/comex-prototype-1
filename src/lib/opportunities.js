/* Volunteer opportunity posts — kept in this browser's localStorage only.
 * Same { success, data } / { success: false, error } contract as V2's adminRepository.
 * See docs/supabase-migration.md for moving this onto Supabase. */
import { useEffect, useState } from 'react'
import { SEED_OPPORTUNITY, opportunityErrors, visibleOpportunities } from './opportunityRules.js'

const KEY = 'comex-opportunities'
const EVENT = 'comex-opportunities-change'

function read() {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (raw === null) return [SEED_OPPORTUNITY]
    const list = JSON.parse(raw)
    return Array.isArray(list) ? list : [SEED_OPPORTUNITY]
  } catch {
    return [SEED_OPPORTUNITY]
  }
}

function write(list) {
  try { window.localStorage.setItem(KEY, JSON.stringify(list)) } catch { /* storage unavailable */ }
  window.dispatchEvent(new Event(EVENT))
}

const firstError = (errors) => Object.values(errors)[0]

/** The office's "+ New opportunity" composer. Poster details come from the signed-in user. */
export function createOpportunity(draft, user) {
  if (!user?.id) return { success: false, error: 'Please log in to post an opportunity.' }
  const errors = opportunityErrors(draft)
  if (Object.keys(errors).length) return { success: false, error: firstError(errors) }
  const opportunity = {
    id: globalThis.crypto?.randomUUID?.() ?? `opp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title: draft.title.trim(),
    caption: draft.caption?.trim() ?? '',
    postedBy: user.fullName,
    postedByRole: user.role,
    postedAt: new Date().toISOString(),
    audience: draft.audience ?? 'Everyone',
    imageUrl: null,
    likes: 0,
    shares: 0,
    isDeleted: false,
  }
  write([...read(), opportunity])
  return { success: true, data: opportunity }
}

/** Edits title, caption and audience of a live post. */
export function updateOpportunity(id, changes) {
  const errors = opportunityErrors(changes)
  if (Object.keys(errors).length) return { success: false, error: firstError(errors) }
  const list = read()
  const index = list.findIndex(o => o.id === id && !o.isDeleted)
  if (index === -1) return { success: false, error: 'Volunteer opportunity not found.' }
  const updated = { ...list[index], title: changes.title.trim(), caption: changes.caption?.trim() ?? '' }
  if (changes.audience != null) updated.audience = changes.audience
  write(list.map((o, i) => (i === index ? updated : o)))
  return { success: true, data: updated }
}

/** Soft delete, as in V2: the post disappears but its applications stay on record. */
export function deleteOpportunity(id) {
  const list = read()
  const index = list.findIndex(o => o.id === id && !o.isDeleted)
  if (index === -1) return { success: false, error: 'Volunteer opportunity not found.' }
  write(list.map((o, i) => (i === index ? { ...o, isDeleted: true } : o)))
  return { success: true }
}

/** Live feed for a viewer; `office` sees every audience. Updates across components and tabs. */
export function useOpportunities(options) {
  const [all, setAll] = useState(read)
  useEffect(() => {
    const sync = () => setAll(read())
    window.addEventListener(EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])
  return visibleOpportunities(all, options)
}
