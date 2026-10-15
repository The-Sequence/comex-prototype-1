/* Volunteer, COMEX Representative and Approver display pages —
 * Figma Frames 14–17, plus an endorsement queue for the Approver actor
 * built from the Frame 10 layout. Display only: nothing here can be changed. */
import { useOutletContext } from 'react-router-dom'
import { CircleCheck, CircleAlert, Clock, Download, Eye, Filter } from 'lucide-react'
import { AttentionPanel, DisplayButton, DisplayFilter, DisplaySearch } from '../../components/DashboardControls'
import {
  DepartmentPanel,
  ECOWAYS_ID,
  FakeSelect,
  MessagesPanel,
  OpportunityPost,
  PageTitle,
  Tabs,
  YellowButton,
} from '../../components/Showcase'
import { applyToOpportunity, useApplications } from '../../lib/applications'

/** Frame 14 — Volunteer Opportunities feed. */
export function MemberHome() {
  const { user } = useOutletContext()
  const applied = useApplications(ECOWAYS_ID).some(a => a.userId === user.id)
  return (
    <>
      <PageTitle>Volunteer Opportunities</PageTitle>
      <DisplaySearch placeholder="Search volunteer opportunity titles and captions" className="mb-6 max-w-4xl" />
      <OpportunityPost action={applied
        ? <YellowButton className="min-w-56 text-lg" disabled><CircleCheck className="mr-2 inline size-5" />Applied</YellowButton>
        : <YellowButton className="min-w-56 text-lg" onClick={() => applyToOpportunity(ECOWAYS_ID, user)}>Apply</YellowButton>} />
      <AttentionPanel items={[
        { title: '30 volunteer hours still needed', detail: 'Apply to an activity to complete your requirement.', action: 'Track' },
        { title: '2 unread messages', detail: 'You have a reply from the COMEX Office.', action: 'Read' },
      ]} />
    </>
  )
}

/** Frame 15 — My Projects (COMEX Representative). */
export function MyProjects() {
  const { user } = useOutletContext()
  const isRepresentative = user.role === 'COMEX Representative'
  return (
    <>
      <PageTitle action={isRepresentative && <YellowButton className="text-lg">+ Create Project Proposal</YellowButton>}>
        {isRepresentative ? 'Department Engagements' : 'Community Engagements'}
      </PageTitle>
      <div className="mb-6 flex flex-wrap gap-3">
        <DisplaySearch placeholder="Search by project title or project lead" className="min-w-56 flex-1" />
        <DisplayFilter>A.Y. 2025-2026</DisplayFilter>
        <DisplayFilter>All statuses</DisplayFilter>
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
            <tr className="align-middle">
              <td className="max-w-56 px-6 py-6 text-xl font-bold leading-snug">
                EcoWays: Waste Segregation Awareness and Management System
              </td>
              <td className="max-w-64 pr-6 text-lg text-gray-600">
                EcoWays is a web-based system designed to promote proper waste segregation.
              </td>
              <td className="whitespace-nowrap pr-6 text-lg">{isRepresentative ? user.fullName : 'Mavi Sia'}</td>
              <td className="text-lg">{user.department}</td>
              <td>
                <DisplayButton className="whitespace-nowrap !rounded-full !border-0 bg-sidebar px-7 font-bold text-white underline">Ongoing · View Status</DisplayButton>
                <p className="mt-1 text-sm text-gray-400">
                  Step 12 · View
                  <br />
                  Progress
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  )
}

const MY_RECORDS = [
  { date: 'May 9, 2025', timeIn: '7:30 AM', timeOut: '2:30 PM', hours: 23 },
  { date: 'May 15, 2025', timeIn: '8:00 AM', timeOut: '3:00 PM', hours: 7 },
]

