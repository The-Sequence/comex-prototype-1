/* COMEX Forms dialogs — fill in a form, preview a PDF and replace a template.
 * Ported from comex-frontend-v2 (DocumentWorkspace, FormFieldsPanel,
 * DocumentPreviewPane and FormTemplateManager) using V1's Modal and Form
 * controls. Data stays in this browser; see src/lib/formStore.js. */
import { useEffect, useMemo, useState } from 'react'
import { Download, Eye, Printer, RotateCcw, Save, Trash2, Upload } from 'lucide-react'
import { Modal } from '../Applications'
import { Alert, OutlineButton, PrimaryButton } from '../Form'
import FormQuestion from './FormQuestion'
import { applyFieldAnswer, readFieldAnswer } from '../../lib/forms/formFieldAnswers.js'
import { triggerDownload } from '../../lib/forms/documentExport.js'
import { buildFilledPdf, definitionsFor, fillProblems, visibleSections } from '../../lib/formFill'
import { filledFileName } from '../../lib/formCatalog'
import { MAX_TEMPLATE_BYTES, activateFormVersion, getDraft, listFormVersions, publishFormVersion, removeDraft, revertToBundledForm, saveDraft } from '../../lib/formStore'

const formatDateTime = (iso) => new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })

/** Shows a PDF (a URL or a Blob) inside the dialog, with download and print. */
export function PdfPreviewDialog({ title, subtitle, source, fileName, onClose }) {
  const [url, setUrl] = useState(null)
  useEffect(() => {
    // Browsers refuse to frame data: PDFs (uploaded templates), so every source becomes an object URL.
    let objectUrl
    let live = true
    const blob = typeof source === 'string' ? fetch(source).then((r) => r.blob()) : Promise.resolve(source)
    blob.then((b) => {
      if (!live) return
      objectUrl = URL.createObjectURL(b)
      setUrl(objectUrl)
    })
    return () => {
      live = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [source])
  const print = () => {
    const frame = document.createElement('iframe')
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'
    frame.onload = () => {
      try { frame.contentWindow.print() } catch { window.open(url, '_blank', 'noopener') }
      setTimeout(() => frame.remove(), 60000)
    }
    frame.src = url
    document.body.appendChild(frame)
  }
  return (
    <Modal title={title} subtitle={subtitle} size="max-w-4xl" z="z-[60]" onClose={onClose} footer={
      <>
        <OutlineButton type="button" onClick={print} className="inline-flex items-center gap-2"><Printer className="size-4" /> Print</OutlineButton>
        <a href={url ?? undefined} download={fileName} className="inline-flex items-center gap-2 rounded-full bg-navy px-8 py-2 text-sm font-semibold text-white hover:bg-navy-dark">
          <Download className="size-4" /> Download PDF
        </a>
      </>
    }>
      {url && <iframe title={title} src={url} className="h-[65vh] w-full border border-gray-300" />}
    </Modal>
  )
}

/** Fill in one form. Answers save as a local draft per form and language. */
export function FormFillDialog({ form, variant, activeVersion, user, onClose, onToast }) {
  const fileUrl = activeVersion?.dataUrl ?? variant.fileUrl
  const definitions = useMemo(() => definitionsFor(variant.fileName, activeVersion), [variant.fileName, activeVersion])
  const saved = getDraft(form.code, variant.lang)
  const [fields, setFields] = useState(saved?.fields ?? [])
  const [dirty, setDirty] = useState(false)
  const [showErrors, setShowErrors] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(null)

  const sections = visibleSections(definitions, fields)
  const problems = fillProblems(definitions, fields)
  const errorFor = (d) => {
    if (problems.outOfRange.includes(d)) return 'This answer is outside the range the form allows.'
    if (showErrors && problems.missing.includes(d)) return 'This question is required.'
    return ''
  }
  const answer = (definition, value) => {
    const result = applyFieldAnswer({ definition, value, fields })
    if (result.issues.length) return setError(result.issues[0].message)
    setError('')
    setFields(result.fields)
    setDirty(true)
  }
  const save = () => {
    const result = saveDraft({ formCode: form.code, language: variant.lang, fields, userId: user?.id })
    if (!result.success) return setError(result.error)
    setDirty(false)
    onToast('Draft saved in this browser.')
  }
  const clear = () => {
    removeDraft(form.code, variant.lang)
    setFields([])
    setDirty(false)
    onToast('Draft cleared.')
  }
  const render = async (then) => {
    setShowErrors(true)
    setBusy(true)
    setError('')
    try {
      then(await buildFilledPdf({ fileUrl, definitions, fields }))
    } catch (e) {
      setError(e.message || 'The filled form could not be created.')
    } finally {
      setBusy(false)
    }
  }
  const close = () => {
    if (dirty && !window.confirm('Close without saving your answers?')) return
    onClose()
  }
  const fileName = filledFileName(form.code, variant.lang)

  return (
    <>
      <Modal title={`Fill ${form.code}`} subtitle={`${form.title} · ${variant.label}`} size="max-w-3xl" onClose={close} footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-gray-700" aria-live="polite">
            {problems.answered} of {problems.total} answered{problems.missing.length ? ` · ${problems.missing.length} required left` : ''}
          </span>
          <div className="flex flex-wrap gap-3">
            {saved && <OutlineButton type="button" onClick={clear} className="inline-flex items-center gap-2 !px-4"><Trash2 className="size-4" /> Clear</OutlineButton>}
            <OutlineButton type="button" onClick={save} disabled={!dirty} className="inline-flex items-center gap-2 !px-4 disabled:opacity-60"><Save className="size-4" /> Save draft</OutlineButton>
            <OutlineButton type="button" disabled={busy} onClick={() => render(setPreview)} className="inline-flex items-center gap-2 !px-4"><Eye className="size-4" /> Preview</OutlineButton>
            <PrimaryButton type="button" disabled={busy} onClick={() => render((blob) => triggerDownload(blob, fileName))} className="inline-flex items-center gap-2 !px-5">
              <Download className="size-4" /> {busy ? 'Preparing…' : 'Download PDF'}
            </PrimaryButton>
          </div>
        </div>
      }>
        {saved && <p className="mb-4 text-sm text-gray-700">Draft last saved {formatDateTime(saved.updatedAt)}.</p>}
        {error && <div className="mb-4"><Alert>{error}</Alert></div>}
        {definitions.length === 0 ? (
          <p className="text-sm text-gray-700">
            This version of the form has no fill-in questions yet. Download the blank form and fill it in by hand.
          </p>
        ) : (
          <div className="space-y-6">
            {sections.map((section) => (
              <section key={section.title} aria-label={section.title}>
                <h3 className="mb-3 border-b border-gray-200 pb-1 text-sm font-bold uppercase tracking-wide text-navy">{section.title}</h3>
                <div className="space-y-4">
                  {section.definitions.map((d) => (
                    <FormQuestion key={d.id} definition={d} value={readFieldAnswer({ definition: d, fields })} onChange={(v) => answer(d, v)} error={errorFor(d)} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </Modal>
      {preview && (
        <PdfPreviewDialog title={`${form.code} — filled`} subtitle={problems.missing.length ? `${problems.missing.length} required question(s) still blank` : 'Every required question is answered'}
          source={preview} fileName={fileName} onClose={() => setPreview(null)} />
      )}
    </>
  )
}

/** The office replaces a form's PDF, restores an earlier version or goes back to the original. */
export function TemplateDialog({ form, variant, user, onClose, onToast }) {
  const [versions, setVersions] = useState(() => listFormVersions(form.code, variant.lang))
  const [file, setFile] = useState(null)
  const [keepLayout, setKeepLayout] = useState(true)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const refresh = (message) => {
    setVersions(listFormVersions(form.code, variant.lang))
    onToast(message)
  }
  const publish = () => {
    if (!file) return setError('Choose the new PDF first.')
    if (file.size > MAX_TEMPLATE_BYTES) return setError('That PDF is larger than 2 MB. Compress it and try again.')
    const reader = new FileReader()
    reader.onload = () => {
      const result = publishFormVersion({ formCode: form.code, language: variant.lang, fileName: file.name, dataUrl: reader.result, size: file.size, keepLayout, notes, userId: user?.id })
      if (!result.success) return setError(result.error)
      setFile(null)
      setNotes('')
      setError('')
      refresh(`Version ${result.data.version} is now the ${form.code} everyone downloads.`)
    }
    reader.readAsDataURL(file)
  }
  const active = versions.find((v) => v.isActive)
  return (
    <Modal title={`Edit template — ${form.code}`} subtitle={`${variant.label} · now using ${active ? `version ${active.version}` : 'the original'}`} size="max-w-2xl" onClose={onClose}>
      {error && <div className="mb-4"><Alert>{error}</Alert></div>}
      <div className="space-y-3">
        <label htmlFor="template-file" className="block text-sm font-semibold">New PDF (up to 2 MB)</label>
        <input id="template-file" type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files[0] ?? null)} className="text-sm" />
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={keepLayout} onChange={(e) => setKeepLayout(e.target.checked)} className="mt-0.5 size-4 accent-navy" />
          <span>Keep the current fill-in layout (only if the blanks are in the same places). Untick for a redesigned form: it is then filled by hand.</span>
        </label>
        <label htmlFor="template-notes" className="block text-sm font-semibold">What changed (optional)</label>
        <input id="template-notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-sm border border-gray-400 px-2.5 py-2 text-sm" />
        <PrimaryButton type="button" onClick={publish} className="inline-flex items-center gap-2"><Upload className="size-4" /> Publish</PrimaryButton>
      </div>
      <h3 className="mb-2 mt-6 text-sm font-bold uppercase tracking-wide text-navy">Versions</h3>
      <ul className="divide-y divide-gray-200 border border-gray-200 text-sm">
        <li className="flex items-center justify-between gap-3 px-3 py-2">
          <span>Original office form {!active && <strong>(in use)</strong>}</span>
          {active && <button type="button" onClick={() => { revertToBundledForm(form.code, variant.lang); refresh('Back to the original form.') }} className="inline-flex items-center gap-1 text-navy underline"><RotateCcw className="size-3.5" /> Restore</button>}
        </li>
        {versions.map((v) => (
          <li key={v.id} className="flex items-center justify-between gap-3 px-3 py-2">
            <span>Version {v.version} — {v.fileName} · {formatDateTime(v.createdAt)}{v.notes && ` · ${v.notes}`} {v.isActive && <strong>(in use)</strong>}</span>
            {!v.isActive && <button type="button" onClick={() => { activateFormVersion(v.id); refresh(`Version ${v.version} restored.`) }} className="inline-flex items-center gap-1 text-navy underline"><RotateCcw className="size-3.5" /> Restore</button>}
          </li>
        ))}
      </ul>
    </Modal>
  )
}
