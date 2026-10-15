/* Volunteer hours — Figma Frame 11 (admin records) and Frame 16 (my hours).
 * Behaviour ported from comex-frontend-v2 (AdminVolunteerHours.jsx and
 * UserVolunteerHours.jsx); data stays in this browser, see src/lib/volunteerHours.js. */
import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { ChevronDown, Filter, PenLine, Search } from 'lucide-react'
import { ECOWAYS, PageTitle, YellowButton } from '../../components/Showcase'
import { Modal, Toast } from '../../components/Applications'
import { OutlineButton, PrimaryButton, TextField } from '../../components/Form'
import { DEPARTMENTS, departmentLabel, unitName } from '../../config/departments'
import { VOLUNTEER_ROLES } from '../../lib/applicationErrors'
import { useApplications } from '../../lib/applications'
import { useUsers } from '../../lib/useUsers'
import {
  ACADEMIC_YEARS, CURRENT_ACADEMIC_YEAR, CURRENT_TERM_LABEL, POSITION_TABS, formatDuration,
  matchesHourSearch, matchesPositionTab, minutesBetween, requiredHoursFor, summariseHoursByUser,
} from '../../lib/hoursRules'
import { encodeVolunteerHours, saveRequiredHours, useHourRecords, useMyHours, useRequiredHours } from '../../lib/volunteerHours'

const FIELD = 'min-w-0 rounded border border-gray-800 bg-white px-3 py-2.5 text-sm shadow-sm focus-visible:outline-2 focus-visible:outline-navy'
const ICON_BUTTON = 'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded border border-gray-800 px-3 py-2 text-sm font-medium shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy'

/** Same look as DisplaySearch, but it filters. */
function SearchBox({ value, onChange, placeholder, className = '' }) {
  return (
    <div className={`flex min-w-0 items-center gap-2 rounded border border-gray-800 bg-white px-3 py-2.5 shadow-sm ${className}`}>
      <Search className="size-4 shrink-0 text-gray-600" aria-hidden="true" />
      <input type="search" aria-label={placeholder} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)}
        className="min-w-0 w-full bg-transparent text-sm outline-none focus-visible:ring-2 focus-visible:ring-navy/20" />
    </div>
  )
}

