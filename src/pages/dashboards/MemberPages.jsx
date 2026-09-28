/* Volunteer, COMEX Representative and Approver display pages —
 * Figma Frames 14–17, plus an endorsement queue for the Approver actor
 * built from the Frame 10 layout. Display only: nothing here can be changed. */
import { useOutletContext } from 'react-router-dom'
import { CircleAlert, Clock, Download, Eye, Filter, Search } from 'lucide-react'
import {
  DepartmentPanel,
  FakeSelect,
  MessagesPanel,
  OpportunityPost,
  PageTitle,
  Tabs,
  YellowButton,
} from '../../components/Showcase'

/** Frame 14 — Volunteer Opportunities feed. */
export function MemberHome() {
  return (
    <>
      <PageTitle>Volunteer Opportunities</PageTitle>
      <OpportunityPost actionLabel="Apply" />
    </>
  )
}

/** Frame 15 — My Projects (COMEX Representative). */
export function MyProjects() {
  const { user } = useOutletContext()
  return (
    <>
      <PageTitle action={<YellowButton className="text-lg">+ Create Project Proposal</YellowButton>}>My Projects</PageTitle>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-left">
          <thead className="whitespace-nowrap border-b-2 border-gray-300 text-xl">
            <tr>
              <th className="px-6 py-4 font-bold">Project Title</th>
              <th className="pr-6 py-4 font-bold">Project Objectives</th>
              <th className="pr-6 py-4 font-bold">Project Lead</th>
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
              <td className="whitespace-nowrap pr-6 text-lg">{user.fullName}</td>
              <td className="text-lg">{user.department}</td>
              <td>
                <span className="inline-block whitespace-nowrap rounded-full bg-sidebar px-7 py-2 text-sm font-bold text-white underline">Ongoing &gt;</span>
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
      <p className="-mt-3 mb-5 text-3xl font-medium">Hello! {user.fullName}</p>
      <div className="rounded-2xl border border-gray-400 px-5 py-4">
        <p className="text-xl font-medium text-gray-800">Total Volunteer Hours (1st term - A.Y 2025-2026)</p>
        <div className="mt-4 h-11 rounded-full bg-gray-200">
          <div className="flex h-full w-1/2 items-center justify-end rounded-full bg-indigo-700 pr-3 text-lg font-bold text-white">50%</div>
        </div>
        <div className="mt-2 flex justify-between text-lg text-gray-500">
          <span>30 hours completed</span>
          <span>60 hours required</span>
        </div>
      </div>

      <div className="mt-12 border border-gray-400 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold">My Records</h2>
          <div className="flex items-center gap-3">
            <div className="flex w-72 items-center gap-2 rounded border border-gray-300 px-3 py-2 text-lg text-gray-500">
              <Search className="size-5" /> Search
            </div>
            <span className="rounded border border-gray-400 p-2">
              <Filter className="size-6" />
            </span>
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
          <span className="text-xl font-bold text-indigo-700">30 / 60 hrs</span>
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
                  <span className="inline-flex items-center gap-2 rounded bg-gray-100 px-5 py-2 text-lg">
                    <Eye className="size-4" /> Preview
                  </span>
                  <span className="inline-flex items-center gap-2 rounded bg-indigo-700 px-5 py-2 text-lg font-medium text-white">
                    <Download className="size-5" /> Generate
                  </span>
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
      <PageTitle>Endorsement Requests</PageTitle>
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
              <div className="flex gap-2">
                <span className="rounded border border-green-600 px-3 py-1.5 text-sm font-semibold text-green-700">✓ Endorse</span>
                <span className="rounded border border-red-500 px-3 py-1.5 text-sm font-semibold text-red-600">Return</span>
                <YellowButton className="!px-3 !py-1 text-xs">View Status</YellowButton>
              </div>
            </div>
          ))}
        </DepartmentPanel>
        <DepartmentPanel title="School of Business Administration (SBA)" />
      </div>
    </>
  )
}