/** Frame 16 — Volunteer Hours records. */
export function MyVolunteerHours() {
  const { user } = useOutletContext()
  return (
    <>
      <PageTitle>Volunteer Hours</PageTitle>
      <div className="mb-6 flex flex-wrap gap-3"><DisplayFilter>A.Y. 2025-2026</DisplayFilter><DisplayFilter>All terms</DisplayFilter></div>
      <p className="-mt-3 mb-5 text-3xl font-medium">Hello! {user.fullName}</p>
      <div className="rounded-2xl border border-gray-400 px-5 py-4">
        <p className="text-xl font-medium text-gray-800">Volunteer service (1st term - A.Y. 2025-2026)</p>
        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          <div>
            <p className="text-sm font-medium text-gray-600">Total hours earned</p>
            <p className="mt-1 text-4xl font-bold text-indigo-700">30 <span className="text-xl font-medium">hours</span></p>
          </div>
          <div className="sm:border-l sm:border-gray-200 sm:pl-5">
            <p className="text-sm font-medium text-gray-600">Minimum requirement</p>
            <p className="mt-2 text-2xl font-semibold">60 hours</p>
          </div>
          <div className="sm:border-l sm:border-gray-200 sm:pl-5">
            <p className="text-sm font-medium text-gray-600">To meet the minimum</p>
            <p className="mt-2 text-2xl font-semibold">30 more hours</p>
          </div>
        </div>
        <p className="mt-5 border-t border-gray-200 pt-3 text-sm text-gray-600">Every hour counts. Your earned hours keep adding up after you meet the minimum.</p>
      </div>

      <div className="mt-12 border border-gray-400 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold">My Records</h2>
          <div className="flex items-center gap-3">
            <DisplaySearch placeholder="Search hour records" className="w-44 sm:w-72" />
            <DisplayButton icon={Filter} label="Filter volunteer hour records" />
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[820px] whitespace-nowrap text-left text-lg">
            <thead className="border-b-2 border-gray-200 text-gray-700">
              <tr>
                <th className="px-6 py-4 font-medium">Project Name</th>
                <th className="py-4 font-medium">Role</th>
                <th className="py-4 font-medium">Date</th>
                <th className="py-4 font-medium">Time In</th>
                <th className="py-4 font-medium">Time Out</th>
                <th className="py-4 font-medium">Total Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {MY_RECORDS.map((row) => (
                <tr key={row.date}>
                  <td className="max-w-60 whitespace-normal px-6 py-5 leading-snug">EcoWays: Waste Segregation Awareness and Management System</td>
                  <td>Technical Support</td>
                  <td className="text-gray-500">{row.date}</td>
                  <td>{row.timeIn}</td>
                  <td>{row.timeOut}</td>
                  <td className="text-indigo-700">{row.hours} hrs</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6 flex justify-between border-t-2 border-gray-200 pt-3">
          <span className="text-lg text-gray-500">Total completed hours</span>
          <span className="text-xl font-bold text-indigo-700">30 hours earned</span>
        </div>
      </div>
    </>
  )
}

/** Frame 16.5 — My Certificates. */
export function MyCertificates() {
  const { user } = useOutletContext()
  return (
    <>
      <PageTitle>My Certificates</PageTitle>
      <p className="-mt-4 mb-10 text-sm font-medium">View and Download your certificate of volunteer service.</p>
      <FakeSelect className="mb-5 w-48 font-medium">A.Y. 2025-2026</FakeSelect>
      <div className="overflow-x-auto border border-gray-800">
        <table className="w-full min-w-[860px] text-left">
          <thead className="border-b border-gray-300 bg-gray-50 text-xl text-gray-800">
            <tr>
              <th className="px-5 py-4 font-normal">Department</th>
              <th className="py-4 font-normal">Activities</th>
              <th className="py-4 font-normal">Period</th>
              <th className="py-4 font-normal">Total Hours</th>
              <th className="py-4 text-center font-normal">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-5 py-6">
                <span className="rounded bg-indigo-50 px-3 py-1.5 text-lg text-navy">{user.department}</span>
              </td>
              <td className="text-lg leading-relaxed text-gray-700">
                EcoWays Project ·<br />
                Digital Literacy Seminar
                <br />· Tree Planting Drive
              </td>
              <td className="text-lg text-gray-700">January – May 2026</td>
              <td>
                <span className="whitespace-nowrap rounded-full bg-green-50 px-4 py-2 text-2xl font-medium text-green-700">42 hrs</span>
              </td>
              <td className="py-4">
                <div className="flex flex-col items-center gap-3">
                  <DisplayButton className="bg-gray-100 px-5 text-lg">
                    <Eye className="size-4" /> Preview
                  </DisplayButton>
                  <DisplayButton className="bg-indigo-700 px-5 text-lg font-medium text-white">
                    <Download className="size-5" /> Download
                  </DisplayButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  )
}

/** Frame 17 — Messages. */
export function MemberMessages() {
  return (
    <>
      <PageTitle>Messages</PageTitle>
      <MessagesPanel />
    </>
  )
}

const ENDORSEMENTS = [
  { title: 'EcoWays: Waste Segregation Awareness and Management System', lead: 'Mavi Sia', step: 'Step 12' },
  { title: 'E-Gabay Learning Hub', lead: 'Maria Santos', step: 'Step 10' },
]

/** Approver — endorsement requests (use case "Approve Endorsement Request"), styled after Frame 10. */
export function Endorsements() {
  return (
    <>
      <PageTitle>Endorsement Queue</PageTitle>
      <div className="mb-6 flex flex-wrap gap-3">
        <DisplaySearch placeholder="Search by project title or project lead" className="min-w-56 flex-1" />
        <DisplayFilter>All departments</DisplayFilter>
      </div>
      <div className="space-y-8">
        <DepartmentPanel title="School of Engineering and Technology (SET)" open>
          <Tabs items={['For Endorsement', 'Endorsed', 'Returned']} />
          {ENDORSEMENTS.map((p) => (
            <div key={p.title} className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 px-6 py-4 last:border-0">
              <div>
                <p className="font-medium">{p.title}</p>
                <p className="mt-1 flex items-center gap-1 text-xs font-medium text-orange-600">
                  <CircleAlert className="size-3.5" /> Awaiting your endorsement
                </p>
                <p className="mt-2 flex gap-8 text-[11px] text-gray-600">
                  <span>{p.lead}</span>
                  <span>{p.step}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" /> Submitted May 2, 2026
                  </span>
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <DisplayButton className="border-green-600 text-green-700">Endorse</DisplayButton>
                <DisplayButton className="border-red-500 text-red-600">Request revision</DisplayButton>
                <YellowButton className="!px-3 !py-1 text-xs">Review</YellowButton>
              </div>
            </div>
          ))}
        </DepartmentPanel>
        <DepartmentPanel title="School of Business Administration (SBA)" />
      </div>
    </>
  )
}
