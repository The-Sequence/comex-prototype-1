/* Volunteer Opportunities feed — Figma Frames 9 (office) and 14 (members).
 * Posting, editing, deleting, searching and applying ported from comex-frontend-v2
 * (AdminHome.jsx, UserHome.jsx). Posts live in this browser; see src/lib/opportunities.js. */
import { useCallback, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Search } from 'lucide-react'
import { AttentionPanel, DisplaySearch } from '../../components/DashboardControls'
import { OpportunityPost, PageTitle, YellowButton } from '../../components/Showcase'
import { ApplicantsDialog, ApplicationForm, Modal, SelectField, Toast } from '../../components/Applications'
import { FieldError, Label, OutlineButton, PrimaryButton, TextField } from '../../components/Form'
import { useAllApplications, useApplications } from '../../lib/applications'
import { createOpportunity, deleteOpportunity, updateOpportunity, useOpportunities } from '../../lib/opportunities'
import { AUDIENCES, CAPTION_MAX, opportunityErrors } from '../../lib/opportunityRules'
import { isAwaitingApproval, useRegistrations } from '../../lib/useUsers'
import { useUnreadThreadCount } from '../../lib/messages'
import { useHoursStillNeeded } from '../../lib/volunteerHours'

const SEARCH_PLACEHOLDER = 'Search volunteer opportunity titles and captions'
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

function NoPosts({ query }) {
  return (
    <div className="flex max-w-4xl flex-col items-center rounded-xl border border-dashed border-gray-400 py-12 text-center">
      <Search className="size-8 text-gray-400" aria-hidden="true" />
      <p className="mt-3 font-semibold">{query ? 'No opportunities match your search' : 'No volunteer opportunities yet'}</p>
      <p className="mt-1 text-sm text-gray-600">{query ? 'Try another word from the title or caption.' : 'New posts from the COMEX Office will appear here.'}</p>
    </div>
  )
}

/** "+ New opportunity" and Edit share this composer. */
function OpportunityComposer({ opportunity, user, onClose, onSaved }) {
  const [draft, setDraft] = useState({
    title: opportunity?.title ?? '',
    caption: opportunity?.caption ?? '',
    audience: opportunity?.audience ?? 'Everyone',
  })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const set = (field) => (e) => {
    setDraft((d) => ({ ...d, [field]: e.target.value }))
    setErrors(({ [field]: _, ...rest }) => rest)
  }

  const save = () => {
    setFormError('')
    const found = opportunityErrors(draft)
    setErrors(found)
    if (Object.keys(found).length) return
    const result = opportunity ? updateOpportunity(opportunity.id, draft) : createOpportunity(draft, user)
    if (!result.success) return setFormError(result.error ?? 'Could not save the post.')
    onSaved(opportunity ? 'Your changes were saved.' : 'Your opportunity was posted.')
  }

  return (
    <Modal
      title={opportunity ? 'Edit opportunity' : 'Post a volunteering opportunity'}
      size="max-w-2xl"
      onClose={onClose}
      footer={<>
        <OutlineButton type="button" onClick={onClose}>Cancel</OutlineButton>
        <PrimaryButton type="button" onClick={save}>{opportunity ? 'Save changes' : 'Post'}</PrimaryButton>
      </>}
    >
      <div className="space-y-4">
        <TextField id="opp-title" label="Project Title" required value={draft.title} onChange={set('title')} error={errors.title} />
        <div>
          <Label htmlFor="opp-caption">Caption</Label>
          <textarea
            id="opp-caption"
            rows={4}
            maxLength={CAPTION_MAX}
            value={draft.caption}
            onChange={set('caption')}
            aria-invalid={!!errors.caption}
            aria-describedby={errors.caption ? 'opp-caption-error' : undefined}
            className="w-full rounded-sm border border-gray-400 px-2.5 py-2 text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/20"
          />
          <FieldError id="opp-caption-error">{errors.caption}</FieldError>
        </div>
        <SelectField id="opp-audience" label="Who can see this post" required value={draft.audience} onChange={set('audience')}
          options={AUDIENCES} placeholder="Choose an audience" error={errors.audience || formError} />
      </div>
    </Modal>
  )
}

