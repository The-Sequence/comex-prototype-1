/* The COMEX Community Engagement workflow: three parts, fifteen steps, and the
 * forms each step needs. Ported from comex-frontend-v2 (src/config/comexProcess.js).
 * Step ids are stable keys (step_no in Supabase), so never renumber them. */

export const COMEX_FORMS = {
  '001': 'COMEX Form 001 — Community Engagement Proposal',
  '002': 'COMEX Form 002 — Manifestation of Consent and Initial Agreement for the Extension Program',
  '003': 'COMEX Form 003 — Manifestation of Consent and Initial Agreement for Seminar/Workshop/Training',
  '004': 'COMEX Form 004 — Manifestation of Consent and Initial Agreement for the Outreach Project',
  '005': 'COMEX Form 005 — Needs Assessment Report',
  '006': 'COMEX Form 006 — Checklist of Criteria (Extension Program)',
  '007': 'COMEX Form 007 — Checklist of Criteria (Seminar/Workshop/Training)',
  '008': 'COMEX Form 008 — Checklist of Criteria (Outreach Project)',
  '009': 'COMEX Form 009 — Progress Report',
  '010': 'COMEX Form 010 — Project Evaluation Report',
  '011': 'COMEX Form 011 — Project Evaluation Report',
  '012': 'COMEX Form 012 — Project Evaluation Report',
  '013': 'COMEX Form 013 — Project Evaluation Report',
  '014': 'COMEX Form 014 — Capacity-Building Services Report',
  '015': 'COMEX Form 015 — Project Evaluation Report',
  '016': 'COMEX Form 016 — Consent Form for Community Interview',
  '017': 'COMEX Form 017 — Community Needs Assessment Survey',
  SARF: 'Student Activity Request Form (SARF) — issued by the SDAO Office',
  MOA: 'MOA / MOU — secured through the AILPO Office',
  attachment: 'Supporting file',
}

const REP = 'COMEX Representative'
const step = (id, title, description, forms, actor = REP, requiresUpload = true, requiresSignature = false) =>
  ({ id, title, description, forms, actor, requiresUpload, requiresSignature })

export const COMEX_PROCESS_PARTS = [
  {
    id: 'part-1',
    title: 'PART 1 — COMMUNITY COORDINATION & PLANNING',
    stepRangeLabel: 'Steps 1-7',
    steps: [
      step(1, 'Community Coordination', "The COMEX Representative coordinates with the partner community and creates the department's Community Engagement record in the system.", []),
      step(2, 'Community Partnership Assessment', 'Determine if the target community is already a COMEX partner. If not, coordinate with the community to establish a partnership. Proceed once all conditions are met.', []),
      step(3, 'Securing MOU & MOA from AILPO', 'If the lead opted to secure a MOA/MOU prior to implementation, the agreement is obtained through the AILPO office.', ['MOA']),
      step(4, 'Accomplish COMEX Forms 002, 003 & 004', 'Accomplish the Manifestation of Consent and Initial Agreement that matches the category and type of Community Engagement.', ['002', '003', '004']),
      step(5, 'Accomplish COMEX Forms 016, 017 & 005', 'Conduct the community interview and needs assessment survey, then compile the Needs Assessment Report.', ['016', '017', '005']),
      step(6, 'Project Presentation and Community Approval', 'The proposed project is presented to the partner community for review. If approved the project proceeds; otherwise revisions are made based on community suggestions.', []),
      step(7, 'Accomplish COMEX Form 001 & Checklist of Criteria', 'Prepare the Community Engagement Proposal together with the Checklist of Criteria based on the nature of the initiative.', ['001', '006', '007', '008']),
    ],
  },
  {
    id: 'part-2',
    title: 'PART 2 — ENDORSEMENT & APPROVAL',
    stepRangeLabel: 'Steps 8-11',
    steps: [
      step(8, 'Secure Student Activity Request Form (SARF)', "Required only when the engagement is student-led. The SARF is provided by the SDAO Office before the Directors' endorsement.", ['SARF']),
      step(9, 'Endorsement by Program Chairperson / School Dean', 'The submission is routed for endorsement and signed digitally, replacing the physical routing of printed documents.', [], 'Program Chairperson / Dean', false, true),
      step(10, "Director's Endorsement and E-Signature", 'Community Engagements requiring higher level institutional authorization are forwarded to the Director/s, who affix their e-signature directly on the document.', [], 'Director', false, true),
      step(11, 'COMEX Office Review and Approval', 'The COMEX Head and COMEX Associate validate the completeness of every attached form and approve the Community Engagement.', [], 'COMEX Head', false, true),
    ],
  },
  {
    id: 'part-3',
    title: 'PART 3 — IMPLEMENTATION & EVALUATION',
    stepRangeLabel: 'Steps 12-15',
    steps: [
      step(12, 'Community Engagement Implementation', 'The approved Community Engagement is carried out with the partner community and volunteer attendance is captured in the system.', []),
      step(13, 'Accomplish COMEX Form 009 — Progress Report', 'Community Engagements that run in multiple phases submit a progress report for each completed phase.', ['009']),
      step(14, 'Submit Project Evaluation Report', 'Submit the evaluation report forms for endorsement, then to the COMEX office for review and approval.', ['010', '011', '012', '013', '015']),
      step(15, 'Volunteer Hours Encoding and E-Certificate Release', 'The COMEX Head encodes the rendered volunteer hours and the system generates e-certificates for everyone who met the requirement.', [], 'COMEX Head', false),
    ],
  },
]

export const ALL_PROCESS_STEPS = COMEX_PROCESS_PARTS.flatMap((part) => part.steps)
export const TOTAL_PROCESS_STEPS = ALL_PROCESS_STEPS.length

/** Steps an Approver clears: the Chairperson/Dean endorsement and the Director's. */
export const DEPARTMENT_ENDORSEMENT_STEP_ID = 9
export const DIRECTOR_ENDORSEMENT_STEP_ID = 10
export const ENDORSEMENT_STEP_IDS = [DEPARTMENT_ENDORSEMENT_STEP_ID, DIRECTOR_ENDORSEMENT_STEP_ID]

export const getStepById = (stepId) => ALL_PROCESS_STEPS.find((s) => s.id === Number(stepId))

/** Whole-number percent of the workflow reached, clamped to 0–100. */
export function getProgressPercent(currentStep) {
  return Math.min(100, Math.max(0, Math.round((currentStep / TOTAL_PROCESS_STEPS) * 100)))
}

/** The five step states from V2's tracker legend. */
export const STEP_STATUS = {
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  NEEDS_VALIDATION: 'Needs Validation',
  PENDING: 'Pending',
  FILE_ATTACHED: 'File Attached',
}

/** A Representative reads "Submitted" where the office reads "Needs Validation". */
export const statusLabelFor = (status, mode) =>
  mode === 'user' && status === STEP_STATUS.NEEDS_VALIDATION ? 'Submitted' : status

/** Fields of work offered when starting a project (labels from V2 src/config/fieldsOfWork.js). */
export const FIELDS_OF_WORK = [
  'Students', 'Official', 'Alumni', 'Faculty Service Office', 'Laboratory Service', 'LRC', 'NSTP Office',
  'Admissions Office', 'Discipline Office', 'GCO', 'Health Service Office', "Registrar's Office", 'SDAO',
  'Accounting Office', 'Asset Management Office', 'FMO', 'HR', 'Management Office', 'Quality Management Office',
  'Treasury Office', 'AILPO', 'COMEX', "Executive Director's Office", 'ITSO', 'Marketing Office', 'Security Office',
]
