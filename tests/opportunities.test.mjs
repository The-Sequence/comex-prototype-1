import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import {
  SEED_OPPORTUNITY,
  canRoleSeeAudience,
  matchesSearch,
  opportunityErrors,
  postedDate,
  visibleOpportunities,
} from '../src/lib/opportunityRules.js'

const store = new Map()
globalThis.window = {
  localStorage: { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) },
  dispatchEvent: () => true,
  addEventListener: () => {},
  removeEventListener: () => {},
}
const { createOpportunity, deleteOpportunity, updateOpportunity } = await import('../src/lib/opportunities.js')
const saved = () => JSON.parse(store.get('comex-opportunities'))
const head = { id: 'u1', fullName: 'Ana Head', role: 'COMEX Head' }

beforeEach(() => store.clear())

test('composer requires a title and a known audience', () => {
  assert.equal(opportunityErrors({ title: '  ' }).title, 'Project Title is required.')
  assert.ok(opportunityErrors({ title: 'x'.repeat(121) }).title)
  assert.ok(opportunityErrors({ title: 'Ok', audience: 'Aliens' }).audience)
  assert.deepEqual(opportunityErrors({ title: 'Ok', caption: '', audience: 'Everyone' }), {})
})

test('audience rules match V2', () => {
  assert.equal(canRoleSeeAudience('Student', 'Everyone'), true)
  assert.equal(canRoleSeeAudience('Student', 'For Faculty only'), false)
  assert.equal(canRoleSeeAudience('Faculty', 'For Faculty only'), true)
  assert.equal(canRoleSeeAudience('COMEX Representative', 'For COMEX Representatives only'), true)
  assert.equal(canRoleSeeAudience('ASP', 'Something new'), true)
})

test('search matches title or caption, ignoring case', () => {
  assert.equal(matchesSearch(SEED_OPPORTUNITY, 'ecoways'), true)
  assert.equal(matchesSearch(SEED_OPPORTUNITY, 'GREENER community'), true)
  assert.equal(matchesSearch(SEED_OPPORTUNITY, 'tutoring'), false)
  assert.equal(matchesSearch(SEED_OPPORTUNITY, '  '), true)
})

test('feed hides deleted and out-of-audience posts, newest first', () => {
  const list = [
    SEED_OPPORTUNITY,
    { ...SEED_OPPORTUNITY, id: 'b', postedAt: '2026-06-01T00:00:00.000Z', audience: 'For Faculty only' },
    { ...SEED_OPPORTUNITY, id: 'c', postedAt: '2026-07-01T00:00:00.000Z', isDeleted: true },
  ]
  assert.deepEqual(visibleOpportunities(list, { role: 'Student' }).map(o => o.id), [SEED_OPPORTUNITY.id])
  assert.deepEqual(visibleOpportunities(list, { office: true }).map(o => o.id), ['b', SEED_OPPORTUNITY.id])
  assert.equal(postedDate(SEED_OPPORTUNITY.postedAt), 'May 1, 2026')
})

test('create keeps the EcoWays seed and stamps the poster', () => {
  assert.equal(createOpportunity({ title: 'Tree planting' }, null).success, false)
  assert.deepEqual(createOpportunity({ title: '' }, head), { success: false, error: 'Project Title is required.' })
  const result = createOpportunity({ title: ' Tree planting ', caption: 'Bring gloves', audience: 'For Students only' }, head)
  assert.equal(result.success, true)
  assert.equal(result.data.title, 'Tree planting')
  assert.equal(result.data.postedBy, 'Ana Head')
  assert.deepEqual(saved().map(o => o.id), [SEED_OPPORTUNITY.id, result.data.id])
})

test('update and soft delete follow the V2 contract', () => {
  assert.equal(updateOpportunity(SEED_OPPORTUNITY.id, { title: 'EcoWays 2' }).data.title, 'EcoWays 2')
  assert.equal(updateOpportunity('missing', { title: 'x' }).error, 'Volunteer opportunity not found.')
  assert.equal(updateOpportunity(SEED_OPPORTUNITY.id, { title: '' }).success, false)
  assert.deepEqual(deleteOpportunity(SEED_OPPORTUNITY.id), { success: true })
  assert.equal(saved()[0].isDeleted, true)
  assert.equal(deleteOpportunity(SEED_OPPORTUNITY.id).success, false)
  assert.equal(updateOpportunity(SEED_OPPORTUNITY.id, { title: 'x' }).success, false)
})
