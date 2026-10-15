import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import {
  CURRENT_ACADEMIC_YEAR,
  buildCertificateRows,
  buildMyCertificate,
  certificateStatusText,
  derivePeriodLabel,
  normaliseRequiredHours,
} from '../src/lib/certificateRules.js'

const store = new Map()
globalThis.window = {
  localStorage: {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
  },
  dispatchEvent: () => {},
}
const certificates = await import('../src/lib/certificates.js')
const { setHourRecordSource } = await import('../src/lib/certificateHours.js')

const year = CURRENT_ACADEMIC_YEAR
const rec = (userId, hours, extra = {}) => ({
  userId, fullName: userId, department: 'SET', project: 'EcoWays', hours, date: '2026-02-01', academicYear: year, ...extra,
})

beforeEach(() => {
  store.clear()
  setHourRecordSource(() => [rec('ana', 40), rec('ana', 25, { project: 'Seminar', date: '2026-05-10' }), rec('ben', 30)])
})

test('eligibility is computed from summed hours against the department requirement', () => {
  const rows = buildCertificateRows([rec('a', 30), rec('a', 30), rec('b', 59)], new Map(), {}, year)
  assert.deepEqual(rows.map((r) => [r.userId, r.totalHours, r.eligible, r.hoursRemaining]), [['a', 60, true, 0], ['b', 59, false, 1]])
  const custom = buildCertificateRows([rec('b', 59)], new Map(), { SET: 50 }, year)
  assert.equal(custom[0].eligible, true)
})

test('period label spans the earliest to latest service date', () => {
  assert.equal(derivePeriodLabel([{ date: '2026-05-09' }, { date: '2026-01-24' }]), 'January – May 2026')
  assert.equal(derivePeriodLabel([{ date: '2026-03-01' }]), 'March 2026')
  assert.equal(derivePeriodLabel([]), '')
})

test('my certificate lists distinct activities and says what is pending', () => {
  const [mine] = buildMyCertificate([rec('a', 40), rec('a', 30, { project: 'Seminar' }), rec('a', 1)], undefined, {}, year)
  assert.deepEqual(mine.activities, ['EcoWays', 'Seminar'])
  assert.equal(certificateStatusText(mine), 'Awaiting release by the COMEX Office')
  assert.equal(certificateStatusText({ ...mine, dispatchStatus: 'Sent' }), 'Pending COMEX Head signature')
  assert.equal(certificateStatusText({ ...mine, dispatchStatus: 'Sent', signed: true }), 'Signed and released')
  assert.equal(certificateStatusText({ eligible: false, hoursRemaining: 4 }), '4 more needed')
  assert.deepEqual(buildMyCertificate([], undefined, {}, year), [])
})

test('required hours must be whole positive numbers', () => {
  assert.deepEqual(normaliseRequiredHours({ SET: '40.4', SBA: 60 }), { success: true, data: { SET: 40, SBA: 60 } })
  assert.equal(normaliseRequiredHours({ SET: '0' }).success, false)
  assert.equal(normaliseRequiredHours({ SET: '' }).success, false)
})

test('sending records dispatch, marks early sends and re-sending replaces the record', () => {
  assert.equal(certificates.sendCertificate('ben', year, { forced: true }).success, true)
  let ben = certificates.getCertificateRows(year).find((r) => r.userId === 'ben')
  assert.equal(ben.dispatchStatus, 'Sent')
  assert.equal(ben.forced, true)
  certificates.sendCertificate('ben', year, { signed: true })
  ben = certificates.getCertificateRows(year).find((r) => r.userId === 'ben')
  assert.deepEqual([ben.signed, ben.forced], [true, false])
  assert.equal(JSON.parse(store.get('comex-certificates')).length, 1)
  assert.equal(certificates.sendCertificate('', year).success, false)
})

test('only the COMEX Head can change required hours, and the change feeds eligibility', () => {
  assert.equal(certificates.saveRequiredHours({ SET: 30 }, year, { role: 'COMEX Representative' }).success, false)
  assert.equal(certificates.saveRequiredHours({ SET: 30 }, year, { role: 'COMEX Head' }).success, true)
  assert.equal(certificates.getCertificateRows(year).find((r) => r.userId === 'ben').eligible, true)
  assert.deepEqual(certificates.loadRequiredHours('A.Y. 2024-2025'), {})
})

test('a volunteer sees only their own certificate', () => {
  const [mine] = certificates.getMyCertificates({ id: 'ana' }, year)
  assert.equal(mine.totalHours, 65)
  assert.equal(mine.eligible, true)
  assert.deepEqual(certificates.getMyCertificates({ id: 'nobody' }, year), [])
  assert.deepEqual(certificates.getMyCertificates(null, year), [])
})

test('signature is stored per office member and must be an image', () => {
  assert.equal(certificates.setStoredSignature('head', 'hello', 'x.txt').success, false)
  assert.equal(certificates.setStoredSignature('head', 'data:image/png;base64,AA', 'sig.png').success, true)
  assert.equal(certificates.getStoredSignature('head').name, 'sig.png')
  assert.equal(certificates.getStoredSignature('other'), null)
  certificates.clearStoredSignature('head')
  assert.equal(certificates.getStoredSignature('head'), null)
})
