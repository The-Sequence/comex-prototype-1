/* Community Engagement projects — Start a project, the project tracker with its
 * fifteen steps, step submission, validation / endorsement, returning with reasons,
 * withdrawal and step history. Ported from comex-frontend-v2 (src/components/projects/*)
 * onto V1's own controls. Data stays in this browser; see src/lib/projects.js. */
import { useState } from 'react'
import { ChevronDown, CircleAlert, CircleCheck, Clock, ExternalLink, Link2, Paperclip, Search } from 'lucide-react'
import { COMEX_FORMS, COMEX_PROCESS_PARTS, STEP_STATUS, getProgressPercent, getStepById, statusLabelFor } from '../config/comexProcess'
import { ALL_UNITS, departmentLabel, unitName } from '../config/departments'
import { FIELDS_OF_WORK } from '../config/comexProcess'
import {
  ENGAGEMENT_TYPES, REVISION_REASONS, approvalNoticeBody, canManageProject, canWithdrawEngagement,
  describeStepEvent, isOffice, requiredSlots, revisionFeedback, startProjectErrors, typeGuidance, typeLabel,
} from '../lib/projectRules'
import {
  attachStepFile, canReviewStep, createProject, isAwaitingDecision, resubmitStep, reviewStep, toAttachment,
  updateProjectDetails, withdrawProject,
} from '../lib/projects'
import { Modal, SelectField } from './Applications'
import { attachFilledForm, getDraft, useFormStore } from '../lib/formStore'
import { FieldError, Label, OutlineButton, PrimaryButton, TextField } from './Form'

/* ---------- Page controls (working versions of the display-only ones) ---------- */

export function SearchBox({ value, onChange, placeholder, className = '' }) {
  return (
    <div className={`flex min-w-0 items-center gap-2 rounded border border-gray-800 bg-white px-3 py-2.5 shadow-sm ${className}`}>
      <Search className="size-4 shrink-0 text-gray-600" aria-hidden="true" />
      <input type="search" aria-label={placeholder} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)}
        className="min-w-0 w-full bg-transparent text-sm outline-none focus-visible:ring-2 focus-visible:ring-navy/20" />
    </div>
  )
}

export function FilterSelect({ label, value, onChange, options }) {
  return (
    <label className="relative inline-flex min-h-11 items-center rounded border border-gray-800 bg-white text-sm font-medium shadow-sm focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-navy">
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="cursor-pointer appearance-none bg-transparent py-2 pl-3 pr-9 outline-none">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 size-4" aria-hidden="true" />
    </label>
  )
}

/** Navy department header that opens and closes, styled like Showcase's DepartmentPanel. */
export function ProjectPanel({ title, count, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className={`overflow-hidden rounded-2xl shadow-lg ${open ? 'border border-gray-400' : ''}`}>
      <h2 className="bg-sidebar text-lg font-bold text-white md:text-xl">
        <button type="button" aria-expanded={open} onClick={() => setOpen(!open)}
          className="flex w-full cursor-pointer items-center gap-4 px-6 py-5 text-left focus-visible:outline-2 focus-visible:outline-gold">
          <ChevronDown className={`size-5 shrink-0 fill-white ${open ? '' : '-rotate-90'}`} aria-hidden="true" />
          <span className="flex-1">{title}</span>
          {count !== undefined && <span className="text-sm font-medium">{count}</span>}
        </button>
      </h2>
      {open && <div className="bg-white">{children}</div>}
    </section>
  )
}

/** Underlined tab strip, styled like Showcase's Tabs. */
export function PanelTabs({ items, active, onSelect }) {
  return (
    <div role="tablist" className="flex gap-8 border-b border-gray-700 px-6 py-3 text-sm font-medium">
      {items.map((item) => (
        <button type="button" role="tab" aria-selected={item.value === active} key={item.value} onClick={() => onSelect(item.value)}
          className={`cursor-pointer focus-visible:outline-2 focus-visible:outline-navy ${item.value === active ? 'underline underline-offset-4' : 'text-gray-600'}`}>
          {item.label}
        </button>
      ))}
    </div>
  )
}

