/* Filling a COMEX form: which questions a PDF has, how complete the answers
 * are, and the stamped PDF itself. Ported from comex-frontend-v2's Forms
 * screen and PdfFillEditor, minus the drag-and-drop canvas. */
import { getFieldsForFile } from './forms/formFields.js'
import { isAnswered, isFieldVisible, isOutOfRange, readFieldAnswer } from './forms/formFieldAnswers.js'
import { buildFilledPdfBytes } from './forms/documentExport.js'

/** The questions for a bundled file. A replacement template that changed the layout has none. */
export function definitionsFor(fileName, activeVersion = null) {
  if (activeVersion && !activeVersion.keepLayout) return []
  return getFieldsForFile(fileName).filter((d) => d && d.type)
}

/** Current answer per definition id, for visibility rules and progress. */
export function answersFrom(definitions, fields) {
  return Object.fromEntries(definitions.map((d) => [d.id, readFieldAnswer({ definition: d, fields })]))
}

/** Questions grouped by their printed section, in order, hiding those whose condition is unmet. */
export function visibleSections(definitions, fields) {
  const answers = answersFrom(definitions, fields)
  const sections = []
  for (const definition of [...definitions].sort((a, b) => (a.page - b.page) || (a.order - b.order))) {
    if (!isFieldVisible({ definition, answers })) continue
    const title = definition.section ?? `Page ${definition.page + 1}`
    let section = sections.find((s) => s.title === title)
    if (!section) sections.push(section = { title, definitions: [] })
    section.definitions.push(definition)
  }
  return sections
}

/** Required questions still blank, and typed answers outside their limits. */
export function fillProblems(definitions, fields) {
  const answers = answersFrom(definitions, fields)
  const visible = definitions.filter((definition) => isFieldVisible({ definition, answers }))
  const missing = visible.filter((d) => d.required && !isAnswered({ definition: d, value: answers[d.id] }))
  const outOfRange = visible.filter((d) => isOutOfRange(d, answers[d.id]))
  const answered = visible.filter((d) => isAnswered({ definition: d, value: answers[d.id] })).length
  return { missing, outOfRange, answered, total: visible.length }
}

/** Fetches the PDF and draws the answers on it; long answers go on labelled continuation sheets. */
export async function buildFilledPdf({ fileUrl, definitions, fields, fetcher = fetch }) {
  const response = await fetcher(fileUrl)
  if (!response.ok) throw new Error('The blank form could not be loaded. Check your connection and try again.')
  const sourceBytes = new Uint8Array(await response.arrayBuffer())
  const bytes = await buildFilledPdfBytes({ sourceBytes, fields, definitions, acceptContinuations: true })
  return new Blob([bytes], { type: 'application/pdf' })
}
