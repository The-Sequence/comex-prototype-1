/* Certificate pages — Frame 11.12 (Volunteer Certificates, COMEX Head) and
 * Frame 16.5 (My Certificates). Behaviour ported from comex-frontend-v2
 * (AdminCertificates.jsx, UserCertificates.jsx, components/certificates/*):
 * eligibility from hours, preview, send with or without an e-signature,
 * required hours per department, and download. Data: src/lib/certificates.js. */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { ChevronDown, CircleCheck, Clock, Download, Eye, ImagePlus, PenLine, Search, Send, Settings2, TriangleAlert } from 'lucide-react'
import logo from '../../assets/comex-logo.png'
import { Avatar, PageTitle, StatusPill } from '../../components/Showcase'
import { Modal, Toast } from '../../components/Applications'
import { OutlineButton, PrimaryButton, TextField } from '../../components/Form'
import { DEPARTMENTS } from '../../config/departments'
import { ACADEMIC_YEARS, CURRENT_ACADEMIC_YEAR, certificateStatusText, requiredHoursFor } from '../../lib/certificateRules'
import {
  clearStoredSignature,
  getCertificateRows,
  getMyCertificates,
  getStoredSignature,
  loadRequiredHours,
  saveRequiredHours,
  sendCertificate,
  setStoredSignature,
  useCertificateData,
} from '../../lib/certificates'

const DEFAULT_POSITION = { x: 0.5, y: 0.84 }
const controlClass = 'min-h-11 cursor-pointer rounded border border-gray-800 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-2 focus-visible:outline-navy'

function YearSelect({ value, onChange, className = '' }) {
  return (
    <select aria-label="Academic year" value={value} onChange={(e) => onChange(e.target.value)} className={`${controlClass} font-medium ${className}`}>
      {ACADEMIC_YEARS.map((year) => <option key={year}>{year}</option>)}
    </select>
  )
}

function useToast() {
  const [toast, setToast] = useState(null)
  const showToast = useCallback((message, tone = 'success') => setToast({ message, tone }), [])
  return [toast, showToast, () => setToast(null)]
}

/** The certificate itself. A placeholder layout until the office supplies its artwork. */
function CertificatePreview({ recipientName, totalHours, academicYear, department, period, activities = [], signature, position = DEFAULT_POSITION }) {
  return (
    <div id="certificate-print" className="relative aspect-[4/3] w-full overflow-hidden border border-gray-800 bg-white sm:aspect-[16/10]">
      <div aria-hidden="true" className="absolute inset-3 border-4 border-double border-navy/40" />
      <div className="relative flex h-full flex-col items-center justify-center px-6 py-5 text-center sm:px-12">
        <img src={logo} alt="" className="mb-2 h-8 w-auto object-contain sm:h-11" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-navy-dark sm:text-xs">NU Fairview · Community Extension Office</p>
        <h2 className="mt-2 text-xl font-bold tracking-wide text-navy-dark sm:text-3xl">CERTIFICATE</h2>
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 sm:text-sm">of Participation</p>
        <p className="mt-3 text-[10px] text-gray-500 sm:text-xs">is proudly presented to</p>
        <p className="mt-1 break-words px-4 text-lg font-bold text-navy sm:text-2xl">{recipientName}</p>
        <p className="mt-2.5 max-w-xl text-[10px] leading-relaxed text-gray-600 sm:text-xs">
          for rendering <span className="font-bold text-navy-dark">{totalHours} volunteer hours</span> of community service
          {department && <> for the {department}</>}{period && <> during {period}</>} in fulfilment of the Community
          Extension requirement for {academicYear}.
        </p>
        {activities.length > 0 && (
          <p className="mt-2 max-w-xl text-[9px] leading-snug text-gray-500 sm:text-[11px]">
            {activities.slice(0, 3).join(' · ')}{activities.length > 3 && ` · +${activities.length - 3} more`}
          </p>
        )}
        <div className="mt-auto pt-4">
          {!signature && <div className="mx-auto w-40 border-t border-gray-500 sm:w-56" />}
          <p className="mt-1 text-[9px] font-bold text-gray-800 sm:text-[11px]">MR. AAZIN CARL A. SUMALINOG</p>
          <p className="text-[8px] text-gray-500 sm:text-[10px]">Community Extension Office · COMEX Head</p>
        </div>
      </div>
      {signature && (
        <img src={signature} alt="Signed" draggable={false}
          className="pointer-events-none absolute w-24 -translate-x-1/2 -translate-y-1/2 select-none sm:w-32"
          style={{ left: `${position.x * 100}%`, top: `${position.y * 100}%` }} />
      )}
    </div>
  )
}

