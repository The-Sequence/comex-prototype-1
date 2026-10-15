import { beforeEach, test } from 'node:test'
import assert from 'node:assert/strict'
import {
  attachStepFile, createProject, getProjects, resubmitStep, reviewStep, stepsAwaitingDecision, toAttachment, withdrawProject,
} from '../src/lib/projects.js'
import {
  approvalNoticeBody, canWithdrawEngagement, describeStepEvent, formsForType, revisionFeedback, startProjectErrors, typeGuidance, visibleTo,
} from '../src/lib/projectRules.js'

const memory = () => {
  const m = new Map()
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) }
}
beforeEach(() => { globalThis.localStorage = memory() })

const head = { id: 'h', fullName: 'Hana Head', role: 'COMEX Head' }
const rep = { id: 'r', fullName: 'Rico Rep', role: 'COMEX Representative', department: 'SET' }
const otherRep = { id: 'r2', fullName: 'Sam Rep', role: 'COMEX Representative', department: 'SBA' }
const approver = { id: 'a', fullName: 'Ada Approver', role: 'Approver' }
const student = { id: 's', fullName: 'Stu Dent', role: 'Student', department: 'SET' }
const draft = { title: 'E-Gabay', objectives: 'Literacy', department: 'SET', fieldOfWork: 'Students' }

const start = () => createProject(draft, rep).data
const attach = (p, step, code = 'attachment', who = rep) => attachStepFile(p.id, step, code, { fileName: `${code}.pdf`, fileSize: 10 }, who)
const approve = (p, step, who = head) => reviewStep(p.id, step, { status: 'Approved' }, who)

test('start project validation matches V2', () => {
  assert.deepEqual(Object.keys(startProjectErrors({})), ['title', 'objectives', 'department', 'fieldOfWork'])
  assert.ok(startProjectErrors({ ...draft, proponent: 'other' }).proponentName)
  assert.deepEqual(startProjectErrors(draft), {})
})

test('a Representative starts projects only for their own department', () => {
  assert.equal(createProject({ ...draft, department: 'SBA' }, rep).success, false)
  assert.equal(createProject(draft, student).success, false)
  const p = start()
  assert.equal(p.currentStep, 1)
  assert.equal(p.bucket, 'New')
  assert.equal(Object.keys(p.steps).length, 15)
  const byOffice = createProject({ ...draft, proponent: 'other', proponentName: 'Maria Santos' }, head).data
  assert.equal(byOffice.projectLead, 'Maria Santos')
})

test('a complete upload makes the step Needs Validation; partial is File Attached', () => {
  const p = start()
  assert.equal(attach(p, 2).success, false, 'cannot skip ahead')
  assert.equal(attach(p, 1, '001').success, false, 'wrong slot')
  assert.equal(attach(p, 1, 'attachment', otherRep).success, false, 'other department')
  const r = attach(p, 1)
  assert.equal(r.data.steps[1].status, 'Needs Validation')
  assert.equal(r.complete, true)
})

test('forms by engagement type decide the Step 4 slots', () => {
  assert.deepEqual(formsForType(4, ['002', '003', '004'], 'seminar'), ['003'])
  assert.deepEqual(formsForType(14, ['010', '015'], 'seminar'), ['010', '014', '015'])
  assert.deepEqual(formsForType(4, ['002', '003', '004'], null), ['002', '003', '004'])
  assert.match(typeGuidance(4, ['002', '003', '004'], null), /Set the project type/)
  assert.equal(typeGuidance(1, [], 'program'), '')
})