const STATUS_STYLES = {
  [STEP_STATUS.APPROVED]: 'bg-green-50 text-green-700 border-green-200',
  [STEP_STATUS.REJECTED]: 'bg-red-50 text-red-700 border-red-200',
  [STEP_STATUS.NEEDS_VALIDATION]: 'bg-amber-50 text-amber-700 border-amber-200',
  [STEP_STATUS.FILE_ATTACHED]: 'bg-indigo-50 text-navy border-indigo-200',
  [STEP_STATUS.PENDING]: 'bg-gray-50 text-gray-600 border-gray-200',
}

export function StepStatusPill({ status, mode = 'admin' }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[status] ?? STATUS_STYLES.Pending}`}>
      {statusLabelFor(status, mode)}
    </span>
  )
}

const formatDate = (iso) => (iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '')
const formatSize = (bytes) => (bytes ? (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`) : '')

function TextArea({ id, label, required, error, ...props }) {
  return (
    <div>
      <Label htmlFor={id} required={required}>{label}</Label>
      <textarea id={id} rows={3} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full rounded-sm border bg-white px-2.5 py-2 text-sm outline-none focus:ring-2 ${error ? 'border-red-500 focus:ring-red-200' : 'border-gray-400 focus:border-navy focus:ring-navy/20'}`}
        {...props} />
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  )
}

/* ---------- Start a project (V2 StartProjectDialog) ---------- */

export function StartProjectDialog({ user, onClose, onStarted }) {
  const office = isOffice(user)
  const [draft, setDraft] = useState({ title: '', objectives: '', department: office ? '' : user.department ?? '',
    fieldOfWork: '', engagementType: '', proponent: 'self', proponentName: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const set = (field) => (e) => {
    setDraft({ ...draft, [field]: e.target.value })
    setErrors(({ [field]: _, ...rest }) => rest)
  }

  const submit = () => {
    setFormError('')
    const found = startProjectErrors(draft)
    setErrors(found)
    if (Object.keys(found).length) return
    const result = createProject(draft, user)
    if (!result.success) return setFormError(result.error)
    onStarted(result.data)
  }

  return (
    <Modal title={office ? 'Start a project' : 'Create Project Proposal'} subtitle="The project starts at Step 1 — Community Coordination." size="max-w-2xl" onClose={onClose}
      footer={<>
        <OutlineButton type="button" onClick={onClose}>Cancel</OutlineButton>
        <PrimaryButton type="button" onClick={submit}>Start project</PrimaryButton>
      </>}>
      {formError && <p role="alert" className="mb-4 flex items-start gap-2 rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"><CircleAlert className="size-4 shrink-0" />{formError}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><TextField id="project-title" label="Project Title" required value={draft.title} onChange={set('title')} error={errors.title} /></div>
        <div className="sm:col-span-2"><TextArea id="project-objectives" label="Project Objectives" required value={draft.objectives} onChange={set('objectives')} error={errors.objectives} /></div>
        <SelectField id="project-department" label="Department" required value={draft.department} onChange={set('department')} disabled={!office}
          options={ALL_UNITS.map((d) => ({ value: d.code, label: departmentLabel(d) }))} placeholder="Choose the department"
          helper={office ? undefined : 'A COMEX Representative files for their own department'} error={errors.department} />
        <SelectField id="project-field" label="Field of Work" required value={draft.fieldOfWork} onChange={set('fieldOfWork')}
          options={FIELDS_OF_WORK} placeholder="Choose the field of work" error={errors.fieldOfWork} />
        <SelectField id="project-type" label="Type of Engagement" value={draft.engagementType} onChange={set('engagementType')}
          options={ENGAGEMENT_TYPES} placeholder="Decide later" helper="Decides which consent and checklist forms are needed" />
        {office && (
          <SelectField id="project-proponent" label="Proponent" value={draft.proponent} onChange={set('proponent')} placeholder="Choose"
            options={[{ value: 'self', label: `Me (${user.fullName})` }, { value: 'other', label: 'Someone else' }]} />
        )}
        {office && draft.proponent === 'other' && (
          <TextField id="project-proponent-name" label="Proponent name" required value={draft.proponentName} onChange={set('proponentName')} error={errors.proponentName} />
        )}
      </div>
    </Modal>
  )
}

/* ---------- Project tracker (V2 ProjectView, StepActions, StepFeedback, StepRouting) ---------- */

function firstOpenStep(project) {
  return project.currentStep
}

/** The full tracker for one project. `mode` is 'admin' (office/Approver wording) or 'user'. */
export function ProjectView({ project, user, mode, onClose, onToast }) {
  const [stepId, setStepId] = useState(() => firstOpenStep(project))
  const [editing, setEditing] = useState(false)
  const [confirmWithdraw, setConfirmWithdraw] = useState(false)
  const manage = canManageProject(project, user)
  const step = getStepById(stepId)
  const state = project.steps[stepId]
  const pct = getProgressPercent(project.bucket === 'Done' ? 15 : project.currentStep - 1)

  const withdraw = () => {
    const result = withdrawProject(project.id, user)
    setConfirmWithdraw(false)
    if (!result.success) return onToast(result.error, 'error')
    onToast(`${project.title} was withdrawn.`)
    onClose()
  }

  return (
    <>
      <Modal title={project.title} subtitle={`${project.projectLead} · ${unitName(project.department)} · ${project.fieldOfWork}${project.engagementType ? ` · ${typeLabel(project.engagementType)}` : ''}`}
        size="max-w-5xl" onClose={editing || confirmWithdraw ? () => {} : onClose}
        footer={<>
          {canWithdrawEngagement(project, user) && <OutlineButton type="button" className="!border-red-300 !text-red-600" onClick={() => setConfirmWithdraw(true)}>Withdraw</OutlineButton>}
          {manage && <OutlineButton type="button" onClick={() => setEditing(true)}>Edit details</OutlineButton>}
          <PrimaryButton type="button" onClick={onClose}>Close</PrimaryButton>
        </>}>
        <p className="text-sm text-gray-700">{project.objectives}</p>
        <div className="mt-4 flex items-center gap-3 text-sm">
          <span className="font-semibold">{project.bucket === 'Done' ? 'Completed' : `Step ${project.currentStep} of 15`}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200"><div className="h-full bg-navy" style={{ width: `${pct}%` }} /></div>
          <span className="text-gray-600">{pct}%</span>
        </div>
        <div className="mt-5 grid gap-5 md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
          <nav aria-label="Steps" className="space-y-4">
            {COMEX_PROCESS_PARTS.map((part) => (
              <div key={part.id}>
                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-gray-500">{part.title.replace(/^PART \d — /, '')}</p>
                <ul className="space-y-1">
                  {part.steps.map((s) => (
                    <li key={s.id}>
                      <button type="button" onClick={() => setStepId(s.id)} aria-current={s.id === stepId ? 'step' : undefined}
                        className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-sm ${s.id === stepId ? 'bg-indigo-50 font-semibold' : 'hover:bg-gray-50'}`}>
                        <span className="min-w-0 truncate">{s.id}. {s.title}</span>
                        <StepStatusPill status={project.steps[s.id].status} mode={mode} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
          <StepPanel key={stepId} project={project} step={step} state={state} user={user} mode={mode} onToast={onToast} />
        </div>
      </Modal>
      {editing && <EditDetailsDialog project={project} user={user} onClose={() => setEditing(false)} onToast={onToast} />}
      {confirmWithdraw && (
        <Modal title="Withdraw this project?" size="max-w-md" z="z-[60]" onClose={() => setConfirmWithdraw(false)}
          footer={<>
            <OutlineButton type="button" onClick={() => setConfirmWithdraw(false)}>Cancel</OutlineButton>
            <PrimaryButton type="button" className="!bg-red-600 hover:!bg-red-700" onClick={withdraw}>Withdraw project</PrimaryButton>
          </>}>
          <p className="text-sm leading-relaxed text-gray-700">
            <span className="font-semibold">{project.title}</span> and its Step 1 attachments will be removed. This cannot be undone.
          </p>
        </Modal>
      )}
    </>
  )
}