function DeleteOpportunity({ opportunity, onClose, onDeleted }) {
  const [error, setError] = useState('')
  const confirm = () => {
    const result = deleteOpportunity(opportunity.id)
    if (!result.success) return setError(result.error ?? 'Could not delete the post.')
    onDeleted()
  }
  return (
    <Modal
      title="Delete this opportunity?"
      size="max-w-md"
      onClose={onClose}
      footer={<>
        <OutlineButton type="button" onClick={onClose}>Cancel</OutlineButton>
        <PrimaryButton type="button" className="!bg-red-600 hover:!bg-red-700" onClick={confirm}>Delete post</PrimaryButton>
      </>}
    >
      <p className="text-sm leading-relaxed text-gray-700">
        <span className="font-semibold">{opportunity.title}</span> will be removed from the feed. Applications already received stay on record.
      </p>
      {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
    </Modal>
  )
}

function OfficePost({ opportunity, onApplicants, onEdit, onDelete }) {
  const applicants = useApplications(opportunity.id)
  return (
    <OpportunityPost opportunity={opportunity} onEdit={onEdit} onDelete={onDelete} action={
      <YellowButton className="min-w-56 text-lg" onClick={onApplicants}>
        List of applicants ({applicants.length})
      </YellowButton>
    } />
  )
}

/** Frame 9 — Admin Home. */
export function AdminHome() {
  const { user } = useOutletContext()
  const [query, setQuery] = useState('')
  const opportunities = useOpportunities({ office: true, query })
  const live = useOpportunities({ office: true })
  const applications = useAllApplications()
  const registrations = useRegistrations('pending')
  const unread = useUnreadThreadCount(user)
  const [dialog, setDialog] = useState(null)
  const [toast, setToast] = useState(null)
  const showToast = useCallback((message, tone = 'success') => setToast({ message, tone }), [])
  const close = () => setDialog(null)
  const done = (message) => { close(); showToast(message) }

  const liveIds = new Set(live.map(o => o.id))
  const pending = applications.filter(a => a.status === 'Pending' && liveIds.has(a.opportunityId))
  const awaiting = registrations.status === 'ready' ? registrations.rows.filter(isAwaitingApproval).length : 0
  const applicantsOf = dialog?.type === 'applicants' ? applications.filter(a => a.opportunityId === dialog.opportunity.id)
    .sort((a, b) => a.appliedAt.localeCompare(b.appliedAt)) : []

  return (
    <>
      <PageTitle action={<YellowButton onClick={() => setDialog({ type: 'compose' })}>+ New opportunity</YellowButton>}>Volunteer Opportunities</PageTitle>
      <DisplaySearch placeholder={SEARCH_PLACEHOLDER} className="mb-6 max-w-4xl" value={query} onChange={setQuery} />
      {opportunities.length === 0 ? <NoPosts query={query.trim()} /> : (
        <div className="space-y-12">
          {opportunities.map(o => (
            <OfficePost key={o.id} opportunity={o}
              onApplicants={() => setDialog({ type: 'applicants', opportunity: o })}
              onEdit={() => setDialog({ type: 'compose', opportunity: o })}
              onDelete={() => setDialog({ type: 'delete', opportunity: o })} />
          ))}
        </div>
      )}
      <AttentionPanel items={[
        ...(pending.length > 0 ? [{
          title: `${plural(pending.length, 'volunteer application')} awaiting a decision`,
          detail: 'Accept or decline so volunteers know where they stand.',
          action: 'Review',
          onAction: () => setDialog({ type: 'applicants', opportunity: live.find(o => o.id === pending[0].opportunityId) }),
        }] : []),
        ...(awaiting > 0 ? [{
          title: `${plural(awaiting, 'registration')} waiting for approval`,
          detail: 'Review the requested role and department.',
          action: 'Review',
          to: 'approvals',
        }] : []),
        ...(unread > 0 ? [{ title: `${plural(unread, 'unread conversation')}`, detail: 'Departments and volunteers are waiting for a reply.', action: 'Read', to: 'messages' }] : []),
        { title: 'Community Engagement forms submitted', detail: 'A representative submitted the required forms.', action: 'View', to: 'projects' },
      ]} />
      {dialog?.type === 'compose' && <OpportunityComposer opportunity={dialog.opportunity} user={user} onClose={close} onSaved={done} />}
      {dialog?.type === 'delete' && <DeleteOpportunity opportunity={dialog.opportunity} onClose={close} onDeleted={() => done('The post was deleted.')} />}
      {dialog?.type === 'applicants' && (
        <ApplicantsDialog opportunity={dialog.opportunity} applicants={applicantsOf} onClose={close} onToast={showToast} />
      )}
      <Toast message={toast?.message} tone={toast?.tone} onDismiss={() => setToast(null)} />
    </>
  )
}

/** Frame 14 — Volunteer Opportunities feed. */
export function MemberHome() {
  const { user } = useOutletContext()
  const [query, setQuery] = useState('')
  const opportunities = useOpportunities({ role: user.role, query })
  const mine = useAllApplications().filter(a => a.userId === user.id)
  const [applying, setApplying] = useState(null)
  const [toast, setToast] = useState('')
  const hoursNeeded = useHoursStillNeeded(user)
  const unread = useUnreadThreadCount(user)
  return (
    <>
      <PageTitle>Volunteer Opportunities</PageTitle>
      <DisplaySearch placeholder={SEARCH_PLACEHOLDER} className="mb-6 max-w-4xl" value={query} onChange={setQuery} />
      {opportunities.length === 0 ? <NoPosts query={query.trim()} /> : (
        <div className="space-y-12">
          {opportunities.map(o => {
            const applied = mine.find(a => a.opportunityId === o.id)
            return (
              <OpportunityPost key={o.id} opportunity={o} action={
                <YellowButton className="min-w-56 text-lg" disabled={Boolean(applied)} onClick={() => setApplying(o)}>
                  {applied ? `Applied — ${applied.status}` : 'Apply'}
                </YellowButton>
              } />
            )
          })}
        </div>
      )}
      <AttentionPanel items={[
        ...(hoursNeeded > 0 ? [{ title: `${plural(hoursNeeded, 'volunteer hour')} still needed`, detail: 'Apply to an activity to complete your requirement.', action: 'Track', to: 'volunteer-hours' }] : []),
        ...(unread > 0 ? [{ title: plural(unread, 'unread conversation'), detail: 'Someone is waiting for your reply.', action: 'Read', to: 'messages' }] : []),
      ]} />
      {applying && (
        <ApplicationForm
          opportunity={applying}
          user={user}
          onClose={() => setApplying(null)}
          onSubmitted={() => {
            setApplying(null)
            setToast('Your application was submitted. The COMEX Office will review it.')
          }}
        />
      )}
      <Toast message={toast} onDismiss={() => setToast('')} />
    </>
  )
}
