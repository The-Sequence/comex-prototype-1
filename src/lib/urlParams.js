import { validateEmail } from './validation.js'

/* Query-string helpers for URL-backed screen state. Pure functions so they
 * can be tested in plain Node (tests/urlParams.test.mjs). */

/**
 * Returns `search` with one parameter changed and every other one kept.
 * A value equal to the default is removed, so an unfiltered screen keeps a
 * clean URL. The result is '' or starts with '?'.
 */
export function withSearchParam(search, name, value, defaultValue = '') {
  const params = new URLSearchParams(search)
  if (value === defaultValue || value === '') params.delete(name)
  else params.set(name, value)
  const next = params.toString()
  return next ? `?${next}` : ''
}

/**
 * Email carried in `?email=` so a code screen survives a reload or an email
 * deep link. It is only a prefill: validated for shape, normalised, and it
 * grants nothing. The code itself is checked by the backend.
 */
export function emailFromSearch(search) {
  const raw = new URLSearchParams(search).get('email')
  if (!raw || raw.length > 254 || validateEmail(raw)) return ''
  return raw.trim().toLowerCase()
}

/** `/verify-email?email=...`. Never put a password or code in this URL. */
export const codeScreenUrl = (path, email) => `${path}?email=${encodeURIComponent(email)}`
