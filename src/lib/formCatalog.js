/* Pure helpers for the COMEX form library: language codes, bundled file
 * names and search. Ported from comex-frontend-v2 (src/config/comexForms.js
 * and src/pages/Forms.jsx). */

export const LANGUAGES = { en: 'English', fil: 'Filipino' }

const codeFor = (label) => Object.keys(LANGUAGES).find((code) => LANGUAGES[code] === label) ?? label

/** The form number inside a code such as 'COMEX Form 002', or null for MOA / SARF. */
export function formNumber(code) {
  return /^COMEX Form (\d{3})$/.exec(code ?? '')?.[1] ?? null
}

/** Every language a catalogue entry exists in, with its bundled PDF. */
export function formVariants(form) {
  const number = formNumber(form?.code)
  if (!number) return []
  return (form.variants ?? []).map((label) => {
    const lang = codeFor(label)
    const fileName = `comex-form-${number}-${lang}.pdf`
    return { lang, label: LANGUAGES[lang] ?? label, fileName, fileUrl: `/forms/${fileName}` }
  })
}

/** V2's search: matches the code, the number on its own, title or description. */
export function searchFormGroups(groups, query) {
  const words = String(query ?? '').toLowerCase().split(/\s+/).filter(Boolean)
  if (!words.length) return groups
  return groups
    .map((group) => ({
      ...group,
      forms: group.forms.filter((form) => {
        const haystack = [form.code, form.title, form.description, form.usedAtSteps, group.title].join(' ').toLowerCase()
        return words.every((word) => haystack.includes(word))
      }),
    }))
    .filter((group) => group.forms.length > 0)
}

/** Download name for a filled copy, e.g. 'COMEX-Form-002-fil-filled.pdf'. */
export function filledFileName(code, lang) {
  return `${String(code).replace(/[^\w-]+/g, '-')}-${lang}-filled.pdf`
}
