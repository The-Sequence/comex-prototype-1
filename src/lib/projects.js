/* Community Engagement projects and their fifteen-step workflow — kept in this
 * browser's localStorage only. Ported from comex-frontend-v2: createProjectProposal,
 * record_step_file, reviewEngagementStep, step_events and withdraw_engagement.
 * Every write returns V2's { success, data } or { success: false, error }.
 * docs/supabase-migration.md explains how to move this onto Supabase. */
import { useEffect, useState } from 'react'
import { ENDORSEMENT_STEP_IDS, STEP_STATUS, TOTAL_PROCESS_STEPS, getStepById } from '../config/comexProcess.js'
import {
  canManageProject,
  canWithdrawEngagement,
  isApprover,
  isOffice,
  requiredSlots,
  startProjectErrors,
  visibleTo,
} from './projectRules.js'

const KEY = 'comex-projects'
const EVENT = 'comex-projects-change'

function read() {
  try {
    const list = JSON.parse(globalThis.localStorage?.getItem(KEY) || '[]')
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

function write(list) {
  try { globalThis.localStorage?.setItem(KEY, JSON.stringify(list)) } catch { /* storage unavailable */ }
  if (typeof globalThis.dispatchEvent === 'function') globalThis.dispatchEvent(new Event(EVENT))
}

const now = () => new Date().toISOString()
const newId = () => globalThis.crypto?.randomUUID?.() ?? `p-${Date.now()}-${Math.random().toString(36).slice(2)}`
const blankStep = () => ({ status: STEP_STATUS.PENDING, files: [], feedback: null, approval: null })

/** All fifteen steps, Pending until reached (V2 generate_engagement_steps). */
function blankSteps() {
  return Object.fromEntries(Array.from({ length: TOTAL_PROCESS_STEPS }, (_, i) => [i + 1, blankStep()]))
}

/** Change one project and return it; the step_events trigger is the `history` entry. */
function update(projectId, change) {
  const list = read()
  const index = list.findIndex((p) => p.id === projectId)
  if (index === -1) return { success: false, error: 'This project no longer exists.' }
  const result = change(structuredClone(list[index]))
  if (!result.success) return result
  write(list.map((p, i) => (i === index ? result.data : p)))
  return result
}

function setStep(project, stepId, next, actor) {
  const old = project.steps[stepId]
  project.steps[stepId] = { ...old, ...next }
  if (old.status !== project.steps[stepId].status || (old.feedback ?? null) !== (project.steps[stepId].feedback ?? null)) {
    project.history.push({ id: newId(), stepId, oldStatus: old.status, newStatus: project.steps[stepId].status,
      oldFeedback: old.feedback ?? null, newFeedback: project.steps[stepId].feedback ?? null,
      actorName: actor?.fullName ?? null, occurredAt: now() })
  }
}

/* ---------- Writes ---------- */

/** Start a Community Engagement at Step 1. A Representative files only for their own department. */
export function createProject(draft, user) {
  if (!user?.id) return { success: false, error: 'Please log in to start a project.' }
  const errors = startProjectErrors(draft)
  if (Object.keys(errors).length) return { success: false, error: Object.values(errors)[0], fieldErrors: errors }
  const office = isOffice(user)
  if (!office && !(user.role === 'COMEX Representative' && draft.department === user.department)) {
    return { success: false, error: "You can't create this Community Engagement. A COMEX Representative files only for their own department; the COMEX Office can file for anyone." }
  }
  const other = office && draft.proponent === 'other'
  const project = {
    id: newId(),
    title: draft.title.trim(),
    objectives: draft.objectives.trim(),
    projectLead: other ? draft.proponentName.trim() : user.fullName,
    projectLeadId: other ? null : user.id,
    department: draft.department,
    fieldOfWork: draft.fieldOfWork,
    engagementType: draft.engagementType || null,
    bucket: 'New',
    currentStep: 1,
    submittedAt: now(),
    createdBy: user.id,
    steps: blankSteps(),
    history: [],
  }
  write([project, ...read()])
  return { success: true, data: project }
}

/** Edit title, objectives and type (V2 updateEngagementDetails). */
export function updateProjectDetails(projectId, details, user) {
  if (!details?.title?.trim() || !details?.objectives?.trim()) return { success: false, error: 'Project title and objectives are required.' }
  return update(projectId, (p) => {
    if (!canManageProject(p, user)) return { success: false, error: 'You can only edit engagements of your own department.' }
    p.title = details.title.trim()
    p.objectives = details.objectives.trim()
    if (details.engagementType !== undefined) p.engagementType = details.engagementType || null
    return { success: true, data: p }
  })
}

/**
 * Attach a file or link to one upload slot of a step (V2 record_step_file).
 * When every slot the step needs is filled the step becomes Needs Validation.
 * `attachment` is { fileName, fileSize?, link? } — see toAttachment().
 */
export function attachStepFile(projectId, stepId, formCode, attachment, user) {
  const step = getStepById(stepId)
  if (!step?.requiresUpload) return { success: false, error: 'This step does not take uploads.' }
  if (!attachment?.fileName?.trim()) return { success: false, error: 'Choose a file or paste a link.' }
  return update(projectId, (p) => {
    if (!canManageProject(p, user)) return { success: false, error: 'Only the Project Lead or the department’s COMEX Representative can submit this step.' }
    if (stepId > p.currentStep) return { success: false, error: `Finish Step ${p.currentStep} first.` }
    const required = requiredSlots(step, p.engagementType)
    if (!required.includes(formCode)) return { success: false, error: 'This form is not required at this step.' }
    const state = p.steps[stepId]
    if (state.status === STEP_STATUS.APPROVED) return { success: false, error: 'Approved steps cannot be replaced.' }
    const file = { formCode, fileName: attachment.fileName.trim(), fileSize: attachment.fileSize ?? null, link: attachment.link ?? null, formAttachmentId: attachment.formAttachmentId ?? null, uploadedAt: now() }
    const files = [...(state.files ?? []).filter((f) => f.formCode !== formCode), file]
    const complete = required.every((code) => files.some((f) => f.formCode === code))
    setStep(p, stepId, { files, status: complete ? STEP_STATUS.NEEDS_VALIDATION : STEP_STATUS.FILE_ATTACHED,
      feedback: complete ? null : state.feedback }, user)
    if (complete) {
      p.currentStep = Math.max(p.currentStep, stepId)
      if (p.bucket === 'New' && stepId > 1) p.bucket = 'Ongoing'
    }
    return { success: true, data: p, complete }
  })
}

/** Who may decide a step: Approvers the endorsement steps, the office every step. */
export function canReviewStep(stepId, user) {
  return isOffice(user) || (isApprover(user) && ENDORSEMENT_STEP_IDS.includes(Number(stepId)))
}

/** Whether a step is waiting on a reviewer's decision right now. */
export function isAwaitingDecision(project, stepId) {
  const step = getStepById(stepId)
  const state = project?.steps?.[stepId]
  if (!step || !state || state.status === STEP_STATUS.APPROVED) return false
  if (step.requiresUpload) return state.status === STEP_STATUS.NEEDS_VALIDATION
  return project.currentStep === step.id && state.status !== STEP_STATUS.REJECTED
}

/** After a returned endorsement or office step, the Representative sends it back for a decision. */
export function resubmitStep(projectId, stepId, user) {
  const step = getStepById(stepId)
  if (!step || step.requiresUpload) return { success: false, error: 'Attach the files again to resubmit this step.' }
  return update(projectId, (p) => {
    if (!canManageProject(p, user)) return { success: false, error: 'Only the Project Lead or the department’s COMEX Representative can resubmit this step.' }
    if (p.steps[stepId].status !== STEP_STATUS.REJECTED) return { success: false, error: 'Only a returned step can be resubmitted.' }
    setStep(p, stepId, { status: STEP_STATUS.NEEDS_VALIDATION }, user)
    return { success: true, data: p }
  })
}

/**
 * Approve or return a step (V2 reviewEngagementStep). Returning needs a comment.
 * Approving records who cleared it and moves the project to the next step;
 * approving Step 15 moves it to Done.
 */
export function reviewStep(projectId, stepId, { status, feedback = '' } = {}, user) {
  if (![STEP_STATUS.APPROVED, STEP_STATUS.REJECTED].includes(status)) return { success: false, error: 'Choose Approve or Return for revision.' }
  if (!canReviewStep(stepId, user)) return { success: false, error: 'You cannot decide this step.' }
  if (status === STEP_STATUS.REJECTED && !feedback.trim()) {
    return { success: false, error: 'Please write a comment telling the COMEX Representative what to revise.' }
  }
  return update(projectId, (p) => {
    if (!isAwaitingDecision(p, stepId)) return { success: false, error: 'This step is not waiting for a decision.' }
    setStep(p, stepId, { status, feedback: feedback.trim() || null,
      approval: status === STEP_STATUS.APPROVED ? { mode: 'Unsigned', decidedBy: user.fullName, decidedAt: now() } : null }, user)
    if (status === STEP_STATUS.APPROVED) {
      const last = stepId >= TOTAL_PROCESS_STEPS
      p.currentStep = last ? TOTAL_PROCESS_STEPS : stepId + 1
      p.bucket = last ? 'Done' : 'Ongoing'
    }
    return { success: true, data: p }
  })
}

/** Withdraw a Step 1 project; its record and attachments go with it (V2 withdraw_engagement). */
export function withdrawProject(projectId, user) {
  const list = read()
  const project = list.find((p) => p.id === projectId)
  if (!project) return { success: false, error: 'Withdrawal not found or access denied.' }
  if (!canWithdrawEngagement(project, user)) {
    return { success: false, error: 'Only Step 1 engagements in your department or managed by the COMEX Office can be withdrawn.' }
  }
  write(list.filter((p) => p.id !== projectId))
  return { success: true, data: { withdrawn: true } }
}

/** Step attachments adapter: a picked File keeps its name and size; a link keeps its URL.
 * File contents stay on the device until the store moves to Supabase Storage. */
export function toAttachment({ file, link } = {}) {
  if (file?.name) {
    if (!file.size) return { success: false, error: 'Choose a non-empty file.' }
    return { success: true, data: { fileName: file.name, fileSize: file.size } }
  }
  const url = String(link ?? '').trim()
  if (!url) return { success: false, error: 'Choose a file or paste a link.' }
  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('bad protocol')
    return { success: true, data: { fileName: parsed.hostname + parsed.pathname.replace(/\/$/, ''), link: parsed.href } }
  } catch {
    return { success: false, error: 'Paste a full link starting with https://' }
  }
}

/* ---------- Reads ---------- */

export const getProjects = () => read()

/** Steps waiting on this reviewer, oldest project first: [{ project, stepId }]. */
export function stepsAwaitingDecision(projects, user) {
  return projects.flatMap((p) => Object.keys(p.steps).map(Number)
    .filter((id) => isAwaitingDecision(p, id) && canReviewStep(id, user))
    .map((stepId) => ({ project: p, stepId })))
}

/* ---------- Hooks ---------- */

/** Live list of every project, newest first; updates across components and tabs. */
export function useAllProjects() {
  const [all, setAll] = useState(read)
  useEffect(() => {
    const sync = () => setAll(read())
    window.addEventListener(EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])
  return all
}

/** The projects this user may see. */
export function useProjects(user) {
  return visibleTo(useAllProjects(), user)
}

/** Steps waiting for this user's validation or endorsement — feeds the Requires attention panel. */
export function useStepsAwaitingValidation(user) {
  return stepsAwaitingDecision(useAllProjects(), user)
}