/** Same look as DisplayFilter, backed by a native select. */
function FilterSelect({ label, value, onChange, options }) {
  return (
    <label className="relative inline-flex">
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className={`${ICON_BUTTON} appearance-none bg-white pr-9`}>
        {options.map((o) => typeof o === 'string' ? <option key={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" aria-hidden="true" />
    </label>
  )
}

/** Navy department header that opens and closes (DepartmentPanel look). */
function DepartmentAccordion({ title, open, onToggle, children }) {
  return (
    <section className={`overflow-hidden rounded-2xl shadow-lg ${open ? 'border border-gray-400' : ''}`}>
      <h2 className="bg-sidebar text-lg font-bold text-white md:text-xl">
        <button type="button" aria-expanded={open} onClick={onToggle}
          className="flex w-full cursor-pointer items-center gap-4 px-6 py-5 text-left focus-visible:outline-2 focus-visible:outline-gold">
          <ChevronDown className={`size-5 shrink-0 fill-white ${open ? '' : '-rotate-90'}`} aria-hidden="true" />
          {title}
        </button>
      </h2>
      {open && <div className="bg-white">{children}</div>}
    </section>
  )
}

/** Tab strip (Tabs look) that switches. */
function PositionTabs({ items, active, onChange, label }) {
  return (
    <div role="tablist" aria-label={label} className="flex flex-wrap gap-x-8 gap-y-2 border-b border-gray-700 px-6 py-3 text-sm font-medium">
      {items.map(({ tab, count }) => (
        <button key={tab} type="button" role="tab" aria-selected={tab === active} onClick={() => onChange(tab)}
          className={`cursor-pointer focus-visible:outline-2 focus-visible:outline-navy ${tab === active ? 'underline underline-offset-4' : ''}`}>
          {tab} ({count})
        </button>
      ))}
    </div>
  )
}

/** Volunteers the office may encode for: approved accounts, plus anyone accepted to an opportunity. */
function useVolunteerChoices() {
  const users = useUsers()
  const accepted = useApplications(ECOWAYS.id).filter((a) => a.status === 'Accepted')
  return useMemo(() => {
    const byId = new Map()
    users.rows.filter((u) => u.status === 'approved').forEach((u) => byId.set(u.id, u))
    accepted.forEach((a) => byId.set(a.userId, { ...byId.get(a.userId), id: a.userId, fullName: a.fullName,
      department: a.department, role: byId.get(a.userId)?.role ?? a.position, application: a }))
    return [...byId.values()].sort((a, b) => a.fullName.localeCompare(b.fullName))
  }, [users.rows, accepted])
}

const EMPTY_ENTRY = { userId: '', project: '', volunteerRole: '', timeIn: '', timeOut: '', date: '' }

function EncodeHoursForm({ academicYear, records, onToast }) {
  const volunteers = useVolunteerChoices()
  const [entry, setEntry] = useState(EMPTY_ENTRY)
  const [error, setError] = useState('')
  const set = (field) => (e) => { setEntry((v) => ({ ...v, [field]: e.target.value })); setError('') }
  const projects = [...new Set([ECOWAYS.title, ...records.map((r) => r.project)])].sort()
  const minutes = minutesBetween(entry.timeIn, entry.timeOut)

  const pickVolunteer = (e) => {
    const picked = volunteers.find((v) => v.id === e.target.value)
    // An accepted application already says which post and role they serve in.
    setEntry((v) => ({ ...v, userId: e.target.value,
      project: picked?.application ? ECOWAYS.title : v.project,
      volunteerRole: picked?.application?.volunteerRole ?? v.volunteerRole }))
    setError('')
  }

  const save = (e) => {
    e.preventDefault()
    const result = encodeVolunteerHours(entry, volunteers.find((v) => v.id === entry.userId), academicYear)
    if (!result.success) return setError(result.error)
    setEntry(EMPTY_ENTRY)
    onToast(`${result.data.hours} hours added for ${result.data.fullName}.`)
  }

  return (
    <form onSubmit={save} noValidate className="rounded border border-gray-800 p-5 shadow-md">
      <h2 className="text-2xl font-bold">Encode Volunteer Hours</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <select aria-label="Volunteer" value={entry.userId} onChange={pickVolunteer} className={FIELD}>
          <option value="">Volunteer</option>
          {volunteers.map((v) => <option key={v.id} value={v.id}>{v.fullName}{v.application ? ' (accepted)' : ''}</option>)}
        </select>
        <select aria-label="Project" value={entry.project} onChange={set('project')} className={FIELD}>
          <option value="">Project</option>
          {projects.map((p) => <option key={p}>{p}</option>)}
        </select>
        <select aria-label="Role" value={entry.volunteerRole} onChange={set('volunteerRole')} className={FIELD}>
          <option value="">Role</option>
          {VOLUNTEER_ROLES.map((r) => <option key={r}>{r}</option>)}
        </select>
        <input type="time" aria-label="Time in" title="Time in" value={entry.timeIn} onChange={set('timeIn')} className={FIELD} />
        <input type="time" aria-label="Time out" title="Time out" value={entry.timeOut} onChange={set('timeOut')} className={FIELD} />
        <input type="date" aria-label="Volunteer date" value={entry.date} onChange={set('date')} className={FIELD} />
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <p className={`text-sm ${minutes !== null && minutes <= 0 ? 'text-red-600' : 'text-gray-600'}`} aria-live="polite">
          {error || (minutes === null ? `Hours are added to ${academicYear}.`
            : minutes <= 0 ? 'Time out must be later than time in.' : `Duration: ${formatDuration(minutes)} (recorded as ${Math.round(minutes / 60)} hours)`)}
        </p>
        <YellowButton className="text-sm" onClick={save}>Save record</YellowButton>
      </div>
      {error && <p role="alert" className="sr-only">{error}</p>}
    </form>
  )
}

function RequiredHoursDialog({ academicYear, user, onClose, onSaved }) {
  const current = useRequiredHours(academicYear)
  const [values, setValues] = useState(() => Object.fromEntries(DEPARTMENTS.map((d) => [d.code, String(requiredHoursFor(current, d.code))])))
  const [error, setError] = useState('')
  const canEdit = user.role === 'COMEX Head'
  const save = () => {
    const result = saveRequiredHours(values, user, academicYear)
    if (!result.success) return setError(result.error)
    onSaved()
  }
  return (
    <Modal title="Set required hours" subtitle={academicYear} onClose={onClose}
      footer={<>
        <OutlineButton type="button" onClick={onClose}>{canEdit ? 'Cancel' : 'Close'}</OutlineButton>
        {canEdit && <PrimaryButton type="button" onClick={save}>Save</PrimaryButton>}
      </>}>
      <div className="grid gap-4 sm:grid-cols-2">
        {DEPARTMENTS.map((d) => (
          <TextField key={d.code} id={`required-${d.code}`} label={departmentLabel(d)} type="number" min="1" inputMode="numeric"
            value={values[d.code]} disabled={!canEdit} onChange={(e) => { setValues((v) => ({ ...v, [d.code]: e.target.value })); setError('') }} />
        ))}
      </div>
      <p className={`mt-4 text-sm ${error ? 'text-red-600' : 'text-gray-500'}`} role={error ? 'alert' : undefined}>
        {error || (canEdit ? 'Each department needs at least 1 hour.' : 'Only the COMEX Head can change required hours.')}
      </p>
    </Modal>
  )
}

function RecordsTable({ records, size = 'text-xs' }) {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full min-w-[640px] text-left ${size}`}>
        <thead className="border-b border-gray-200 text-gray-700">
          <tr>
            <th className="py-2 pr-4 font-medium">Project</th><th className="py-2 pr-4 font-medium">Role</th>
            <th className="py-2 pr-4 font-medium">Date</th><th className="py-2 pr-4 font-medium">Time In</th>
            <th className="py-2 pr-4 font-medium">Time Out</th><th className="py-2 font-medium">Hours</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {records.map((r) => (
            <tr key={r.id}>
              <td className="py-2.5 pr-4">{r.project}</td><td className="py-2.5 pr-4">{r.volunteerRole}</td>
              <td className="py-2.5 pr-4 text-gray-500">{r.date}</td><td className="py-2.5 pr-4">{r.timeIn}</td>
              <td className="py-2.5 pr-4">{r.timeOut}</td><td className="py-2.5 text-indigo-700">{r.hours} hrs</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Frame 11 — Volunteer Hours Admin Records. */
export function AdminVolunteerHours() {
  const { user } = useOutletContext()
  const [academicYear, setAcademicYear] = useState(CURRENT_ACADEMIC_YEAR)
  const [department, setDepartment] = useState('')
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(true)
  const [openPanels, setOpenPanels] = useState({ SET: true })
  const [tabs, setTabs] = useState({})
  const [recordsFor, setRecordsFor] = useState(null)
  const [settingHours, setSettingHours] = useState(false)
  const [toast, setToast] = useState('')
  const records = useHourRecords(academicYear)
  const required = useRequiredHours(academicYear)
  const summaries = summariseHoursByUser(records).filter((s) => matchesHourSearch(s, search))
  const searching = search.trim() !== ''

  return (
    <>
      <PageTitle>Volunteer Hours Admin Records</PageTitle>
      <EncodeHoursForm academicYear={academicYear} records={records} onToast={setToast} />

      <div className="my-8 flex items-center gap-4">
        <SearchBox value={search} onChange={setSearch} placeholder="Search volunteer or department" className="flex-1" />
        <button type="button" aria-label="Filter volunteer hours" aria-expanded={showFilters} onClick={() => setShowFilters((s) => !s)}
          className={`${ICON_BUTTON} ${showFilters ? 'bg-gray-100' : ''}`}>
          <Filter className="size-4 shrink-0" aria-hidden="true" />
        </button>
      </div>
      {showFilters && (
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <FilterSelect label="Academic year" value={academicYear} onChange={setAcademicYear} options={ACADEMIC_YEARS} />
          <FilterSelect label="Department" value={department} onChange={setDepartment}
            options={[{ value: '', label: 'All departments' }, ...DEPARTMENTS.map((d) => ({ value: d.code, label: d.code }))]} />
          <button type="button" onClick={() => setSettingHours(true)} className={ICON_BUTTON}>
            <PenLine className="size-4 shrink-0" aria-hidden="true" />Set required hours
          </button>
        </div>
      )}

      <div className="space-y-6">
        {DEPARTMENTS.filter((d) => !department || d.code === department).map((d) => {
          const inDepartment = summaries.filter((s) => s.department === d.code)
          const activeTab = tabs[d.code] ?? POSITION_TABS[0]
          const visible = inDepartment.filter((s) => matchesPositionTab(s, activeTab))
          const requiredHours = requiredHoursFor(required, d.code)
          // While searching, panels with a match open on their own.
          const open = searching ? inDepartment.length > 0 : Boolean(openPanels[d.code])
          return (
            <DepartmentAccordion key={d.code} title={`${d.name} (${d.code})`} open={open}
              onToggle={() => setOpenPanels((p) => ({ ...p, [d.code]: !open }))}>
              <PositionTabs label={`${d.code} position filter`} active={activeTab} onChange={(tab) => setTabs((t) => ({ ...t, [d.code]: tab }))}
                items={POSITION_TABS.map((tab) => ({ tab, count: inDepartment.filter((s) => matchesPositionTab(s, tab)).length }))} />
              {visible.length === 0
                ? <p className="px-6 py-6 text-sm text-gray-600">No {activeTab.toLowerCase()} from {d.code} have hours for {academicYear} yet.</p>
                : (
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
                        {visible.map((s) => (
                          <tr key={s.userId}>
                            <td className="px-6 py-3.5 font-semibold">{s.fullName}</td>
                            <td className="py-3.5 text-gray-700">{unitName(s.department)}</td>
                            <td className="py-3.5 text-navy-dark">
                              {s.totalHours} / {requiredHours} hrs
                              {s.totalHours >= requiredHours && <span className="ml-2 font-semibold text-green-700">Met</span>}
                            </td>
                            <td className="py-3.5">
                              <button type="button" onClick={() => setRecordsFor(s)}
                                className="min-h-11 cursor-pointer px-3 font-semibold text-navy-dark underline focus-visible:outline-2 focus-visible:outline-navy">View records</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
            </DepartmentAccordion>
          )
        })}
      </div>

      {recordsFor && (
        <Modal size="max-w-3xl" title="Full Volunteer Records" onClose={() => setRecordsFor(null)}
          subtitle={`${recordsFor.fullName} · ${recordsFor.position} · ${recordsFor.totalHours} total hours`}>
          <RecordsTable records={records.filter((r) => r.userId === recordsFor.userId)} />
        </Modal>
      )}
      {settingHours && (
        <RequiredHoursDialog academicYear={academicYear} user={user} onClose={() => setSettingHours(false)}
          onSaved={() => { setSettingHours(false); setToast(`Required hours saved for ${academicYear}.`) }} />
      )}
      <Toast message={toast} onDismiss={() => setToast('')} />
    </>
  )
}

/** Frame 16 — Volunteer Hours records. */
export function MyVolunteerHours() {
  const { user } = useOutletContext()
  const [academicYear, setAcademicYear] = useState(CURRENT_ACADEMIC_YEAR)
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(true)
  const summary = useMyHours(user, academicYear)
  const term = search.trim().toLowerCase()
  const visible = summary.records.filter((r) => !term || `${r.project} ${r.volunteerRole} ${r.date}`.toLowerCase().includes(term))

  return (
    <>
      <PageTitle>Volunteer Hours</PageTitle>
      <div className="mb-6 flex flex-wrap gap-3">
        <FilterSelect label="Academic year" value={academicYear} onChange={setAcademicYear} options={ACADEMIC_YEARS} />
      </div>
      <p className="-mt-3 mb-5 text-3xl font-medium">Hello! {user.fullName}</p>
      <div className="rounded-2xl border border-gray-400 px-5 py-4">
        <p className="text-xl font-medium text-gray-800">Volunteer service ({CURRENT_TERM_LABEL} - {academicYear})</p>
        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          <div>
            <p className="text-sm font-medium text-gray-600">Total hours earned</p>
            <p className="mt-1 text-4xl font-bold text-indigo-700">{summary.completedHours} <span className="text-xl font-medium">hours</span></p>
          </div>
          <div className="sm:border-l sm:border-gray-200 sm:pl-5">
            <p className="text-sm font-medium text-gray-600">Minimum requirement</p>
            <p className="mt-2 text-2xl font-semibold">{summary.requiredHours} hours</p>
          </div>
          <div className="sm:border-l sm:border-gray-200 sm:pl-5">
            <p className="text-sm font-medium text-gray-600">To meet the minimum</p>
            <p className="mt-2 text-2xl font-semibold">{summary.met ? 'Minimum met' : `${summary.remainingHours} more hours`}</p>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-200" role="progressbar" aria-label="Progress to the minimum"
          aria-valuenow={summary.percent} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-indigo-700" style={{ width: `${summary.percent}%` }} />
        </div>
        <p className="mt-5 border-t border-gray-200 pt-3 text-sm text-gray-600">Every hour counts. Your earned hours keep adding up after you meet the minimum.</p>
      </div>

      <div className="mt-12 border border-gray-400 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold">My Records</h2>
          <div className="flex items-center gap-3">
            {showSearch && <SearchBox value={search} onChange={setSearch} placeholder="Search hour records" className="w-44 sm:w-72" />}
            <button type="button" aria-label="Filter volunteer hour records" aria-expanded={showSearch}
              onClick={() => { setShowSearch((s) => !s); setSearch('') }} className={`${ICON_BUTTON} ${showSearch ? 'bg-gray-100' : ''}`}>
              <Filter className="size-4 shrink-0" aria-hidden="true" />
            </button>
          </div>
        </div>
        {visible.length === 0
          ? (
            <div className="py-10 text-center">
              <p className="text-lg font-semibold">{term ? 'No matching records' : 'No volunteer hours yet'}</p>
              <p className="mt-1 text-sm text-gray-600">{term ? 'Try a different search term.' : 'Hours appear here once the COMEX Office encodes them.'}</p>
            </div>
          )
          : (
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
                  {visible.map((row) => (
                    <tr key={row.id}>
                      <td className="max-w-60 whitespace-normal px-6 py-5 leading-snug">{row.project}</td>
                      <td>{row.volunteerRole}</td>
                      <td className="text-gray-500">{row.date}</td>
                      <td>{row.timeIn}</td>
                      <td>{row.timeOut}</td>
                      <td className="text-indigo-700">{row.hours} hrs</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        <div className="mt-6 flex justify-between border-t-2 border-gray-200 pt-3">
          <span className="text-lg text-gray-500">Total completed hours</span>
          <span className="text-xl font-bold text-indigo-700">{summary.completedHours} hours earned</span>
        </div>
      </div>
    </>
  )
}
