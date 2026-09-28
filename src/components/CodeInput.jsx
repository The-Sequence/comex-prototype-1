import { useRef } from 'react'

/**
 * Six single-digit boxes, grouped 3 + 3 like Frame 5. Digits only;
 * typing advances focus, Backspace steps back, and pasting a 6-digit code
 * fills every box.
 */
export default function CodeInput({ value, onChange, error }) {
  const refs = useRef([])
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? '')

  const setAt = (index, digit) => {
    const next = [...digits]
    next[index] = digit
    onChange(next.join('').slice(0, 6))
  }

  const handleChange = (index, raw) => {
    const clean = raw.replace(/\D/g, '')
    if (!clean) return setAt(index, '')
    if (clean.length > 1) return handlePaste(clean, index)
    setAt(index, clean)
    if (index < 5) refs.current[index + 1]?.focus()
  }

  const handlePaste = (text, start = 0) => {
    const clean = text.replace(/\D/g, '').slice(0, 6 - start)
    if (!clean) return
    const next = [...digits]
    clean.split('').forEach((d, i) => (next[start + i] = d))
    onChange(next.join(''))
    refs.current[Math.min(start + clean.length, 5)]?.focus()
  }

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus()
      setAt(index - 1, '')
      event.preventDefault()
    } else if (event.key === 'ArrowLeft' && index > 0) refs.current[index - 1]?.focus()
    else if (event.key === 'ArrowRight' && index < 5) refs.current[index + 1]?.focus()
  }

  return (
    <div className="flex items-center justify-center gap-2" role="group" aria-label="6-digit verification code">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          value={digit}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={6}
          aria-label={`Digit ${i + 1}`}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={(e) => {
            e.preventDefault()
            handlePaste(e.clipboardData.getData('text'), i)
          }}
          onFocus={(e) => e.target.select()}
          className={`h-10 w-9 rounded-sm border text-center text-lg font-semibold outline-none focus:ring-2 ${
            i === 3 ? 'ml-2' : ''
          } ${error ? 'border-red-500 focus:ring-red-200' : 'border-gray-500 focus:border-navy focus:ring-navy/20'}`}
        />
      ))}
    </div>
  )
}