test('approving advances the project; returning needs a comment and goes back to the lead', () => {
  let p = start()
  attach(p, 1)
  assert.equal(reviewStep(p.id, 1, { status: 'Rejected' }, head).success, false)
  p = reviewStep(p.id, 1, { status: 'Rejected', feedback: revisionFeedback(['missing-info'], 'Add the venue') }, head).data
  assert.equal(p.steps[1].status, 'Rejected')
  assert.equal(p.steps[1].feedback, 'Missing information — Add the venue')
  assert.equal(stepsAwaitingDecision(getProjects(), head).length, 0)
  p = attach(p, 1).data
  assert.equal(p.steps[1].feedback, null, 'resubmitting clears the old feedback')
  assert.equal(stepsAwaitingDecision(getProjects(), head).length, 1)
  assert.equal(approve(p, 1, rep).success, false, 'a Representative cannot validate')
  p = approve(p, 1).data
  assert.equal(p.currentStep, 2)
  assert.equal(p.bucket, 'Ongoing')
  assert.equal(p.steps[1].approval.decidedBy, 'Hana Head')
  assert.equal(attach(p, 1).success, false, 'approved steps cannot be replaced')
})

test('endorsement steps go to the Approver, then the office, through to Done', () => {
  let p = start()
  for (let step = 1; step <= 8; step += 1) {
    const slots = { 3: ['MOA'], 4: ['002', '003', '004'], 5: ['016', '017', '005'], 7: ['001', '006', '007', '008'], 8: ['SARF'] }[step] ?? ['attachment']
    slots.forEach((code) => { p = attach(p, step, code).data })
    p = approve(p, step).data
  }
  assert.equal(p.currentStep, 9)
  assert.deepEqual(stepsAwaitingDecision(getProjects(), approver).map((s) => s.stepId), [9])
  p = reviewStep(p.id, 9, { status: 'Rejected', feedback: 'Needs dean signature' }, approver).data
  assert.equal(stepsAwaitingDecision(getProjects(), approver).length, 0)
  p = resubmitStep(p.id, 9, rep).data
  p = approve(p, 9, approver).data
  assert.equal(approve(p, 11, approver).success, false, 'step 11 belongs to the office')
  p = approve(p, 10, approver).data
  p = approve(p, 11).data
  for (const step of [12, 13, 14]) {
    const slots = { 13: ['009'], 14: ['010', '011', '012', '013', '015'] }[step] ?? ['attachment']
    slots.forEach((code) => { p = attach(p, step, code).data })
    p = approve(p, step).data
  }
  p = approve(p, 15).data
  assert.equal(p.bucket, 'Done')
  assert.equal(p.currentStep, 15)
  assert.ok(p.history.length > 20)
})

test('withdrawal only at Step 1 by the office or that department', () => {
  const p = start()
  assert.equal(canWithdrawEngagement(p, otherRep), false)
  assert.equal(withdrawProject(p.id, otherRep).success, false)
  assert.equal(withdrawProject(p.id, rep).success, true)
  assert.equal(getProjects().length, 0)
  const q = start()
  attach(q, 1)
  approve(q, 1)
  assert.equal(withdrawProject(q.id, head).success, false)
})

test('visibility, history wording and approval notice', () => {
  const p = start()
  assert.equal(visibleTo([p], otherRep).length, 0)
  assert.equal(visibleTo([p], approver).length, 1)
  assert.equal(visibleTo([p], student).length, 0)
  assert.deepEqual(describeStepEvent({ oldStatus: 'Pending', newStatus: 'Needs Validation', actorName: 'R' }, 'user'),
    { actor: 'R', status: 'Pending → Submitted', feedback: null })
  assert.equal(approvalNoticeBody('Ada', 'Ada: Looks good'), 'Cleared by Ada. Comment: Looks good')
})

test('attachment adapter accepts files and https links only', () => {
  assert.deepEqual(toAttachment({ file: { name: 'a.pdf', size: 3 } }).data, { fileName: 'a.pdf', fileSize: 3 })
  assert.equal(toAttachment({ file: { name: 'a.pdf', size: 0 } }).success, false)
  assert.equal(toAttachment({ link: 'javascript:alert(1)' }).success, false)
  assert.equal(toAttachment({ link: 'https://drive.google.com/x/' }).data.link, 'https://drive.google.com/x/')
})
