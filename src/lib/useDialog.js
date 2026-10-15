import { useEffect, useLayoutEffect, useRef } from 'react'

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Shared modal behaviour for the dialogs: Escape closes, Tab stays inside
 * the dialog, the page behind cannot scroll, and focus returns to whatever
 * opened the dialog once it closes.
 *
 * `onClose` is read through a ref. Callers pass inline arrow functions, so
 * listing it as an effect dependency re-ran the effect on every render and
 * moved focus back to the dialog each time.
 *
 * @param dialogRef  - ref on the role="dialog" element
 * @param onClose    - called on Escape
 * @param initialFocusRef - optional element to focus on open (else the dialog)
 */
export function useDialog(dialogRef, onClose, initialFocusRef) {
  const onCloseRef = useRef(onClose)
  useLayoutEffect(() => {
    onCloseRef.current = onClose
  })

  // Remembered once: StrictMode re-runs the effect after focus has moved in.
  const openerRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    openerRef.current ??= document.activeElement
    ;(initialFocusRef?.current ?? dialog)?.focus()

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') return onCloseRef.current?.()
      if (event.key !== 'Tab') return
      const focusable = [...(dialogRef.current?.querySelectorAll(FOCUSABLE) ?? [])]
      if (focusable.length === 0) {
        event.preventDefault()
        return dialogRef.current?.focus()
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      // Wait a tick: the opener may re-render as the dialog closes. Skip it if
      // the dialog is still on screen (a StrictMode re-run, not a close).
      setTimeout(() => {
        const opener = openerRef.current
        if (dialog?.isConnected) return
        if (opener instanceof HTMLElement && document.contains(opener)) opener.focus()
      }, 0)
    }
    // Runs once per dialog mount; see the note on onClose above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