function StepPanel({ project, step, state, user, mode, onToast }) {
  const manage = canManageProject(project, user)
  const slots = requiredSlots(step, project.engagementType)
  const locked = step.id > project.currentStep
  const guidance = typeGuidance(step.id, step.forms, project.engagementType)
  const reviewer = canReviewStep(step.id, user) && isAwaitingDecision(project, step.id)
  const history = (project.history ?? []).filter((e) => e.stepId === step.id)

  const resubmit = () => {
    const result = resubmitStep(project.id, step.id, user)
    onToast(result.success ? `Step ${step.id} was sent back for a decision.` : result.error, result.success ? 'success' : 'error')
  }

  return (
    <section aria-label={`Step ${step.id}`} className="min-w-0 rounded border border-gray-300 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-lg font-bold">Step {step.id}. {step.title}</h3>
        <StepStatusPill status={state.status} mode={mode} />
      </div>
      <p className="mt-1 text-sm text-gray-700">{step.description}</p>
      <p className="mt-2 text-xs text-gray-500">Handled by: {step.actor}</p>
      {guidance && <p className="mt-2 rounded bg-amber-50 px-3 py-2 text-xs text-amber-800">{guidance}</p>}
      {locked && <p className="mt-3 flex items-center gap-1 text-sm text-gray-500"><Clock className="size-4" /> Opens after Step {project.currentStep} is approved.</p>}

      {state.feedback && (
        <div className={`mt-3 rounded border px-3 py-2 text-sm ${state.status === STEP_STATUS.REJECTED ? 'border-red-200 bg-red-50 text-red-800' : 'border-gray-200 bg-gray-50 text-gray-700'}`}>
          <p className="font-semibold">{state.status === STEP_STATUS.REJECTED ? 'Returned for revision' : 'Comment'}</p>
          <p className="mt-0.5">{state.feedback}</p>
        </div>
      )}
      {state.approval && (
        <p className="mt-3 flex items-center gap-1 text-sm text-green-700"><CircleCheck className="size-4" />{approvalNoticeBody(state.approval.decidedBy, state.feedback)} {formatDate(state.approval.decidedAt)}</p>
      )}

      {slots.length > 0 && (
        <ul className="mt-4 divide-y divide-gray-200 rounded border border-gray-200">
          {slots.map((code) => (
            <AttachmentSlot key={code} project={project} step={step} code={code} file={(state.files ?? []).find((f) => f.formCode === code)}
              canAttach={manage && !locked && state.status !== STEP_STATUS.APPROVED} user={user} onToast={onToast} />
          ))}
        </ul>
      )}
      {!step.requiresUpload && manage && state.status === STEP_STATUS.REJECTED && (
        <PrimaryButton type="button" className="mt-4" onClick={resubmit}>Resubmit for {step.actor}</PrimaryButton>
      )}
      {!step.requiresUpload && !locked && state.status === STEP_STATUS.PENDING && !reviewer && (
        <p className="mt-3 text-sm text-gray-600">Waiting for {step.actor}.</p>
      )}
      {reviewer && <ReviewControls project={project} step={step} user={user} onToast={onToast} />}

      {history.length > 0 && (
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer font-semibold">Step history ({history.length})</summary>
          <ol className="mt-2 space-y-2">
            {history.slice().reverse().map((event) => {
              const d = describeStepEvent(event, mode)
              return (
                <li key={event.id} className="border-l-2 border-gray-300 pl-3">
                  <p><span className="font-medium">{d.status}</span> · {d.actor}</p>
                  {d.feedback && <p className="text-gray-600">{d.feedback}</p>}
                  <p className="text-xs text-gray-500">{new Date(event.occurredAt).toLocaleString()}</p>
                </li>
              )
            })}
          </ol>
        </details>
      )}
    </section>
  )
}

