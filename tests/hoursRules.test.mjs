import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildHourRecord, computeHoursBetween, formatDuration, formatHourDate, formatTimeForDisplay, hoursProgress,
  matchesHourSearch, matchesPositionTab, minutesBetween, normaliseRequirements, requiredHoursFor, summariseHoursByUser,
} from '../src/lib/hoursRules.js'

const juan = { id: 'u1', fullName: 'Juan Dela Cruz', department: 'SET', role: 'Student' }
const entry = { userId: 'u1', project: 'EcoWays', volunteerRole: 'Technical Support', timeIn: '07:30', timeOut: '14:30', date: '2026-05-09' }

test('hours between times round to the nearest hour and never go negative', () => {
  assert.equal(computeHoursBetween('07:30', '14:30'), 7)
  assert.equal(computeHoursBetween('08:00', '09:40'), 2)
  assert.equal(computeHoursBetween('10:00', '09:00'), 0)
  assert.equal(computeHoursBetween('', '09:00'), 0)
  assert.equal(minutesBetween('08:00', ''), null)
  assert.equal(minutesBetween('08:00', '11:30'), 210)
})

test('times, durations and dates format like V2', () => {
  assert.equal(formatTimeForDisplay('07:30'), '7:30 AM')
  assert.equal(formatTimeForDisplay('12:05'), '12:05 PM')
  assert.equal(formatTimeForDisplay('00:00'), '12:00 AM')
  assert.equal(formatDuration(210), '3 hours 30 min')
  assert.equal(formatDuration(60), '1 hour')
  assert.equal(formatDuration(45), '45 min')
  assert.equal(formatHourDate('2026-05-09'), 'May 9, 2026')
})

test('encoding requires every field and a later time out', () => {
  assert.equal(buildHourRecord({ ...entry, project: '' }, juan).success, false)
  assert.equal(buildHourRecord({ ...entry, timeOut: '07:00' }, juan).error, 'Time out must be later than time in.')
  assert.equal(buildHourRecord(entry, null).error, 'Volunteer not found.')
  assert.equal(buildHourRecord(entry, juan, { academicYear: 'A.Y. 1999' }).success, false)
})

test('encoded records copy identity from the account', () => {
  const { success, data } = buildHourRecord(entry, juan, { id: 'h1' })
  assert.ok(success)
  assert.deepEqual(
    [data.fullName, data.department, data.position, data.hours, data.timeIn, data.date, data.academicYear],
    ['Juan Dela Cruz', 'SET', 'Student', 7, '7:30 AM', 'May 9, 2026', 'A.Y. 2025-2026'],
  )
})

test('summaries total per person and filter by tab and search', () => {
  const rows = summariseHoursByUser([
    { userId: 'u1', fullName: 'Juan', department: 'SET', position: 'Student', hours: 7 },
    { userId: 'u2', fullName: 'Maria', department: 'SBA', position: 'COMEX Representative', hours: 3 },
    { userId: 'u1', fullName: 'Juan', department: 'SET', position: 'Student', hours: 5 },
  ])
  assert.deepEqual(rows.map(r => [r.userId, r.totalHours]), [['u1', 12], ['u2', 3]])
  assert.ok(matchesPositionTab(rows[0], 'Students'))
  assert.ok(matchesPositionTab(rows[1], 'COMEX Representatives'))
  assert.ok(!matchesPositionTab(rows[0], 'Faculty'))
  assert.ok(matchesHourSearch(rows[1], 'sba'))
  assert.ok(!matchesHourSearch(rows[1], 'juan'))
  assert.ok(matchesHourSearch(rows[1], '  '))
})

test('required hours default to 60 and must be at least 1', () => {
  assert.equal(requiredHoursFor({}, 'SET'), 60)
  assert.equal(requiredHoursFor({ SET: 40 }, 'SET'), 40)
  assert.deepEqual(normaliseRequirements({ SET: '40.4' }).data, { SET: 40 })
  assert.equal(normaliseRequirements({ SET: '0' }).success, false)
  assert.equal(normaliseRequirements({ SET: 'abc' }).success, false)
})

test('progress reports remaining hours and caps at 100%', () => {
  assert.deepEqual(hoursProgress([{ hours: 30 }], 60), { completedHours: 30, requiredHours: 60, remainingHours: 30, percent: 50, met: false })
  const done = hoursProgress([{ hours: 50 }, { hours: 20 }], 60)
  assert.equal(done.remainingHours, 0)
  assert.equal(done.percent, 100)
  assert.ok(done.met)
})
