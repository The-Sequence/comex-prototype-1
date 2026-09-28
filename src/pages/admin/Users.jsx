import { useState } from 'react'
import { Clock, UserRound, UserRoundCheck } from 'lucide-react'
import { ADMIN_ROLES, DEPARTMENTS } from '../../lib/db'
import { formatDate, isAwaitingApproval, useUsers } from '../../lib/useUsers'

function StatCard({ icon: Icon, value, label }) {
  return (
    <div className="flex flex-col items-center rounded-xl border-2 border-gold-soft bg-white px-4 py-5 shadow-md">
      <Icon className="size-8 stroke-[1.5]" />
      <p className="mt-2 text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs font-semibold">{label}</p>
    </div>
  )
}

/** Frame 7 — Admin: Users. */
export default function Users() {
  const users = useUsers()
  const [department, setDepartment] = useState('')

  const members = users.filter((u) => !ADMIN_ROLES.includes(u.role))
  const verified = members.filter((u) => u.status === 'approved')
  const pending = members.filter(isAwaitingApproval)

  const rows = verified
    .filter((u) => !department || u.department === department)
    .sort((a, b) => (b.approvedAt ?? '').localeCompare(a.approvedAt ?? ''))

  return (
    <div>
      <h1 className="text-lg font-bold">Admin Dashboard</h1>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={UserRound} value={members.length} label="Total Accounts" />
        <StatCard icon={Clock} value={pending.length} label="Pending Accounts" />
        <StatCard icon={UserRoundCheck} value={verified.length} label="Verified Accounts" />
      </div>

      <div className="mt-8 flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-sm font-semibold">List of Verified Accounts</h2>
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="rounded border border-gray-300 px-2 py-1 text-xs outline-none focus:border-navy"
          aria-label="Filter by department"
        >
          <option value="">Select Department</option>
          {DEPARTMENTS.map((d) => (
            <option key={d.code} value={d.code}>
              {d.code}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead className="border-b border-gray-300 text-gray-600">
            <tr>
              <th className="py-2 font-medium">Full name</th>
              <th className="py-2 font-medium">Department</th>
              <th className="py-2 font-medium">Email</th>
              <th className="py-2 font-medium">Role</th>
              <th className="py-2 font-medium">Date Approved</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((u) => (
              <tr key={u.id} className="hover:bg-canvas">
                <td className="py-2.5">{u.fullName}</td>
                <td className="py-2.5">{u.department}</td>
                <td className="py-2.5">{u.email}</td>
                <td className="py-2.5">{u.role}</td>
                <td className="py-2.5">{formatDate(u.approvedAt)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-500">
                  No verified accounts match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
