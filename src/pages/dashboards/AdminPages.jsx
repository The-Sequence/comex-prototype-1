/* COMEX Head display pages — Figma Frames 9, 10, 11, 11.12 and 12.
 * Display only: nothing on these pages can be changed. */
import { useState } from 'react'
import { Calendar, Clock, Filter, Send, CircleCheck, Eye, PenLine } from 'lucide-react'
import { AttentionPanel, DisplayButton, DisplayFilter, DisplaySearch } from '../../components/DashboardControls'
import {
  Avatar,
  DepartmentPanel,
  ECOWAYS_ID,
  FakeSelect,
  MessagesPanel,
  NavyButton,
  OpportunityPost,
  PageTitle,
  StatusPill,
  Tabs,
  YellowButton,
} from '../../components/Showcase'
import { useApplications } from '../../lib/applications'

/** Frame 9 — Admin Home. */
export function AdminHome() {
  const applicants = useApplications(ECOWAYS_ID)
  const [showApplicants, setShowApplicants] = useState(false)
  return (
    <>
      <PageTitle action={<YellowButton>+ New opportunity</YellowButton>}>Volunteer Opportunities</PageTitle>
      <DisplaySearch placeholder="Search volunteer opportunity titles and captions" className="mb-6 max-w-4xl" />
      <OpportunityPost office action={
        <YellowButton className="min-w-56 text-lg" onClick={() => setShowApplicants(v => !v)}>
          List of applicants ({applicants.length})
        </YellowButton>
      }>
        {showApplicants && (
          <section aria-label="Applicants" className="mt-4 rounded border border-gray-300">
            {applicants.length === 0
              ? <p className="px-5 py-4 text-gray-600">No applicants yet.</p>
              : <ul className="divide-y">
                {applicants.map(a => (
                  <li key={a.userId} className="flex flex-wrap items-center gap-3 px-5 py-3">
                    <Avatar name={a.fullName} />
                    <div className="leading-snug">
                      <p className="font-medium">{a.fullName}</p>
                      <p className="text-sm text-gray-600">{a.role} · {a.department} · {a.email}</p>
                    </div>
                    <p className="ml-auto text-sm text-gray-500">Applied {new Date(a.appliedAt).toLocaleDateString()}</p>
                  </li>
                ))}
              </ul>}
          </section>
        )}
      </OpportunityPost>
      <AttentionPanel items={[
        { title: '4 registrations waiting for approval', detail: 'Review the requested role and department.', action: 'Review' },
        { title: 'Community Engagement forms submitted', detail: 'A representative submitted the required forms.', action: 'View' },
      ]} />
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

const HOUR_ROWS = [
  { name: 'Juan Dela Cruz', hours: 23 },
  { name: 'Maria Santos', hours: 15 },
]

/** Frame 11 — Volunteer Hours Admin Records. */
export function AdminVolunteerHours() {
  return (
    <>
      <PageTitle>Volunteer Hours Admin Records</PageTitle>
      <div className="rounded border border-gray-800 p-5 shadow-md">
        <h2 className="text-2xl font-bold">Encode Volunteer Hours</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3 xl:grid-cols-5">
          <FakeSelect>Juan Dela Cruz</FakeSelect>
          <FakeSelect>EcoWays Initiative</FakeSelect>
          <FakeSelect>Role</FakeSelect>
          <input aria-label="Time in" placeholder="Time in" className="min-w-0 rounded border border-gray-800 px-3 py-2.5 text-sm shadow-sm focus-visible:outline-2 focus-visible:outline-navy" />
          <input aria-label="Time out" placeholder="Time out" className="min-w-0 rounded border border-gray-800 px-3 py-2.5 text-sm shadow-sm focus-visible:outline-2 focus-visible:outline-navy" />
          <div className="flex items-center justify-between rounded border border-gray-800 px-3 py-2.5 text-sm text-gray-600 shadow-sm">
            <input aria-label="Volunteer date" placeholder="dd/mm/yyyy" className="min-w-0 w-full text-sm outline-none focus-visible:ring-2 focus-visible:ring-navy/20" />
            <DisplayButton icon={Calendar} label="Choose volunteer date" className="!min-h-0 !border-0 !p-0 !shadow-none" />
          </div>
        </div>
        <div className="mt-2 text-right">
          <YellowButton className="text-sm">Save record</YellowButton>
        </div>
      </div>

      <div className="my-8 flex items-center gap-4">
        <DisplaySearch placeholder="Search volunteer or department" className="flex-1" />
        <DisplayButton icon={Filter} label="Filter volunteer hours" />
      </div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <DisplayFilter>A.Y. 2025-2026</DisplayFilter>
        <DisplayFilter>All departments</DisplayFilter>
        <DisplayButton icon={PenLine}>Set required hours</DisplayButton>
      </div>

      <div className="space-y-6">
        <DepartmentPanel title="School of Engineering and Technology (SET)" open>
          <Tabs items={['Faculty', 'ASP', 'Students']} />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="py-3 font-medium">Department</th>
                  <th className="py-3 font-medium">Total Hours</th>
                  <th className="py-3 font-medium">Full Records</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {HOUR_ROWS.map((row) => (
                  <tr key={row.name}>
                    <td className="px-6 py-3.5 font-semibold">{row.name}</td>
                    <td className="py-3.5 text-gray-700">School of Engineering &amp; Technology</td>
                    <td className="py-3.5 text-navy-dark">{row.hours} hrs</td>
                    <td className="py-3.5"><DisplayButton className="!border-0 !shadow-none font-semibold text-navy-dark underline">View records</DisplayButton></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DepartmentPanel>
        <DepartmentPanel title="School of Business Administration (SBA)" />
      </div>
    </>
  )
}

const CERT_ROWS = [
  { name: 'Juan Dela Cruz', hours: 48, done: true },
  { name: 'Maria Santos', hours: 32, done: true },
  { name: 'Jose Mendoza', hours: 16, done: false },
]

/** Frame 11.12 — Volunteer Certificates. */
export function AdminCertificates() {
  return (
    <>
      <PageTitle action={<FakeSelect className="w-48 font-medium">A.Y. 2025-2026</FakeSelect>}>Volunteer Certificates</PageTitle>
      <div className="mb-6 flex flex-wrap gap-3">
        <DisplaySearch placeholder="Search volunteer name" className="min-w-56 flex-1" />
        <DisplayFilter>All departments</DisplayFilter><DisplayFilter>All statuses</DisplayFilter>
        <DisplayButton icon={PenLine}>Manage signature</DisplayButton>
      </div>
      <div className="-mt-3 mb-6 flex gap-4 text-sm">
        <span className="rounded-full border border-gray-800 px-3 py-1 text-green-800">16 Done</span>
        <span className="rounded-full border border-gray-800 px-3 py-1 text-amber-500">5 In Progress</span>
        <span className="rounded-full border border-gray-800 px-3 py-1 text-navy">0 Sent</span>
      </div>
      <div className="space-y-6">
        <DepartmentPanel title="School of Engineering and Technology (SET)" open>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead className="bg-gray-50 text-sm uppercase tracking-wide text-gray-600">
                <tr>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="py-3 text-center font-medium">Total Hours</th>
                  <th className="py-3 text-center font-medium">Status</th>
                  <th className="py-3 text-center font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {CERT_ROWS.map((row) => (
                  <tr key={row.name}>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-3 text-lg font-medium">
                        <Avatar name={row.name} size="size-10" /> {row.name}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className={`rounded-md px-3 py-1 text-lg font-bold ${row.done ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-600'}`}>
                        {row.hours} hrs
                      </span>
                    </td>
                    <td className="text-center">
                      {row.done ? (
                        <StatusPill tone="green">
                          <CircleCheck className="size-4" /> Done
                        </StatusPill>
                      ) : (
                        <StatusPill tone="orange">
                          <Clock className="size-4" /> 4 hrs left
                        </StatusPill>
                      )}
                    </td>
                    <td className="text-center">
                      {row.done ? (
                        <span className="inline-flex gap-2">
                          <DisplayButton icon={Eye} className="bg-white">Preview</DisplayButton>
                          <NavyButton className="inline-flex w-24 items-center justify-center gap-1 !bg-amber-500 !text-black">
                            <Send className="size-3.5" /> Send
                          </NavyButton>
                        </span>
                      ) : (
                        <span className="text-sm italic text-gray-400">Not yet eligible</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DepartmentPanel>
        <DepartmentPanel title="School of Business Administration (SBA)" />
      </div>
    </>
  )
}

/** Frame 12 — Messages. */
export function AdminMessages() {
  return (
    <>
      <PageTitle>Messages</PageTitle>
      <MessagesPanel showNewBadge />
    </>
  )
}
