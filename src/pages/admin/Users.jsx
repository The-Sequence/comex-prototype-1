import { useMemo, useState } from 'react'
import { Pencil } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import ManageAccountDialog from '../../components/ManageAccountDialog'
import { canManageAccounts } from '../../lib/accountRules'
import ListState from '../../components/ListState'
import { Clock, UserRound, UserRoundCheck } from 'lucide-react'
import { ADMIN_ROLES } from '../../lib/db'
import { ALL_UNITS, DEPARTMENTS, OFFICES } from '../../config/departments'
import { formatDate, isAwaitingApproval, useUsers } from '../../lib/useUsers'
import { useUrlParam } from '../../lib/useUrlParam'
import { DisplaySearch } from '../../components/DashboardControls'

const DEPARTMENT_CODES = ALL_UNITS.map((d) => d.code)

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
  const { user: actor } = useAuth()
  const { rows: users, status, error, reload } = useUsers()
  const [managing, setManaging] = useState(null)
  const [toast, setToast] = useState('')
  const canManage = canManageAccounts(actor)
  // In the URL (?department=SET) so a reload or Back keeps the filter.
  const [department, setDepartment] = useUrlParam('department', '', DEPARTMENT_CODES)

  const { members, verified, pending } = useMemo(() => {
    const members = users.filter((u) => !ADMIN_ROLES.includes(u.role))
    return {
      members,
      verified: members
        .filter((u) => u.status === 'approved' || u.status === 'inactive')
        .sort((a, b) => (b.decidedAt ?? '').localeCompare(a.decidedAt ?? '')),
      pending: members.filter(isAwaitingApproval),
    }
  }, [users])

  const rows = department ? verified.filter((u) => u.department === department) : verified

  return (
    <div>
      <h1 className="text-lg font-bold">Admin Dashboard</h1>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={UserRound} value={members.length} label="Total Accounts" />
        <StatCard icon={Clock} value={pending.length} label="Pending Accounts" />
        <StatCard icon={UserRoundCheck} value={verified.filter((u) => u.status === 'approved').length} label="Verified Accounts" />
      </div>

      <div className="mt-8 flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-sm font-semibold">List of Verified Accounts</h2>
        <DisplaySearch placeholder="Search name or email" className="w-full sm:w-64" />
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="rounded border border-gray-300 px-2 py-1 text-xs outline-none focus:border-navy"
          aria-label="Filter by department"
        >
          <option value="">Select Department</option>
          <optgroup label="Departments">
            {DEPARTMENTS.map((d) => (
              <option key={d.code} value={d.code}>
                {d.code}
              </option>
            ))}
          </optgroup>
          <optgroup label="Offices">
            {OFFICES.map((d) => (
              <option key={d.code} value={d.code}>
                {d.name}
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      <ListState status={status} error={error} onRetry={reload} />
      {status === 'ready' && (
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead className="border-b border-gray-300 text-gray-600">
            <tr>
              <th className="py-2 font-medium">Full name</th>
              <th className="py-2 font-medium">Department/Office</th>
              <th className="py-2 font-medium">Email</th>
              <th className="py-2 font-medium">Role</th>
              <th className="py-2 font-medium">Status</th>
              <th className="py-2 font-medium">Date Approved</th>
              {canManage && <th className="py-2 font-medium"><span className="sr-only">Manage</span></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((u) => (
              <tr key={u.id} className="hover:bg-canvas">
                <td className="py-2.5">{u.fullName}</td>
                <td className="py-2.5">{u.department}</td>
                <td className="py-2.5">{u.email}</td>
                <td className="py-2.5">{u.role}</td>
                <td className="py-2.5">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${u.status === 'inactive' ? 'bg-gray-200 text-gray-700' : 'bg-green-50 text-green-700'}`}>
                    {u.status === 'inactive' ? 'Inactive' : 'Active'}
                  </span>
                </td>
                <td className="py-2.5">{formatDate(u.decidedAt)}</td>
                {canManage && (
                  <td className="py-2.5 text-right">
                    <button onClick={() => setManaging(u)} className="rounded p-1 text-navy hover:bg-canvas" aria-label={`Manage ${u.fullName}`} title="Manage account">
                      <Pencil className="size-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={canManage ? 7 : 6} className="py-8 text-center text-gray-500">
                  No verified accounts match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      )}
      {toast && (
        <p className="mt-3 rounded border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-800" role="status">
          {toast}
        </p>
      )}
      {managing && (
        <ManageAccountDialog
          actor={actor}
          user={managing}
          onSaved={(message) => {
            reload()
            if (message) {
              setToast(message)
              setManaging(null)
            }
          }}
          onClose={() => setManaging(null)}
        />
      )}
    </div>
  )
}
