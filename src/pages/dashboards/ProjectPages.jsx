/* Community Engagement project pages — Project Proposals (Frame 10), My Projects
 * (Frame 15) and the Approver's Endorsement Queue. Behaviour ported from
 * comex-frontend-v2 (AdminProjects.jsx, UserProjects.jsx); data in src/lib/projects.js. */
import { useCallback, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { CircleAlert, Clock } from 'lucide-react'
import { PageTitle, YellowButton } from '../../components/Showcase'
import { Toast } from '../../components/Applications'
import { FilterSelect, PanelTabs, ProjectPanel, ProjectView, SearchBox, StartProjectDialog, StepStatusPill } from '../../components/Projects'
import { ALL_UNITS, unitName } from '../../config/departments'
import { getStepById } from '../../config/comexProcess'
import { isRepresentative } from '../../lib/projectRules'
import { useProjects, useStepsAwaitingValidation } from '../../lib/projects'

const BUCKETS = [{ value: 'New', label: 'New' }, { value: 'Ongoing', label: 'Ongoing' }, { value: 'Done', label: 'Done' }]
const DEPARTMENT_OPTIONS = [{ value: '', label: 'All departments' }, ...ALL_UNITS.map((d) => ({ value: d.code, label: d.name }))]
const STATUS_OPTIONS = [{ value: '', label: 'All statuses' }, ...BUCKETS]

const matches = (p, term) => !term.trim() ||
  [p.title, p.projectLead].some((v) => String(v ?? '').toLowerCase().includes(term.trim().toLowerCase()))

const formatDate = (iso) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

/** Toast state plus the open project, looked up live so the dialog follows every change. */
function useProjectPage(projects) {
  const [openId, setOpenId] = useState(null)
  const [toast, setToast] = useState(null)
  const showToast = useCallback((message, tone = 'success') => setToast({ message, tone }), [])
  const open = projects.find((p) => p.id === openId) ?? null
  return { open, setOpenId, toast, setToast, showToast }
}

function DepartmentProjects({ projects, onView, defaultOpen }) {
  const [bucket, setBucket] = useState('New')
  const shown = projects.filter((p) => p.bucket === bucket)
  return (
    <>
      <PanelTabs items={BUCKETS.map((b) => ({ ...b, label: `${b.label} (${projects.filter((p) => p.bucket === b.value).length})` }))}
        active={bucket} onSelect={setBucket} />
      {shown.length === 0 && <p className="px-6 py-4 text-sm text-gray-600">No {bucket.toLowerCase()} projects{defaultOpen ? '' : ' in this department'}.</p>}
      {shown.map((p) => (
        <div key={p.id} className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 px-6 py-4 last:border-0">
          <div className="min-w-0">
            <p className="font-medium">{p.title}</p>
            <p className="text-sm text-gray-700">{p.objectives}</p>
            <p className="mt-2 flex flex-wrap items-center gap-x-8 gap-y-1 text-[11px] text-gray-600">
              <span>{p.projectLead}</span>
              <span>{p.bucket === 'Done' ? 'Completed' : `Step ${p.currentStep}`}</span>
              <StepStatusPill status={p.steps[p.currentStep].status} />
            </p>
          </div>
          <YellowButton className="!px-2 !py-1 text-[11px]" onClick={() => onView(p.id)}>View Status</YellowButton>
        </div>
      ))}
    </>
  )
}

/** Frame 10 — Project Proposals (COMEX Office). */
export function AdminProjects() {
  const { user } = useOutletContext()
  const projects = useProjects(user)
  const awaiting = useStepsAwaitingValidation(user)
  const { open, setOpenId, toast, setToast, showToast } = useProjectPage(projects)
  const [starting, setStarting] = useState(false)
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('')
  const filtered = projects.filter((p) => matches(p, search) && (!department || p.department === department))
  const units = ALL_UNITS.filter((d) => (department ? d.code === department : true))

  return (
    <>
      <PageTitle action={<YellowButton onClick={() => setStarting(true)}>+ Start a project</YellowButton>}>Project Proposals</PageTitle>
      <div className="mb-6 flex flex-wrap gap-3">
        <SearchBox value={search} onChange={setSearch} placeholder="Search by project title or project lead" className="min-w-56 flex-1" />
        <FilterSelect label="Department" value={department} onChange={setDepartment} options={DEPARTMENT_OPTIONS} />
      </div>
      {awaiting.length > 0 && (
        <p className="mb-6 flex items-center gap-2 text-sm font-medium text-orange-600">
          <CircleAlert className="size-4" /> {awaiting.length} {awaiting.length === 1 ? 'step is' : 'steps are'} waiting for validation.
          <button type="button" className="cursor-pointer underline" onClick={() => setOpenId(awaiting[0].project.id)}>Review the first</button>
        </p>
      )}
      <div className="space-y-8">
        {units.map((d, i) => {
          const list = filtered.filter((p) => p.department === d.code)
          return (
            <ProjectPanel key={d.code} title={`${d.name} (${d.code})`} count={list.length} defaultOpen={i === 0 || Boolean(department)}>
              <DepartmentProjects projects={list} onView={setOpenId} />
            </ProjectPanel>
          )
        })}
      </div>
      {starting && (
        <StartProjectDialog user={user} onClose={() => setStarting(false)}
          onStarted={(p) => { setStarting(false); showToast(`${p.title} was started at Step 1.`); setOpenId(p.id) }} />
      )}
      {open && <ProjectView project={open} user={user} mode="admin" onClose={() => setOpenId(null)} onToast={showToast} />}
      <Toast message={toast?.message} tone={toast?.tone} onDismiss={() => setToast(null)} />
    </>
  )
}

/** Frame 15 — My Projects (COMEX Representative; Approvers see every engagement). */
export function MyProjects() {
  const { user } = useOutletContext()
  const representative = isRepresentative(user)
  const projects = useProjects(user)
  const { open, setOpenId, toast, setToast, showToast } = useProjectPage(projects)
  const [starting, setStarting] = useState(false)
  const [search, setSearch] = useState('')
  const [bucket, setBucket] = useState('')
  const filtered = projects.filter((p) => matches(p, search) && (!bucket || p.bucket === bucket))

  return (
    <>
      <PageTitle action={representative && <YellowButton className="text-lg" onClick={() => setStarting(true)}>+ Create Project Proposal</YellowButton>}>
        {representative ? 'Department Engagements' : 'Community Engagements'}
      </PageTitle>
      <div className="mb-6 flex flex-wrap gap-3">
        <SearchBox value={search} onChange={setSearch} placeholder="Search by project title or project lead" className="min-w-56 flex-1" />
        <FilterSelect label="Status" value={bucket} onChange={setBucket} options={STATUS_OPTIONS} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-left">
          <thead className="whitespace-nowrap border-b-2 border-gray-300 text-xl">
            <tr>
              <th className="px-6 py-4 font-bold">Project Title</th>
              <th className="pr-6 py-4 font-bold">Project Objectives</th>
              <th className="pr-6 py-4 font-bold">COMEX Representative</th>
              <th className="pr-6 py-4 font-bold">Department</th>
              <th className="pr-6 py-4 font-bold">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-8 text-lg text-gray-600">
                {projects.length === 0 ? (representative ? 'No engagements yet. Create a project proposal to start Step 1.' : 'No engagements yet.') : 'No engagements match your search.'}
              </td></tr>
            )}
            {filtered.map((p) => {
              const state = p.steps[p.currentStep]
              return (
                <tr key={p.id} className="align-middle">
                  <td className="max-w-56 px-6 py-6 text-xl font-bold leading-snug">{p.title}</td>
                  <td className="max-w-64 pr-6 text-lg text-gray-600">{p.objectives}</td>
                  <td className="whitespace-nowrap pr-6 text-lg">{p.projectLead}</td>
                  <td className="text-lg">{p.department}</td>
                  <td>
                    <button type="button" onClick={() => setOpenId(p.id)}
                      className="inline-flex min-h-11 cursor-pointer items-center justify-center whitespace-nowrap rounded-full bg-sidebar px-7 py-2 text-sm font-bold text-white underline shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy">
                      {p.bucket} · View Status
                    </button>
                    <p className="mt-1 text-sm text-gray-400">
                      {p.bucket === 'Done' ? 'All 15 steps done' : `Step ${p.currentStep}`} · <StepStatusPill status={state.status} mode="user" />
                    </p>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {starting && (
        <StartProjectDialog user={user} onClose={() => setStarting(false)}
          onStarted={(p) => { setStarting(false); showToast(`${p.title} was created. Attach your Step 1 file to submit it.`); setOpenId(p.id) }} />
      )}
      {open && <ProjectView project={open} user={user} mode="user" onClose={() => setOpenId(null)} onToast={showToast} />}
      <Toast message={toast?.message} tone={toast?.tone} onDismiss={() => setToast(null)} />
    </>
  )
}

const QUEUE_TABS = [
  { value: 'waiting', label: 'For Endorsement' },
  { value: 'endorsed', label: 'Endorsed' },
  { value: 'returned', label: 'Returned' },
]

/** Approver — Endorsement Queue (use case "Approve Endorsement Request"), styled after Frame 10. */
export function Endorsements() {
  const { user } = useOutletContext()
  const projects = useProjects(user)
  const awaiting = useStepsAwaitingValidation(user)
  const { open, setOpenId, toast, setToast, showToast } = useProjectPage(projects)
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('')
  const [tab, setTab] = useState('waiting')

  /* Every endorsement step a project has reached, sorted into the three tabs. */
  const rows = useMemo(() => {
    const waiting = awaiting.map(({ project, stepId }) => ({ project, stepId, tab: 'waiting' }))
    const decided = projects.flatMap((project) => [9, 10].flatMap((stepId) => {
      const status = project.steps[stepId].status
      if (status === 'Approved') return [{ project, stepId, tab: 'endorsed' }]
      if (status === 'Rejected') return [{ project, stepId, tab: 'returned' }]
      return []
    }))
    return [...waiting, ...decided]
  }, [awaiting, projects])

  const filtered = rows.filter((r) => r.tab === tab && matches(r.project, search) && (!department || r.project.department === department))
  const units = ALL_UNITS.filter((d) => (department ? d.code === department : true))

  return (
    <>
      <PageTitle>Endorsement Queue</PageTitle>
      <div className="mb-6 flex flex-wrap gap-3">
        <SearchBox value={search} onChange={setSearch} placeholder="Search by project title or project lead" className="min-w-56 flex-1" />
        <FilterSelect label="Department" value={department} onChange={setDepartment} options={DEPARTMENT_OPTIONS} />
      </div>
      <div className="mb-4 overflow-hidden rounded-2xl border border-gray-400 bg-white shadow-lg">
        <PanelTabs items={QUEUE_TABS.map((t) => ({ ...t, label: `${t.label} (${rows.filter((r) => r.tab === t.value).length})` }))} active={tab} onSelect={setTab} />
      </div>
      <div className="space-y-8">
        {units.map((d, i) => {
          const list = filtered.filter((r) => r.project.department === d.code)
          if (!list.length && !department && i > 0) return null
          return (
            <ProjectPanel key={d.code} title={`${d.name} (${d.code})`} count={list.length} defaultOpen>
              {list.length === 0 && <p className="px-6 py-4 text-sm text-gray-600">Nothing here right now.</p>}
              {list.map(({ project: p, stepId }) => {
                const state = p.steps[stepId]
                const last = (p.history ?? []).filter((e) => e.stepId === stepId).at(-1)
                return (
                  <div key={`${p.id}-${stepId}`} className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 px-6 py-4 last:border-0">
                    <div className="min-w-0">
                      <p className="font-medium">{p.title}</p>
                      {tab === 'waiting' && (
                        <p className="mt-1 flex items-center gap-1 text-xs font-medium text-orange-600"><CircleAlert className="size-3.5" /> Awaiting your endorsement</p>
                      )}
                      {tab === 'returned' && state.feedback && <p className="mt-1 text-xs text-red-700">{state.feedback}</p>}
                      <p className="mt-2 flex flex-wrap gap-x-8 gap-y-1 text-[11px] text-gray-600">
                        <span>{p.projectLead}</span>
                        <span>Step {stepId} · {getStepById(stepId).actor}</span>
                        <span>{unitName(p.department)}</span>
                        <span className="flex items-center gap-1"><Clock className="size-3" /> {last ? `Updated ${formatDate(last.occurredAt)}` : `Submitted ${formatDate(p.submittedAt)}`}</span>
                      </p>
                    </div>
                    <YellowButton className="!px-3 !py-1 text-xs" onClick={() => setOpenId(p.id)}>{tab === 'waiting' ? 'Review' : 'View'}</YellowButton>
                  </div>
                )
              })}
            </ProjectPanel>
          )
        })}
      </div>
      {open && <ProjectView project={open} user={user} mode="admin" onClose={() => setOpenId(null)} onToast={showToast} />}
      <Toast message={toast?.message} tone={toast?.tone} onDismiss={() => setToast(null)} />
    </>
  )
}