function AttachmentSlot({ project, step, code, file, canAttach, user, onToast }) {
  const [useLink, setUseLink] = useState(false)
  const [link, setLink] = useState('')
  const inputId = `slot-${step.id}-${code}`
  useFormStore()
  const draft = canAttach ? getDraft(code, 'en') : null

  // A form filled on the COMEX Forms page: snapshot it, then record it as this slot's file.
  const attachDraft = () => {
    const snapshot = attachFilledForm({ projectId: project.id, stepId: step.id, formCode: code, fields: draft.fields, userId: user.id })
    if (!snapshot.success) return onToast(snapshot.error, 'error')
    const result = attachStepFile(project.id, step.id, code, { fileName: `${COMEX_FORMS[code] ?? code} (filled on COMEX Forms)`, formAttachmentId: snapshot.data.id }, user)
    if (!result.success) return onToast(result.error, 'error')
    onToast(result.complete ? `Step ${step.id} was submitted for validation.` : 'Form attached. Add the remaining forms to submit this step.')
  }

  const save = (source) => {
    const attachment = toAttachment(source)
    if (!attachment.success) return onToast(attachment.error, 'error')
    const result = attachStepFile(project.id, step.id, code, attachment.data, user)
    if (!result.success) return onToast(result.error, 'error')
    setLink('')
    onToast(result.complete ? `Step ${step.id} was submitted for validation.` : 'File attached. Add the remaining forms to submit this step.')
  }

  return (
    <li className="px-3 py-3 text-sm">
      <p className="font-medium">{COMEX_FORMS[code] ?? code}</p>
      {file ? (
        <p className="mt-1 flex items-center gap-1 text-gray-700">
          <Paperclip className="size-3.5 shrink-0" />
          {file.link
            ? <a href={file.link} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 truncate text-navy underline">{file.fileName}<ExternalLink className="size-3" /></a>
            : <span className="truncate">{file.fileName}</span>}
          <span className="text-xs text-gray-500">{formatSize(file.fileSize)} · {formatDate(file.uploadedAt)}</span>
        </p>
      ) : <p className="mt-1 text-gray-500">Nothing attached yet</p>}
      {canAttach && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {useLink ? (
            <>
              <input aria-label={`Link for ${code}`} value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://"
                className="min-w-0 flex-1 rounded-sm border border-gray-400 px-2.5 py-1.5 text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/20" />
              <OutlineButton type="button" className="!px-4" onClick={() => save({ link })}>Save link</OutlineButton>
            </>
          ) : (
            <label htmlFor={inputId} className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-gray-400 bg-white px-4 py-1.5 text-sm font-semibold hover:bg-gray-50 focus-within:outline-2 focus-within:outline-navy">
              <Paperclip className="size-4" /> {file ? 'Replace file' : 'Attach file'}
              <input id={inputId} type="file" className="sr-only" onChange={(e) => { save({ file: e.target.files?.[0] }); e.target.value = '' }} />
            </label>
          )}
          <button type="button" onClick={() => setUseLink(!useLink)} className="inline-flex cursor-pointer items-center gap-1 text-xs text-navy underline">
            <Link2 className="size-3.5" /> {useLink ? 'Attach a file instead' : 'Paste a link instead'}
          </button>
          {draft?.fields?.length > 0 && (
            <button type="button" onClick={attachDraft} className="inline-flex cursor-pointer items-center gap-1 text-xs text-navy underline">
              <Paperclip className="size-3.5" /> Use my filled form
            </button>
          )}
        </div>
      )}
    </li>
  )
}

