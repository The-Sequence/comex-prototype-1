/* Pure slot helpers for the verification-code boxes. The value is a string
 * where an empty box is a space, so editing the middle never shifts later
 * digits. A value with a space is never a complete code (validateCode). */

/** Fixed-length array of single digits, '' for an empty box. */
export const toSlots = (value, length) =>
  Array.from({ length }, (_, i) => (/\d/.test(value[i] ?? '') ? value[i] : ''))

/** Back to a string: empty boxes become spaces, trailing spaces dropped. */
export const fromSlots = (slots) => slots.map((d) => d || ' ').join('').trimEnd()

/** Sets (or clears, with '') one box. */
export function setSlot(value, length, index, digit) {
  const slots = toSlots(value, length)
  slots[index] = digit
  return fromSlots(slots)
}

/**
 * Pastes digits starting at a box, overwriting forward and never past the
 * last box. Returns the new value and the box to focus next.
 */
export function pasteSlots(value, length, start, text) {
  const digits = text.replace(/\D/g, '').slice(0, length - start)
  if (!digits) return { value, focus: start }
  const slots = toSlots(value, length)
  digits.split('').forEach((d, i) => (slots[start + i] = d))
  return { value: fromSlots(slots), focus: Math.min(start + digits.length, length - 1) }
}
