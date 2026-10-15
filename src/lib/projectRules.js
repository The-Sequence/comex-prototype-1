/* Pure rules for Community Engagement projects, ported from comex-frontend-v2:
 * startProject.js, engagementTypes.js, revisionReasons.js, stepHistory.js,
 * withdrawal.js and approvalNotice.js. Free of React and storage so `npm test` can load it. */
const ADMIN_ROLES = ['COMEX Head', 'COMEX Associate'] // same as db.js; kept here so tests need no Supabase

/* ---- Start a project (V2 startProject.js) ---- */
const REQUIRED = {
  title: 'Enter a project title.',
  objectives: 'Describe what this project aims to achieve.',
  department: 'Choose the department.',
  fieldOfWork: 'Choose the field of work.',
}

/** Field -> message; {} when the draft is complete. `proponent` is 'self' or 'other'. */
export function startProjectErrors(draft) {
  const errors = {}
  Object.entries(REQUIRED).forEach(([field, message]) => {
    if (!String(draft?.[field] ?? '').trim()) errors[field] = message
  })
  if (draft?.proponent === 'other' && !String(draft?.proponentName ?? '').trim()) errors.proponentName = 'Enter the proponent.'
  return errors
}

/* ---- Forms by type of engagement (V2 engagementTypes.js; SQL required_step_forms) ---- */
export const ENGAGEMENT_TYPES = [
  { value: 'program', label: 'Community Extension Program' },
  { value: 'seminar', label: 'Seminar / Workshop / Training' },
  { value: 'outreach', label: 'Outreach Project' },
]
const BY_TYPE = {
  4: { program: '002', seminar: '003', outreach: '004' },
  7: { program: '006', seminar: '007', outreach: '008' },
}
const EXTRA = { 14: { seminar: ['014'] } }

export const typeLabel = (type) => ENGAGEMENT_TYPES.find((t) => t.value === type)?.label ?? ''

/** The forms this project must file at a step. With no type set every listed form stays required. */
export function formsForType(stepId, forms = [], type) {
  if (!ENGAGEMENT_TYPES.some((t) => t.value === type)) return forms
  const family = BY_TYPE[stepId] ? Object.values(BY_TYPE[stepId]) : []
  const kept = forms.filter((code) => !family.includes(code) || code === BY_TYPE[stepId][type])
  const extra = EXTRA[stepId]?.[type] ?? []
  return extra.length ? [...kept, ...extra].sort() : kept
}

/** Upload slots for a step: its forms for this type, or one general attachment. */
export function requiredSlots(step, type) {
  if (!step?.requiresUpload) return []
  return step.forms.length ? formsForType(step.id, step.forms, type) : ['attachment']
}

/** One line for the office on a type-dependent step; '' when the step does not depend on the type. */
export function typeGuidance(stepId, forms = [], type) {
  if (!BY_TYPE[stepId] && !EXTRA[stepId]) return ''
  if (!typeLabel(type)) return 'Set the project type in Edit details: this step needs a different form for a Program, a Seminar/Workshop/Training, or an Outreach Project.'
  const needed = formsForType(stepId, forms, type)
  const skipped = forms.filter((code) => !needed.includes(code))
  return `${typeLabel(type)}: file Form ${needed.join(', ')}${skipped.length ? `; not needed: ${skipped.join(', ')}` : ''}.`
}

/* ---- Returning a step (V2 revisionReasons.js) ---- */
export const REVISION_REASONS = [
  { id: 'missing-info', label: 'Missing information' },
  { id: 'supporting-doc', label: 'Missing supporting document' },
  { id: 'wrong-form', label: 'Wrong or outdated form' },
  { id: 'signature', label: 'Missing signature' },
  { id: 'unreadable', label: 'File is unreadable or incomplete' },
]

/** Reasons and note joined into the step's feedback; '' when there is neither. */
export function revisionFeedback(reasonIds = [], note = '', documents = []) {
  const labels = REVISION_REASONS.filter((r) => reasonIds.includes(r.id)).map((r) =>
    r.id === 'supporting-doc' && documents.length ? `${r.label} (${documents.join(', ')})` : r.label)
  const text = String(note ?? '').trim()
  if (!labels.length) return text
  return text ? `${labels.join(' · ')} — ${text}` : labels.join(' · ')
}

/* ---- Step history (V2 stepHistory.js) ---- */
export function describeStepEvent(event, mode = 'admin') {
  const label = (status) => (mode === 'user' && status === 'Needs Validation' ? 'Submitted' : status)
  return {
    actor: event.actorName || 'System',
    status: event.oldStatus ? `${label(event.oldStatus)} → ${label(event.newStatus)}` : label(event.newStatus) || 'Step created',
    feedback: event.newFeedback || (event.oldFeedback ? 'Feedback cleared' : null),
  }
}

/* ---- Approval notice (V2 approvalNotice.js) ---- */
export function approvalNoticeBody(decidedBy, feedback) {
  const cleared = `Cleared by ${decidedBy || 'the reviewer'}.`
  const note = String(feedback ?? '').replace(/^[^:\n]{1,80}:\s+/, '').trim()
  return note ? `${cleared} Comment: ${note}` : cleared
}

/* ---- Who may do what (V2 RLS policies, as role checks) ---- */
export const isOffice = (user) => ADMIN_ROLES.includes(user?.role)
export const isRepresentative = (user) => user?.role === 'COMEX Representative'
export const isApprover = (user) => user?.role === 'Approver'

/** The office, the department's Representative, or the Project Lead. */
export function canManageProject(project, user) {
  if (!project || !user) return false
  return isOffice(user) || project.projectLeadId === user.id ||
    (isRepresentative(user) && Boolean(user.department) && user.department === project.department)
}

/** Only a Step 1 project, by the office or that department's Representative (V2 withdrawal.js). */
export function canWithdrawEngagement(project, user) {
  return Number(project?.currentStep) === 1 && (isOffice(user) ||
    (isRepresentative(user) && Boolean(user?.department) && user.department === project.department))
}

/** Which projects a user sees: the office and Approvers all, a Representative their department, anyone else their own. */
export function visibleTo(projects, user) {
  if (isOffice(user) || isApprover(user)) return projects
  if (isRepresentative(user)) return projects.filter((p) => p.department === user.department || p.projectLeadId === user.id)
  return projects.filter((p) => p.projectLeadId === user?.id)
}
