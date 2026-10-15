/* COMEX Head display pages — Figma Frames 9, 10, 11, 11.12 and 12.
 * Display only: nothing on these pages can be changed. */
import { useCallback, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Calendar, CircleCheck, Clock, Eye, Filter, PenLine, Send } from 'lucide-react'
import { AttentionPanel, DisplayButton, DisplayFilter, DisplaySearch } from '../../components/DashboardControls'
import {
  DepartmentPanel,
  ECOWAYS,
  FakeSelect,
  OpportunityPost,
  PageTitle,
  Tabs,
  YellowButton,
} from '../../components/Showcase'
import { useApplications, usePendingApplicationCount } from '../../lib/applications'
import { useUnreadThreadCount } from '../../lib/messages'
import { ApplicantsDialog, Toast } from '../../components/Applications'

/** Frame 9 — Admin Home. */
export function AdminHome() {
  const applicants = useApplications(ECOWAYS.id)
  const pendingCount = usePendingApplicationCount()
  const { user } = useOutletContext()
  const unread = useUnreadThreadCount(user)
  const [showApplicants, setShowApplicants] = useState(false)
  const [toast, setToast] = useState(null)
  const showToast = useCallback((message, tone = 'success') => setToast({ message, tone }), [])
  return (
    <>
      <PageTitle action={<YellowButton>+ New opportunity</YellowButton>}>Volunteer Opportunities</PageTitle>
      <DisplaySearch placeholder="Search volunteer opportunity titles and captions" className="mb-6 max-w-4xl" />
      <OpportunityPost office action={
        <YellowButton className="min-w-56 text-lg" onClick={() => setShowApplicants(true)}>
          List of applicants ({applicants.length})
        </YellowButton>
      } />
      <AttentionPanel items={[
        ...(pendingCount > 0 ? [{
          title: `${pendingCount} volunteer ${pendingCount === 1 ? 'application' : 'applications'} awaiting a decision`,
          detail: 'Accept or decline so volunteers know where they stand.',
          action: 'Review',
          onAction: () => setShowApplicants(true),
        }] : []),
        { title: '4 registrations waiting for approval', detail: 'Review the requested role and department.', action: 'Review', to: 'approvals' },
        ...(unread > 0 ? [{ title: `${unread} unread ${unread === 1 ? 'conversation' : 'conversations'}`, detail: 'Departments and volunteers are waiting for a reply.', action: 'Read', to: 'messages' }] : []),
        { title: 'Community Engagement forms submitted', detail: 'A representative submitted the required forms.', action: 'View', to: 'projects' },
      ]} />
      {showApplicants && (
        <ApplicantsDialog opportunity={ECOWAYS} applicants={applicants} onClose={() => setShowApplicants(false)} onToast={showToast} />
      )}
      <Toast message={toast?.message} tone={toast?.tone} onDismiss={() => setToast(null)} />
    </>
  )
}

/** Frame 10 — Project Proposals. */
export function AdminProjects() {
  return (
    <>
      <PageTitle>Project Proposals</PageTitle>
      <div className="mb-6 flex flex-wrap gap-3">
        <DisplaySearch placeholder="Search by project title or project lead" className="min-w-56 flex-1" />
        <DisplayFilter>A.Y. 2025-2026</DisplayFilter>
        <DisplayFilter>All departments</DisplayFilter>
      </div>
      <div className="space-y-8">
        <DepartmentPanel title="School of Engineering and Technology (SET)" open>
          <Tabs items={['New', 'Ongoing', 'Done']} />
          <div className="flex items-center justify-between gap-4 px-6 py-4">
            <div>
              <p className="font-medium">E-Gabay Learning Hub</p>
              <p className="text-sm text-gray-700">It is a literacy and skills development program</p>
              <p className="mt-2 flex gap-8 text-[11px] text-gray-600">
                <span>Maria Santos</span>
                <span>Step 1</span>
              </p>
            </div>
            <YellowButton className="!px-2 !py-1 text-[11px]">View Status</YellowButton>
          </div>
        </DepartmentPanel>
        <DepartmentPanel title="School of Business Administration (SBA)" />
      </div>
    </>
  )
}

