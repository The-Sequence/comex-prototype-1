import { useRef } from 'react'
import { CODE_LENGTH } from '../config/otp'
import { pasteSlots, setSlot, toSlots } from '../lib/codeSlots'

/**
 * One single-digit box per code digit (CODE_LENGTH), grouped in halves like Frame 5. Digits only;
 * typing advances focus, Backspace steps back, and pasting a full code
 * fills every box.
 */
export default function CodeInput({ value, onChange, error }) {
  const refs = useRef([])
  const digits = toSlots(value, CODE_LENGTH)

  const setAt = (index, digit) => onChange(setSlot(value, CODE_LENGTH, index, digit))

  const handleChange = (index, raw) => {
    const clean = raw.replace(/\D/g, '')
    if (!clean) return setAt(index, '')
    if (clean.length > 1) return handlePaste(clean, index)
    setAt(index, clean)
    if (index < CODE_LENGTH - 1) refs.current[index + 1]?.focus()
  }

  const handlePaste = (text, start = 0) => {
    const result = pasteSlots(value, CODE_LENGTH, start, text)
    onChange(result.value)
    refs.current[result.focus]?.focus()
  }

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus()
      setAt(index - 1, '')
      event.preventDefault()
    } else if (event.key === 'ArrowLeft' && index > 0) refs.current[index - 1]?.focus()
    else if (event.key === 'ArrowRight' && index < CODE_LENGTH - 1) refs.current[index + 1]?.focus()
  }

  return (
    <div className="flex items-center justify-center gap-1.5" role="group" aria-label={`${CODE_LENGTH}-digit verification code`}>
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          value={digit}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={CODE_LENGTH}
          aria-label={`Digit ${i + 1}`}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={(e) => {
            e.preventDefault()
            handlePaste(e.clipboardData.getData('text'), i)
          }}
          onFocus={(e) => e.target.select()}
          className={`h-10 w-8 rounded-sm border text-center text-lg font-semibold outline-none focus:ring-2 ${
            i === CODE_LENGTH / 2 ? 'ml-2' : ''
          } ${error ? 'border-red-500 focus:ring-red-200' : 'border-gray-500 focus:border-navy focus:ring-navy/20'}`}
        />
      ))}
    </div>
  )
}
