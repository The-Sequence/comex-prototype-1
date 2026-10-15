/* Volunteer opportunity rules ported from comex-frontend-v2 (adminRepository.js,
 * userRepository.js canRoleSeeAudience). Pure functions so they can be unit tested. */

export const AUDIENCES = ['Everyone', 'For Students only', 'For Faculty only', 'For ASP only', 'For COMEX Representatives only']

export const TITLE_MAX = 120
export const CAPTION_MAX = 1000

/** The post every new browser starts with — the EcoWays drive from the Figma frames. */
export const SEED_OPPORTUNITY = {
  id: 'ecoways-clean-green',
  title: 'Join EcoWays: Clean and Green Initiative',
  caption: 'Be part of EcoWays’ clean-up drive and help create a cleaner, greener community.',
  postedBy: 'System Administrator',
  postedByRole: 'Admin/COMEX head',
  postedAt: '2026-05-01T00:00:00.000Z',
  audience: 'Everyone',
  imageUrl: 'ecoways-poster',
  likes: 21,
  shares: 3,
  isDeleted: false,
}

/** Field errors for the post composer; empty object means valid. */
export function opportunityErrors({ title, caption, audience } = {}) {
  const errors = {}
  if (!title?.trim()) errors.title = 'Project Title is required.'
  else if (title.trim().length > TITLE_MAX) errors.title = `Keep the title under ${TITLE_MAX} characters.`
  if ((caption ?? '').trim().length > CAPTION_MAX) errors.caption = `Keep the caption under ${CAPTION_MAX} characters.`
  if (audience != null && !AUDIENCES.includes(audience)) errors.audience = 'Choose who can see this post.'
  return errors
}

/** Whether a post targeted at `audience` should be visible to `role`. Unknown audiences fail open, as in V2. */
export function canRoleSeeAudience(role, audience) {
  if (!audience || audience === 'Everyone') return true
  if (audience === 'For COMEX Representatives only') return String(role).startsWith('COMEX Representative')
  if (audience === 'For Students only') return role === 'Student'
  if (audience === 'For Faculty only') return role === 'Faculty'
  if (audience === 'For ASP only') return role === 'ASP'
  return true
}

/** Case-insensitive match on title or caption; a blank query matches everything. */
export function matchesSearch(opportunity, query) {
  const q = (query ?? '').trim().toLowerCase()
  if (!q) return true
  return `${opportunity.title} ${opportunity.caption ?? ''}`.toLowerCase().includes(q)
}

/** Live posts, newest first (ties by id, like V2's order by posted_at desc, id). */
export function visibleOpportunities(list, { role, office = false, query = '' } = {}) {
  return list
    .filter(o => !o.isDeleted)
    .filter(o => office || canRoleSeeAudience(role, o.audience))
    .filter(o => matchesSearch(o, query))
    .sort((a, b) => b.postedAt.localeCompare(a.postedAt) || a.id.localeCompare(b.id))
}

/** "May 1, 2026" */
export function postedDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}