/** Approve, or return with reasons (V2 StepActions + RevisionReasonPicker). */
function ReviewControls({ project, step, user, onToast }) {
  const [returning, setReturning] = useState(false)
  const [reasons, setReasons] = useState([])
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const endorsement = !step.requiresUpload

  const decide = (status) => {
    const feedback = status === STEP_STATUS.REJECTED ? revisionFeedback(reasons, note) : note
    const result = reviewStep(project.id, step.id, { status, feedback }, user)
    if (!result.success) return setError(result.error)
    onToast(status === STEP_STATUS.APPROVED
      ? `Step ${step.id} ${endorsement ? 'endorsed' : 'approved'}. ${approvalNoticeBody(user.fullName, feedback)}`
      : `Step ${step.id} was returned to ${project.projectLead}.`)
  }

  return (
    <div className="mt-4 rounded border border-gray-300 bg-gray-50 p-3">
      <p className="text-sm font-semibold">{endorsement ? 'Awaiting your endorsement' : 'Awaiting your validation'}</p>
      {returning && (
        <fieldset className="mt-2">
          <legend className="text-xs font-medium text-gray-600">Why is it going back? Pick any that apply.</legend>
          <div className="mt-1 flex flex-wrap gap-2">
            {REVISION_REASONS.map((r) => (
              <label key={r.id} className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3 py-1 text-xs">
                <input type="checkbox" checked={reasons.includes(r.id)}
                  onChange={(e) => { setError(''); setReasons(e.target.checked ? [...reasons, r.id] : reasons.filter((x) => x !== r.id)) }} />
                {r.label}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <div className="mt-2">
        <TextArea id={`review-note-${step.id}`} label={returning ? 'What should be revised?' : 'Comment (optional)'} required={returning}
          value={note} onChange={(e) => { setNote(e.target.value); setError('') }} error={error} />
      </div>
      <div className="mt-2 flex flex-wrap justify-end gap-2">
        {returning ? (
          <>
            <OutlineButton type="button" onClick={() => { setReturning(false); setError('') }}>Back</OutlineButton>
            <PrimaryButton type="button" className="!bg-red-600 hover:!bg-red-700" onClick={() => decide(STEP_STATUS.REJECTED)}>Return for revision</PrimaryButton>
          </>
        ) : (
          <>
            <OutlineButton type="button" className="!border-red-300 !text-red-600" onClick={() => setReturning(true)}>Request revision</OutlineButton>
            <PrimaryButton type="button" className="!bg-green-700 hover:!bg-green-800" onClick={() => decide(STEP_STATUS.APPROVED)}>{endorsement ? 'Endorse' : 'Approve'}</PrimaryButton>
          </>
        )}
      </div>
    </div>
  )
}

function EditDetailsDialog({ project, user, onClose, onToast }) {
  const [details, setDetails] = useState({ title: project.title, objectives: project.objectives, engagementType: project.engagementType ?? '' })
  const [error, setError] = useState('')
  const set = (field) => (e) => { setDetails({ ...details, [field]: e.target.value }); setError('') }
  const save = () => {
    const result = updateProjectDetails(project.id, details, user)
    if (!result.success) return setError(result.error)
    onToast('Project details saved.')
    onClose()
  }
  return (
    <Modal title="Edit details" size="max-w-lg" z="z-[60]" onClose={onClose}
      footer={<>
        <OutlineButton type="button" onClick={onClose}>Cancel</OutlineButton>
        <PrimaryButton type="button" onClick={save}>Save</PrimaryButton>
      </>}>
      <div className="space-y-4">
        <TextField id="edit-title" label="Project Title" required value={details.title} onChange={set('title')} />
        <TextArea id="edit-objectives" label="Project Objectives" required value={details.objectives} onChange={set('objectives')} error={error} />
        <SelectField id="edit-type" label="Type of Engagement" value={details.engagementType} onChange={set('engagementType')} options={ENGAGEMENT_TYPES} placeholder="Not set" />
      </div>
    </Modal>
  )
}
