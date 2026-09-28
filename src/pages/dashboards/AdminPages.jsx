/* COMEX Head display pages — Figma Frames 9, 10, 11, 11.12 and 12.
 * Display only: nothing on these pages can be changed. */
import { Calendar, Clock, Filter, Send, CircleCheck } from 'lucide-react'
import {
  Avatar,
  DepartmentPanel,
  FakeSelect,
  MessagesPanel,
  NavyButton,
  OpportunityPost,
  PageTitle,
  StatusPill,
  Tabs,
  YellowButton,
} from '../../components/Showcase'

/** Frame 9 — Admin Home. */
export function AdminHome() {
  return (
    <>
      <PageTitle action={<YellowButton>+ Post Volunteering Opportunities</YellowButton>}>Volunteer Opportunities</PageTitle>
      <OpportunityPost actionLabel="List of applicants" />
    </>
  )
}

/** Frame 10 — Project Proposals. */
export function AdminProjects() {
  return (
    <>
      <PageTitle>Project Proposals</PageTitle>
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
          <div className="rounded border border-gray-800 px-3 py-2.5 text-sm shadow-sm">Time in</div>
          <div className="rounded border border-gray-800 px-3 py-2.5 text-sm shadow-sm">Time out</div>
          <div className="flex items-center justify-between rounded border border-gray-800 px-3 py-2.5 text-sm text-gray-600 shadow-sm">
            dd/mm/yyyy <Calendar className="size-5 text-black" />
          </div>
        </div>
        <div className="mt-2 text-right">
          <YellowButton className="text-sm">Add Record</YellowButton>
        </div>
      </div>

      <div className="my-8 flex items-center gap-4">
        <div className="flex-1 rounded border border-gray-800 px-3 py-3 text-sm text-gray-500">Search Volunteer or department...</div>
        <span className="rounded border border-gray-800 p-2 shadow-sm">
          <Filter className="size-5" />
        </span>
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
                    <td className="py-3.5 font-semibold text-navy-dark underline">View</td>
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
                          <NavyButton className="w-28">Generate</NavyButton>
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
