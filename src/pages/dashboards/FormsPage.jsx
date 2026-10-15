/* COMEX Forms — the form library, laid out in the Figma dashboard style
 * (navy stage panels, yellow outlined buttons). Search, preview, download,
 * fill-in and template replacement follow comex-frontend-v2's Forms screen;
 * drafts and templates live in this browser (src/lib/formStore.js). */
import { useState } from 'react'
import { Download, Eye, FileText, PencilLine } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import { COMEX_FORM_GROUPS } from '../../data/comexForms'
import { DepartmentPanel, PageTitle, YellowButton } from '../../components/Showcase'
import { DisplayButton, DisplaySearch } from '../../components/DashboardControls'
import { Toast } from '../../components/Applications'
import { FormFillDialog, PdfPreviewDialog, TemplateDialog } from '../../components/forms/FormDialogs'
import { formVariants, searchFormGroups } from '../../lib/formCatalog'
import { getActiveVersion, getDraft, useFormStore } from '../../lib/formStore'

const TOTAL = COMEX_FORM_GROUPS.reduce((count, group) => count + group.forms.length, 0)

function FormRow({ form, office, onOpen }) {
  const variants = formVariants(form)
  const [lang, setLang] = useState(variants[0]?.lang)
  const variant = variants.find((v) => v.lang === lang)
  const active = variant && getActiveVersion(form.code, variant.lang)
  const draft = variant && getDraft(form.code, variant.lang)
  const open = (kind) => onOpen({ kind, form, variant, active })
  const downloadBlank = () => {
    const link = document.createElement('a')
    link.href = active?.dataUrl ?? variant.fileUrl
    link.download = active?.fileName ?? variant.fileName
    link.click()
  }
  return (
    <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-5 last:border-0 md:flex-row md:items-start">
      <button type="button" aria-label={`Preview ${form.code}`} disabled={!variant} onClick={() => open('preview')} className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-indigo-50 text-navy disabled:cursor-default focus-visible:outline-2 focus-visible:outline-navy">
        <FileText className="size-5" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-lg font-bold leading-snug">
          {form.code} — <span className="font-medium">{form.title}</span>
        </p>
        <p className="mt-1 text-sm leading-relaxed text-gray-700">{form.description}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-full border border-gray-800 px-3 py-0.5 font-medium">Needed at {form.usedAtSteps}</span>
          {variants.length > 0 ? (
            <span className="flex gap-4 pl-1" role="group" aria-label={`${form.code} language`}>
              {variants.map((v) => (
                <button type="button" key={v.lang} aria-pressed={v.lang === lang} onClick={() => setLang(v.lang)} className={`cursor-pointer focus-visible:outline-2 focus-visible:outline-navy ${v.lang === lang ? 'font-bold text-navy underline underline-offset-4' : 'text-gray-600'}`}>
                  {v.label}
                </button>
              ))}
            </span>
          ) : (
            <span className="italic text-gray-500">Request from the office</span>
          )}
          {draft && <span className="rounded-full bg-gold/40 px-3 py-0.5 font-medium">Draft saved</span>}
          {active && <span className="rounded-full border border-green-700 px-3 py-0.5 text-green-800">Updated version {active.version}</span>}
        </div>
      </div>
      {variant && (
        <div className="flex shrink-0 flex-wrap gap-3 md:w-44 md:flex-col">
          <DisplayButton icon={Eye} onClick={() => open('preview')}>Preview</DisplayButton>
          <YellowButton onClick={downloadBlank} className="inline-flex items-center justify-center gap-2 !px-5 text-sm">
            <Download className="size-4" /> Download blank
          </YellowButton>
          <DisplayButton icon={PencilLine} onClick={() => open('fill')} className="!rounded-full bg-white px-5 font-bold">{draft ? 'Continue form' : 'Fill form'}</DisplayButton>
          {office && <DisplayButton icon={PencilLine} onClick={() => open('template')} className="!rounded-full bg-white px-5 font-bold">Edit template</DisplayButton>}
        </div>
      )}
    </div>
  )
}

export default function FormsPage() {
  const { user } = useOutletContext()
  const office = ['COMEX Head', 'COMEX Associate'].includes(user.role)
  useFormStore()
  const [query, setQuery] = useState('')
  const [dialog, setDialog] = useState(null)
  const [toast, setToast] = useState('')
  const groups = searchFormGroups(COMEX_FORM_GROUPS, query)
  const shown = groups.reduce((count, group) => count + group.forms.length, 0)
  const close = () => setDialog(null)
  return (
    <>
      <PageTitle>COMEX Forms</PageTitle>
      <p className="-mt-4 mb-5 text-sm font-medium">
        Download the official forms for each stage of a community engagement, or fill one in here.
      </p>
      <div className="mb-8 flex flex-wrap items-center gap-4">
        <DisplaySearch placeholder="Search by form number or name" value={query} onChange={setQuery} className="min-w-56 max-w-2xl flex-1" />
        <span className="rounded-full border border-gray-800 px-3 py-1 text-sm text-navy">{query ? `${shown} of ${TOTAL}` : TOTAL} forms</span>
        <span className="rounded-full border border-gray-800 px-3 py-1 text-sm text-green-800">{groups.length} stages</span>
      </div>

      {groups.length === 0 && (
        <p className="rounded border border-gray-300 bg-white px-6 py-8 text-center text-sm text-gray-700">
          No form matches “{query}”. Try the form number, such as 010, or a word from its name.
        </p>
      )}
      <div className="space-y-8">
        {groups.map((group) => (
          <div key={group.id}>
            <DepartmentPanel title={group.title} open>
              <p className="border-b border-gray-700 bg-gray-50 px-6 py-3 text-sm text-gray-700">{group.description}</p>
              {group.forms.map((form) => (
                <FormRow key={form.code} form={form} office={office} onOpen={setDialog} />
              ))}
            </DepartmentPanel>
          </div>
        ))}
      </div>

      {dialog?.kind === 'preview' && (
        <PdfPreviewDialog title={dialog.form.code} subtitle={`${dialog.form.title} · ${dialog.variant.label} · blank`}
          source={dialog.active?.dataUrl ?? dialog.variant.fileUrl} fileName={dialog.active?.fileName ?? dialog.variant.fileName} onClose={close} />
      )}
      {dialog?.kind === 'fill' && (
        <FormFillDialog form={dialog.form} variant={dialog.variant} activeVersion={dialog.active} user={user} onClose={close} onToast={setToast} />
      )}
      {dialog?.kind === 'template' && (
        <TemplateDialog form={dialog.form} variant={dialog.variant} user={user} onClose={close} onToast={setToast} />
      )}
      <Toast message={toast} onDismiss={() => setToast('')} />
    </>
  )
}
