import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PDFDocument } from 'pdf-lib'
import { COMEX_FORM_GROUPS } from '../src/data/comexForms.js'
import { filledFileName, formNumber, formVariants, searchFormGroups } from '../src/lib/formCatalog.js'
import { buildFilledPdf, definitionsFor, fillProblems, visibleSections } from '../src/lib/formFill.js'
import { applyFieldAnswer, readFieldAnswer } from '../src/lib/forms/formFieldAnswers.js'
import { attachFilledForm, getActiveVersion, getDraft, listAttachedForms, listDrafts, publishFormVersion, removeDraft, revertToBundledForm, saveDraft } from '../src/lib/formStore.js'

const memory = () => {
  const m = new Map()
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) }
}
const all = COMEX_FORM_GROUPS.flatMap((g) => g.forms)
const find = (code) => all.find((f) => f.code === code)

test('every catalogue variant points at a bundled PDF with fillable questions', async () => {
  for (const form of all) {
    for (const variant of formVariants(form)) {
      await readFile(new URL(`../public${variant.fileUrl}`, import.meta.url))
      assert.ok(definitionsFor(variant.fileName).length > 0, variant.fileName)
    }
  }
  assert.deepEqual(formVariants(find('COMEX Form 017')).map((v) => v.lang), ['fil'])
  assert.deepEqual(formVariants(find('SARF')), [])
  assert.equal(formNumber('COMEX Form 002'), '002')
  assert.equal(filledFileName('COMEX Form 002', 'fil'), 'COMEX-Form-002-fil-filled.pdf')
})

test('search matches the code, the bare number and the title', () => {
  const count = (q) => searchFormGroups(COMEX_FORM_GROUPS, q).flatMap((g) => g.forms).length
  assert.equal(count(''), all.length)
  assert.equal(count('010'), 1)
  assert.equal(count('attendance sheet'), 1)
  assert.equal(count('nothing like this'), 0)
})

test('answers round-trip and required questions are reported', () => {
  const definitions = definitionsFor('comex-form-011-en.pdf')
  const date = definitions.find((d) => d.id === 'date')
  let fields = applyFieldAnswer({ definition: date, value: '2026-10-15', fields: [] }).fields
  assert.equal(readFieldAnswer({ definition: date, fields }), '2026-10-15')
  const before = fillProblems(definitions, fields)
  assert.ok(before.missing.length > 0)
  assert.equal(before.answered, 1)
  assert.ok(visibleSections(definitions, fields).length > 0)
  fields = applyFieldAnswer({ definition: date, value: '', fields }).fields
  assert.equal(fields.length, 0)
})

test('a filled PDF keeps the original pages', async () => {
  const definitions = definitionsFor('comex-form-011-en.pdf')
  const fields = applyFieldAnswer({ definition: definitions.find((d) => d.id === 'organization'), value: 'Barangay Lagro', fields: [] }).fields
  const bytes = await readFile(new URL('../public/forms/comex-form-011-en.pdf', import.meta.url))
  const fetcher = async () => ({ ok: true, arrayBuffer: async () => bytes })
  const blob = await buildFilledPdf({ fileUrl: 'x', definitions, fields, fetcher })
  const pdf = await PDFDocument.load(new Uint8Array(await blob.arrayBuffer()))
  assert.equal(pdf.getPageCount(), 1)
})

test('drafts are per form and language, and can be attached to a step', () => {
  const s = memory()
  assert.equal(saveDraft({ formCode: '' }, s).success, false)
  saveDraft({ formCode: 'COMEX Form 002', language: 'en', fields: [{ definitionId: 'a', text: 'x' }] }, s)
  saveDraft({ formCode: 'COMEX Form 002', language: 'fil', fields: [] }, s)
  assert.equal(listDrafts(s).length, 2)
  assert.equal(getDraft('COMEX Form 002', 'en', s).fields[0].text, 'x')
  assert.equal(attachFilledForm({ projectId: 'p1', stepId: 's4', formCode: 'COMEX Form 002', language: 'fil' }, s).success, false)
  const attached = attachFilledForm({ projectId: 'p1', stepId: 's4', formCode: 'COMEX Form 002', language: 'en' }, s)
  assert.equal(attached.success, true)
  removeDraft('COMEX Form 002', 'en', s)
  assert.equal(getDraft('COMEX Form 002', 'en', s), null)
  assert.equal(listAttachedForms('p1', 's4', s)[0].fields[0].text, 'x')
})

test('replacement templates publish, and revert to the bundled original', () => {
  const s = memory()
  assert.equal(publishFormVersion({ formCode: 'COMEX Form 010', dataUrl: 'data:image/png;base64,' }, s).success, false)
  publishFormVersion({ formCode: 'COMEX Form 010', dataUrl: 'data:application/pdf;base64,AA' }, s)
  publishFormVersion({ formCode: 'COMEX Form 010', dataUrl: 'data:application/pdf;base64,BB', keepLayout: false }, s)
  assert.equal(getActiveVersion('COMEX Form 010', 'en', s).version, 2)
  assert.deepEqual(definitionsFor('comex-form-010-en.pdf', getActiveVersion('COMEX Form 010', 'en', s)), [])
  revertToBundledForm('COMEX Form 010', 'en', s)
  assert.equal(getActiveVersion('COMEX Form 010', 'en', s), null)
})
