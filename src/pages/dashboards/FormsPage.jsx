/* COMEX Forms — the form library, laid out in the Figma dashboard style
 * (navy stage panels, yellow outlined buttons). Display only: searching,
 * downloading and editing are not wired up yet. */
import { Download, Eye, FileText, PencilLine } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import { COMEX_FORM_GROUPS } from '../../data/comexForms'
import { DepartmentPanel, PageTitle, YellowButton } from '../../components/Showcase'
import { DisplayButton, DisplaySearch } from '../../components/DashboardControls'

const TOTAL = COMEX_FORM_GROUPS.reduce((count, group) => count + group.forms.length, 0)

function FormRow({ form, office }) {
  return (
    <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-5 last:border-0 md:flex-row md:items-start">
      <button type="button" aria-label={`Preview ${form.code}`} className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-indigo-50 text-navy focus-visible:outline-2 focus-visible:outline-navy">
        <FileText className="size-5" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-lg font-bold leading-snug">
          {form.code} — <span className="font-medium">{form.title}</span>
        </p>
        <p className="mt-1 text-sm leading-relaxed text-gray-700">{form.description}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-full border border-gray-800 px-3 py-0.5 font-medium">Needed at {form.usedAtSteps}</span>
          {form.variants.length > 0 ? (
            <span className="flex gap-4 pl-1">
              {form.variants.map((label, i) => (
                <button type="button" key={label} className={`cursor-pointer focus-visible:outline-2 focus-visible:outline-navy ${i === 0 ? 'font-bold text-navy underline underline-offset-4' : 'text-gray-600'}`}>
                  {label}
                </button>
              ))}
            </span>
          ) : (
            <span className="italic text-gray-500">Request from the office</span>
          )}
        </div>
      </div>
      {form.variants.length > 0 && (
        <div className="flex shrink-0 flex-wrap gap-3 md:w-44 md:flex-col">
          <DisplayButton icon={Eye}>Preview</DisplayButton>
          <YellowButton className="inline-flex items-center justify-center gap-2 !px-5 text-sm">
            <Download className="size-4" /> Download blank
          </YellowButton>
          <DisplayButton icon={PencilLine} className="!rounded-full bg-white px-5 font-bold">Fill form</DisplayButton>
          {office && <DisplayButton icon={PencilLine} className="!rounded-full bg-white px-5 font-bold">Edit template</DisplayButton>}
        </div>
      )}
    </div>
  )
}

export default function FormsPage() {
  const { user } = useOutletContext()
  const office = ['COMEX Head', 'COMEX Associate'].includes(user.role)
  return (
    <>
      <PageTitle>COMEX Forms</PageTitle>
      <p className="-mt-4 mb-5 text-sm font-medium">
        Download the official forms for each stage of a community engagement, or fill one in here.
      </p>
      <div className="mb-8 flex flex-wrap items-center gap-4">
        <DisplaySearch placeholder="Search by form number or name" className="min-w-56 max-w-2xl flex-1" />
        <span className="rounded-full border border-gray-800 px-3 py-1 text-sm text-navy">{TOTAL} forms</span>
        <span className="rounded-full border border-gray-800 px-3 py-1 text-sm text-green-800">{COMEX_FORM_GROUPS.length} stages</span>
      </div>

      <div className="space-y-8">
        {COMEX_FORM_GROUPS.map((group) => (
          <div key={group.id}>
            <DepartmentPanel title={group.title} open>
              <p className="border-b border-gray-700 bg-gray-50 px-6 py-3 text-sm text-gray-700">{group.description}</p>
              {group.forms.map((form) => (
                <FormRow key={form.code} form={form} office={office} />
              ))}
            </DepartmentPanel>
          </div>
        ))}
      </div>
    </>
  )
}
