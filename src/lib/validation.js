/* Form validation rules shared by every auth screen.
 * Each validator returns an error message, or '' when the value is valid. */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function validateEmail(raw) {
  const value = raw.replace(/[\u200B-\u200D\uFEFF]/g, '') // strip invisible characters from pasted text
  if (!value.trim()) return 'Email is required.'
  if (!EMAIL_PATTERN.test(value.trim())) return 'Enter a valid email address (e.g. name@email.com).'
  return ''
}

export function validateFullName(value) {
  const name = value.trim()
  if (!name) return 'Full name is required.'
  if (name.length < 3) return 'Full name is too short.'
  if (!/^[A-Za-zÀ-ÿñÑ.,'\- ]+$/.test(name)) return 'Use letters only (commas, periods and hyphens are allowed).'
  return ''
}

export const PASSWORD_RULES = [
  { test: (p) => p.length >= 8, label: 'At least 8 characters' },
  { test: (p) => /[A-Z]/.test(p), label: 'One uppercase letter' },
  { test: (p) => /[a-z]/.test(p), label: 'One lowercase letter' },
  { test: (p) => /\d/.test(p), label: 'One number' },
]

export function validatePassword(value) {
  if (!value) return 'Password is required.'
  const failed = PASSWORD_RULES.find((rule) => !rule.test(value))
  return failed ? `Password needs: ${failed.label.toLowerCase()}.` : ''
}

export function validateConfirm(password, confirm) {
  if (!confirm) return 'Please confirm your password.'
  if (password !== confirm) return 'Passwords do not match.'
  return ''
}

export function validateCode(code) {
  if (!/^\d{6}$/.test(code)) return 'Enter all 6 digits of the code.'
  return ''
}
