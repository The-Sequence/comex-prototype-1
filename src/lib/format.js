/** "Dela Cruz, Juan" or "Juan Dela Cruz" -> "JD" style initials for avatars. */
export function initials(name) {
  return name
    .split(/[\s,]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}