const PLACEHOLDER_NOTE = (
  <p className="mb-3 flex items-start gap-2 text-xs leading-relaxed text-gray-500">
    <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-amber-500" aria-hidden="true" />
    This preview is a placeholder layout, not the office's final certificate design.
  </p>
)

/** Upload, replace or remove the saved signature; with onSend, drag it into place and send. */
function SignatureEditor({ user, certificate, onCancel, onSend }) {
  const [signature, setSignature] = useState(() => getStoredSignature(user.id))
  const [error, setError] = useState('')
  const [position, setPosition] = useState(DEFAULT_POSITION)
  const frame = useRef(null)
  const drag = useRef(null)

  const handleFile = (file) => {
    if (!file.type.startsWith('image/')) return setError('Choose an image file.')
    const reader = new FileReader()
    reader.onload = () => {
      const result = setStoredSignature(user.id, reader.result, file.name)
      if (result.success) { setSignature(result.data); setError('') } else setError(result.error)
    }
    reader.readAsDataURL(file)
  }
  const fileInput = (
    <input type="file" accept="image/*" className="sr-only" onChange={(e) => {
      const file = e.target.files?.[0]
      e.target.value = ''
      if (file) handleFile(file)
    }} />
  )
  const move = (e) => {
    const rect = drag.current
    if (!rect) return
    const clamp = (n) => Math.min(Math.max(n, 0.05), 0.95)
    setPosition({ x: clamp((e.clientX - rect.left) / rect.width), y: clamp((e.clientY - rect.top) / rect.height) })
  }

  return (
    <div>
      <div ref={frame} className="relative touch-none bg-gray-100 p-4 sm:p-6">
        <CertificatePreview {...certificate} signature={signature?.dataUrl} position={position} />
        {signature && (
          <div role="button" tabIndex={-1} aria-label="Drag to move your signature"
            onPointerDown={(e) => { e.preventDefault(); drag.current = frame.current.getBoundingClientRect(); e.currentTarget.setPointerCapture?.(e.pointerId) }}
            onPointerMove={move} onPointerUp={() => { drag.current = null }} onPointerCancel={() => { drag.current = null }}
            className="absolute aspect-[2/1] w-24 -translate-x-1/2 -translate-y-1/2 cursor-move rounded hover:ring-2 hover:ring-navy/50 sm:w-32"
            style={{ left: `${position.x * 100}%`, top: `${position.y * 100}%` }} />
        )}
      </div>
      {!signature ? (
        <div className="mt-4">
          <label className="flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded border-2 border-dashed border-gray-400 px-3 py-2 text-sm text-gray-600 hover:border-navy hover:text-navy">
            <ImagePlus className="size-4" aria-hidden="true" /> Choose a signature image{fileInput}
          </label>
          <p className="mt-1 text-xs text-gray-500">Use an image with a transparent or white background. It is saved so future certificates reuse it.</p>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-gray-600">{onSend ? 'Drag the signature into place. It is saved for next time.' : `Saved: ${signature.name}`}</p>
          <div className="flex items-center gap-4">
            <label className="cursor-pointer text-xs font-semibold text-navy hover:underline">Change image{fileInput}</label>
            <button type="button" className="cursor-pointer text-xs font-semibold text-red-600 hover:underline" onClick={() => {
              const result = clearStoredSignature(user.id)
              if (result.success) setSignature(null); else setError(result.error)
            }}>Remove</button>
          </div>
        </div>
      )}
      {error && <p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}
      <div className="mt-5 flex justify-end gap-3">
        <OutlineButton type="button" onClick={onCancel}>{onSend ? 'Cancel' : 'Done'}</OutlineButton>
        {onSend && <PrimaryButton type="button" disabled={!signature} onClick={() => signature && onSend()}>Send with this signature</PrimaryButton>}
      </div>
    </div>
  )
}

