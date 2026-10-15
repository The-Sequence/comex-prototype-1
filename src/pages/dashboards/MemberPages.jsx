/* Volunteer, COMEX Representative and Approver display pages —
 * Figma Frames 14 and 16–17. Projects and the endorsement queue are in ProjectPages.jsx. */
import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Download, Eye, Filter } from 'lucide-react'
import { AttentionPanel, DisplayButton, DisplayFilter, DisplaySearch } from '../../components/DashboardControls'
import {
  ECOWAYS,
  FakeSelect,
  MessagesPanel,
  OpportunityPost,
  PageTitle,
  YellowButton,
} from '../../components/Showcase'
import { useApplications } from '../../lib/applications'
import { ApplicationForm, Toast } from '../../components/Applications'

/** Frame 14 — Volunteer Opportunities feed. */
export function MemberHome() {
  const { user } = useOutletContext()
  const applied = useApplications(ECOWAYS.id).find(a => a.userId === user.id)
  const [applying, setApplying] = useState(false)
  const [toast, setToast] = useState('')
  return (
    <>
      <PageTitle>Volunteer Opportunities</PageTitle>
      <DisplaySearch placeholder="Search volunteer opportunity titles and captions" className="mb-6 max-w-4xl" />
      <OpportunityPost action={
        <YellowButton className="min-w-56 text-lg" disabled={Boolean(applied)} onClick={() => setApplying(true)}>
          {applied ? `Applied — ${applied.status}` : 'Apply'}
        </YellowButton>
      } />
      <AttentionPanel items={[
        { title: '30 volunteer hours still needed', detail: 'Apply to an activity to complete your requirement.', action: 'Track', to: 'volunteer-hours' },
        { title: '2 unread messages', detail: 'You have a reply from the COMEX Office.', action: 'Read', to: 'messages' },
      ]} />
      {applying && (
        <ApplicationForm
          opportunity={ECOWAYS}
          user={user}
          onClose={() => setApplying(false)}
          onSubmitted={() => {
            setApplying(false)
            setToast('Your application was submitted. The COMEX Office will review it.')
          }}
        />
      )}
      <Toast message={toast} onDismiss={() => setToast('')} />
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