function CertificatesPanel({ title, count, open, onToggle, children }) {
  return (
    <section className={`overflow-hidden rounded-2xl shadow-lg ${open ? 'border border-gray-400' : ''}`}>
      <h2 className="bg-sidebar text-lg font-bold text-white md:text-xl">
        <button type="button" aria-expanded={open} onClick={onToggle} className="flex w-full cursor-pointer items-center gap-4 px-6 py-5 text-left focus-visible:outline-2 focus-visible:outline-gold">
          <ChevronDown className={`size-5 shrink-0 fill-white ${open ? '' : '-rotate-90'}`} aria-hidden="true" />
          {title} <span className="font-normal text-white/80">({count})</span>
        </button>
      </h2>
      {open && <div className="bg-white">{children}</div>}
    </section>
  )
}

const certificateProps = (row, academicYear) => ({
  recipientName: row.fullName, totalHours: row.totalHours, academicYear, department: row.department,
})

/** Frame 11.12 — Volunteer Certificates. */
export function AdminCertificates() {
  const { user } = useOutletContext()
  const [academicYear, setAcademicYear] = useState(CURRENT_ACADEMIC_YEAR)
  const rows = useCertificateData(useCallback(() => getCertificateRows(academicYear), [academicYear]))
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('')
  const [status, setStatus] = useState('')
  const [openDepartments, setOpenDepartments] = useState(() => new Set(['SET']))
  // Send flow, one dialog at a time: preview → choice → unsigned confirmation or signature placement.
  const [step, setStep] = useState(null)
  const [requiredDraft, setRequiredDraft] = useState(null)
  const [requiredError, setRequiredError] = useState('')
  const [toast, showToast, hideToast] = useToast()
  const canSetRequiredHours = user.role === 'COMEX Head'
  const close = () => setStep(null)

  const counts = {
    done: rows.filter((r) => r.eligible).length,
    inProgress: rows.filter((r) => !r.eligible).length,
    sent: rows.filter((r) => r.dispatchStatus === 'Sent').length,
  }
  const term = search.trim().toLowerCase()
  const visible = rows.filter((r) => (!term || r.fullName.toLowerCase().includes(term))
    && (!department || r.department === department)
    && (!status || (status === 'Sent' ? r.dispatchStatus === 'Sent' : status === 'Done' ? r.eligible : !r.eligible)))

  const send = (row, signed) => {
    close()
    const result = sendCertificate(row.userId, academicYear, { signed, forced: !row.eligible })
    if (result.success) showToast(signed ? `Signed certificate sent to ${row.fullName}.` : `Certificate sent to ${row.fullName}.`)
    else showToast(result.error ?? 'Could not send the certificate.', 'error')
  }
  const saveRequired = () => {
    const result = saveRequiredHours(requiredDraft, academicYear, user)
    if (!result.success) return setRequiredError(result.error)
    setRequiredDraft(null)
    showToast('Required hours updated.')
  }
  const toggle = (code) => setOpenDepartments((current) => {
    const next = new Set(current)
    if (next.has(code)) next.delete(code); else next.add(code)
    return next
  })
  const row = step?.row

  return (
    <>
      <PageTitle action={<YearSelect value={academicYear} onChange={setAcademicYear} className="w-48" />}>Volunteer Certificates</PageTitle>
      <div className="mb-6 flex flex-wrap gap-3">
        <label className="flex min-w-56 flex-1 items-center gap-2 rounded border border-gray-800 bg-white px-3 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-navy/20">
          <Search className="size-4 shrink-0 text-gray-600" aria-hidden="true" />
          <input aria-label="Search volunteer name" placeholder="Search volunteer name" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full min-w-0 bg-transparent text-sm outline-none" />
        </label>
        <select aria-label="Department" value={department} onChange={(e) => setDepartment(e.target.value)} className={controlClass}>
          <option value="">All departments</option>
          {DEPARTMENTS.map((d) => <option key={d.code} value={d.code}>{d.code}</option>)}
        </select>
        <select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)} className={controlClass}>
          <option value="">All statuses</option><option>Done</option><option>In Progress</option><option>Sent</option>
        </select>
        <button type="button" onClick={() => setStep({ kind: 'signature' })} className={`${controlClass} inline-flex items-center gap-2 font-medium`}>
          <PenLine className="size-4" aria-hidden="true" /> Manage signature
        </button>
        {canSetRequiredHours && (
          <button type="button" onClick={() => { setRequiredError(''); setRequiredDraft(Object.fromEntries(DEPARTMENTS.map((d) => [d.code, String(requiredHoursFor(loadRequiredHours(academicYear), d.code))]))) }}
            className={`${controlClass} inline-flex items-center gap-2 font-medium`}>
            <Settings2 className="size-4" aria-hidden="true" /> Required hours
          </button>
        )}
      </div>
      <div className="-mt-3 mb-6 flex gap-4 text-sm">
        <span className="rounded-full border border-gray-800 px-3 py-1 text-green-800">{counts.done} Done</span>
        <span className="rounded-full border border-gray-800 px-3 py-1 text-amber-500">{counts.inProgress} In Progress</span>
        <span className="rounded-full border border-gray-800 px-3 py-1 text-navy">{counts.sent} Sent</span>
      </div>
      <div className="space-y-6">
        {DEPARTMENTS.filter((d) => !department || d.code === department).map((d) => {
          const list = visible.filter((r) => r.department === d.code)
          return (
            <CertificatesPanel key={d.code} title={`${d.name} (${d.code})`} count={list.length} open={openDepartments.has(d.code)} onToggle={() => toggle(d.code)}>
              {list.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-gray-600">
                  {rows.some((r) => r.department === d.code) ? 'No volunteers match your search.' : `Nobody from ${d.code} has encoded hours for ${academicYear} yet.`}
                </p>
              ) : (
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
                      {list.map((r) => (
                        <tr key={r.userId}>
                          <td className="px-6 py-4">
                            <span className="flex items-center gap-3 text-lg font-medium"><Avatar name={r.fullName} size="size-10" /> {r.fullName}</span>
                          </td>
                          <td className="text-center">
                            <span className={`rounded-md px-3 py-1 text-lg font-bold ${r.eligible ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-600'}`}>{r.totalHours} hrs</span>
                          </td>
                          <td className="text-center">
                            {r.eligible
                              ? <StatusPill tone="green"><CircleCheck className="size-4" /> Done</StatusPill>
                              : <StatusPill tone="orange"><Clock className="size-4" /> {r.hoursRemaining} hrs left</StatusPill>}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className="inline-flex flex-wrap items-center justify-center gap-2">
                              <button type="button" onClick={() => setStep({ kind: 'preview', row: r })} className={`${controlClass} inline-flex items-center gap-2 font-medium`}>
                                <Eye className="size-4" aria-hidden="true" /> Preview
                              </button>
                              {r.dispatchStatus === 'Sent' ? (
                                <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm text-gray-600">
                                  <CircleCheck className="size-4 text-green-600" aria-hidden="true" /> Sent {r.sentAt}{r.forced && ' · early'}{r.signed && ' · signed'}
                                </span>
                              ) : (
                                <button type="button" onClick={() => setStep({ kind: 'choice', row: r })}
                                  className={`inline-flex min-h-11 cursor-pointer items-center justify-center gap-1 rounded px-4 py-2 text-xs font-semibold shadow-md focus-visible:outline-2 focus-visible:outline-navy ${r.eligible ? 'bg-amber-500 text-black' : 'border border-amber-400 bg-white text-amber-700'}`}>
                                  <Send className="size-3.5" aria-hidden="true" /> {r.eligible ? 'Send' : 'Send early'}
                                </button>
                              )}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CertificatesPanel>
          )
        })}
      </div>

      {step?.kind === 'preview' && (
        <Modal title="Certificate Preview" subtitle={`${row.fullName} · ${academicYear}`} size="max-w-4xl" onClose={close} footer={<>
          <OutlineButton type="button" onClick={close}>Close</OutlineButton>
          {row.dispatchStatus !== 'Sent' && <PrimaryButton type="button" onClick={() => setStep({ kind: 'choice', row })}>Send certificate</PrimaryButton>}
        </>}>
          {PLACEHOLDER_NOTE}
          <div className="bg-gray-100 p-4 sm:p-6"><CertificatePreview {...certificateProps(row, academicYear)} /></div>
        </Modal>
      )}
      {step?.kind === 'choice' && (
        <Modal title="Send this e-certificate?" subtitle={`${row.fullName} · ${academicYear}`} size="max-w-md" onClose={close}>
          {!row.eligible && (
            <p className="mb-4 flex items-start gap-2 rounded border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              {row.fullName} has {row.totalHours} of {row.requiredHours} required hours. Sending now is optional and will be marked as sent early.
            </p>
          )}
          <div className="space-y-2.5">
            {[
              { kind: 'unsigned', icon: Send, title: 'Send without signature', text: 'Goes out now. The recipient visits the office to have it signed.' },
              { kind: 'sign', icon: PenLine, title: 'Send with signature', text: 'Place your e-signature on it first. It is official the moment it arrives.' },
            ].map(({ kind, icon: Icon, title, text }) => (
              <button key={kind} type="button" onClick={() => setStep({ kind, row })}
                className="flex w-full cursor-pointer items-start gap-3 rounded border border-gray-400 p-3.5 text-left hover:border-navy hover:bg-gray-50">
                <Icon className="mt-0.5 size-4 shrink-0 text-gray-600" aria-hidden="true" />
                <span><span className="block text-sm font-semibold">{title}</span><span className="block text-xs leading-relaxed text-gray-600">{text}</span></span>
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setStep({ kind: 'preview', row })} className="mt-4 min-h-11 cursor-pointer text-sm font-semibold text-navy hover:underline">Preview it first</button>
        </Modal>
      )}
      {step?.kind === 'unsigned' && (
        <Modal title="Send without a signature?" size="max-w-md" onClose={close} footer={<>
          <OutlineButton type="button" onClick={close}>Cancel</OutlineButton>
          <PrimaryButton type="button" onClick={() => send(row, false)}>Send certificate</PrimaryButton>
        </>}>
          <p className="text-sm leading-relaxed text-gray-700">
            The e-certificate for <span className="font-semibold">{row.fullName}</span> will be sent for <span className="font-semibold">{academicYear}</span> without a signature. It cannot be recalled once it goes out.
          </p>
          <p className="mt-2 rounded border border-gray-200 bg-gray-50 p-3 text-xs leading-relaxed text-gray-600">
            Tell {row.fullName} it isn't official yet. They'll need to bring it to the COMEX Office to have it signed.
          </p>
        </Modal>
      )}
      {step?.kind === 'sign' && (
        <Modal title="Place your signature" subtitle={`${row.fullName} · ${academicYear}`} size="max-w-4xl" onClose={close}>
          <SignatureEditor user={user} certificate={certificateProps(row, academicYear)} onCancel={close} onSend={() => send(row, true)} />
        </Modal>
      )}
      {step?.kind === 'signature' && (
        <Modal title="Manage signature" subtitle="Reused on every certificate you send with a signature." size="max-w-4xl" onClose={close}>
          <SignatureEditor user={user} certificate={{ recipientName: 'Volunteer Name', totalHours: 60, academicYear, department: 'SET' }} onCancel={close} />
        </Modal>
      )}
      {requiredDraft && (
        <Modal title="Required hours per department" subtitle={`Volunteer hours each department needs for a certificate in ${academicYear}.`} size="max-w-md"
          onClose={() => setRequiredDraft(null)} footer={<>
            <OutlineButton type="button" onClick={() => setRequiredDraft(null)}>Cancel</OutlineButton>
            <PrimaryButton type="button" onClick={saveRequired}>Save</PrimaryButton>
          </>}>
          <div className="space-y-3">
            {DEPARTMENTS.map((d) => (
              <TextField key={d.code} id={`required-${d.code}`} label={`${d.name} (${d.code})`} type="number" min={1}
                value={requiredDraft[d.code]} onChange={(e) => { setRequiredError(''); setRequiredDraft({ ...requiredDraft, [d.code]: e.target.value }) }} />
            ))}
          </div>
          {requiredError && <p role="alert" className="mt-3 text-sm text-red-600">{requiredError}</p>}
        </Modal>
      )}
      <Toast message={toast?.message} tone={toast?.tone} onDismiss={hideToast} />
    </>
  )
}

// Download prints only the certificate; the browser's print dialogue saves it as a PDF.
const PRINT_ONLY_CERTIFICATE = `@media print {
  body * { visibility: hidden !important; }
  #certificate-print, #certificate-print * { visibility: visible !important; }
  #certificate-print { position: fixed; inset: 0; margin: auto; width: 100%; }
  @page { size: landscape; margin: 0.5in; }
}`

/** Frame 16.5 — My Certificates. */
export function MyCertificates() {
  const { user } = useOutletContext()
  const [academicYear, setAcademicYear] = useState(CURRENT_ACADEMIC_YEAR)
  const certificates = useCertificateData(useCallback(() => getMyCertificates(user, academicYear), [user, academicYear]))
  const [preview, setPreview] = useState(null)
  const [toast, showToast, hideToast] = useToast()

  const download = useCallback(() => {
    showToast("Use your browser's print dialogue to save the certificate as a PDF.")
    window.print()
  }, [showToast])
  // The row's Download opens the certificate first so there is something to print.
  useEffect(() => { if (preview?.print) download() }, [preview, download])

  return (
    <>
      <PageTitle>My Certificates</PageTitle>
      <p className="-mt-4 mb-10 text-sm font-medium">View and Download your certificate of volunteer service.</p>
      <YearSelect value={academicYear} onChange={setAcademicYear} className="mb-5 w-48" />
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
            {certificates.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-gray-600">
                  <p className="font-semibold text-gray-800">No certificate for this academic year</p>
                  <p className="mt-1 text-sm">Once the COMEX Office encodes your volunteer hours, your certificate record appears here.</p>
                </td>
              </tr>
            ) : certificates.map((c) => (
              <tr key={c.id}>
                <td className="px-5 py-6"><span className="rounded bg-indigo-50 px-3 py-1.5 text-lg text-navy">{c.department}</span></td>
                <td className="text-lg leading-relaxed text-gray-700">
                  {c.activities.map((activity, i) => <span key={activity} className="block">{i > 0 && '· '}{activity}</span>)}
                </td>
                <td className="text-lg text-gray-700">{c.period}</td>
                <td>
                  <span className={`whitespace-nowrap rounded-full px-4 py-2 text-2xl font-medium ${c.eligible ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-600'}`}>{c.totalHours} hrs</span>
                  <p className={`mt-3 text-sm ${!c.eligible || !c.signed ? 'text-amber-600' : 'text-green-700'}`}>{certificateStatusText(c)}</p>
                </td>
                <td className="py-4">
                  <div className="flex flex-col items-center gap-3">
                    {c.eligible ? (<>
                      <button type="button" onClick={() => setPreview(c)} className={`${controlClass} inline-flex items-center gap-2 bg-gray-100 px-5 text-lg`}>
                        <Eye className="size-4" aria-hidden="true" /> Preview
                      </button>
                      <button type="button" onClick={() => setPreview({ ...c, print: true })} className={`${controlClass} inline-flex items-center gap-2 !bg-indigo-700 px-5 text-lg font-medium text-white`}>
                        <Download className="size-5" aria-hidden="true" /> Download
                      </button>
                    </>) : (
                      <span className="text-sm italic text-gray-500">Not yet ready</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {preview && (
        <Modal title="Certificate of Participation" subtitle={`${preview.recipientName} · ${academicYear}`} size="max-w-4xl" onClose={() => setPreview(null)} footer={<>
          <OutlineButton type="button" onClick={() => setPreview(null)}>Close</OutlineButton>
          <PrimaryButton type="button" onClick={download}><Download className="mr-1.5 inline size-4" aria-hidden="true" />Download</PrimaryButton>
        </>}>
          <style>{PRINT_ONLY_CERTIFICATE}</style>
          <div className="bg-gray-100 p-4 sm:p-6">
            <CertificatePreview recipientName={preview.recipientName} totalHours={preview.totalHours} academicYear={academicYear}
              activities={preview.activities} period={preview.period} department={preview.department} />
          </div>
        </Modal>
      )}
      <Toast message={toast?.message} tone={toast?.tone} onDismiss={hideToast} />
    </>
  )
}
