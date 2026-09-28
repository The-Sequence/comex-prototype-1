/* =========================================================================
 * Mock database — everything lives in the browser's localStorage.
 *
 * This prototype has no server. Accounts and verification-code requests
 * persist in localStorage so a demo survives a page refresh. Clearing site data (or the "Reset demo data" link on the
 * login page) restores the seed accounts below.
 *
 * Account statuses:  pending  -> approved | denied
 * Email verification is tracked separately with `emailVerified`.
 * ========================================================================= */

const KEY = 'comex-demo-db-v2'

export const CODE_TTL_MINUTES = 10
const CODE_TTL_MS = CODE_TTL_MINUTES * 60 * 1000

export const DEPARTMENTS = [
  { code: 'SET', name: 'School of Engineering and Technology' },
  { code: 'SBA', name: 'School of Business Administration' },
  { code: 'SAS', name: 'School of Arts and Sciences' },
  { code: 'SHTM', name: 'School of Hospitality and Tourism Management' },
  { code: 'SOA', name: 'School of Accountancy' },
  { code: 'SHS', name: 'Senior High School' },
]

export const SIGNUP_ROLES = ['Student', 'ASP', 'Faculty', 'COMEX Representative']
export const ADMIN_ROLES = ['COMEX Head', 'COMEX Associate']

/**
 * Which dashboard a role gets. The four groups mirror the actors in the
 * use case diagram: COMEX Head, Approver, COMEX Representative, Volunteer.
 * Every sign-up role other than COMEX Representative is a Volunteer.
 */
export function roleGroup(role) {
  if (ADMIN_ROLES.includes(role)) return 'admin'
  if (role === 'Approver') return 'approver'
  if (role === 'COMEX Representative') return 'rep'
  return 'volunteer'
}

/** Password every seeded demo account uses. Also listed in the README. */
export const DEMO_PASSWORD = 'P@ssword123'

/* ------------------------------------------------------------ helpers */

export async function hashPassword(password) {
  const bytes = new TextEncoder().encode(password)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

const normalizeEmail = (email) => email.trim().toLowerCase()
const newId = () => crypto.randomUUID()

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function save(db) {
  localStorage.setItem(KEY, JSON.stringify(db))
  window.dispatchEvent(new Event('comex-db-change'))
}

/* ------------------------------------------------------------ seed */

async function buildSeed() {
  const passwordHash = await hashPassword(DEMO_PASSWORD)
  const person = (fullName, email, department, role, status, registeredAt, approvedAt = null) => ({
    id: newId(),
    fullName,
    email,
    department,
    role,
    passwordHash,
    emailVerified: true,
    status,
    registeredAt,
    approvedAt,
  })
  return {
    users: [
      // One account per use-case actor.
      person('System Administrator', 'head@comex.com', 'COMEX', 'COMEX Head', 'approved', '2026-04-01', '2026-04-01'),
      person('Juan Dela Cruz', 'volunteer@comex.com', 'SET', 'Volunteer', 'approved', '2026-04-28', '2026-05-01'),
      person('Mavi Sia', 'comexrep@comex.com', 'SET', 'COMEX Representative', 'approved', '2026-04-20', '2026-04-21'),
      person('Elena Ramos', 'approver@comex.com', 'SET', 'Approver', 'approved', '2026-04-15', '2026-04-15'),
      // Extra registered accounts so the Users and Pending Approvals screens have data.
      person('Ana Reyes', 'ana.reyes@gmail.com', 'SBA', 'Faculty', 'approved', '2026-04-29', '2026-05-01'),
      person('Paolo Garcia', 'paolo.garcia@gmail.com', 'SAS', 'ASP', 'approved', '2026-04-30', '2026-05-02'),
      person('Maria Santos', 'maria.santos@gmail.com', 'SET', 'Faculty', 'pending', '2026-05-02'),
      person('Kai Mendoza', 'kai.mendoza@gmail.com', 'SBA', 'Student', 'pending', '2026-05-02'),
      person('Tj Crisologo', 'tj.crisologo@gmail.com', 'SHTM', 'ASP', 'pending', '2026-05-03'),
      person('MaviGab Sia', 'mavigab.sia@gmail.com', 'SET', 'Faculty', 'pending', '2026-05-03'),
    ],
    codes: [], // { email, purpose: 'verify' | 'reset', expiresAt, used }
  }
}

export async function initDb() {
  if (!load()) save(await buildSeed())
}

export async function resetDb() {
  save(await buildSeed())
}

export function getDb() {
  return load() ?? { users: [], codes: [] }
}

/* ------------------------------------------------------------ users */

export function findUserByEmail(email) {
  return getDb().users.find((u) => u.email === normalizeEmail(email)) ?? null
}

export function findUserById(id) {
  return getDb().users.find((u) => u.id === id) ?? null
}

export async function createUser({ fullName, department, email, password, role }) {
  const db = getDb()
  const normalized = normalizeEmail(email)
  if (db.users.some((u) => u.email === normalized)) {
    throw new Error('An account with this email already exists.')
  }
  const user = {
    id: newId(),
    fullName: fullName.trim(),
    email: normalized,
    department,
    role,
    passwordHash: await hashPassword(password),
    emailVerified: false,
    status: 'pending',
    registeredAt: new Date().toISOString(),
    approvedAt: null,
  }
  db.users.push(user)
  save(db)
  return user
}

export function setUserStatus(id, status) {
  const db = getDb()
  const user = db.users.find((u) => u.id === id)
  if (!user) return
  user.status = status
  user.approvedAt = status === 'approved' ? new Date().toISOString() : null
  save(db)
}

export async function updatePassword(email, password) {
  const db = getDb()
  const user = db.users.find((u) => u.email === normalizeEmail(email))
  if (!user) throw new Error('Account not found.')
  user.passwordHash = await hashPassword(password)
  save(db)
}

/* ------------------------------------------------------------ verification codes */

/**
 * Prototype stand-in for "send a code to the user's email". No email is
 * actually sent: the system records that a code was requested and when it
 * expires, and any 6-digit number the user enters is accepted until then.
 * Requesting a new code restarts the timer and retires the old request.
 */
export function issueCode(email, purpose) {
  const db = getDb()
  const to = normalizeEmail(email)
  db.codes.forEach((c) => {
    if (c.email === to && c.purpose === purpose) c.used = true
  })
  const expiresAt = Date.now() + CODE_TTL_MS
  db.codes.push({ email: to, purpose, expiresAt, used: false })
  save(db)
  return expiresAt
}

/** Expiry timestamp of the active code request, or null. */
export function activeCodeExpiry(email, purpose) {
  const to = normalizeEmail(email)
  const active = getDb().codes.findLast((c) => c.email === to && c.purpose === purpose && !c.used)
  return active ? active.expiresAt : null
}

/**
 * Checks a code. Returns { ok: true } or { ok: false, reason }.
 * A successful check consumes the request, so the same code cannot be
 * used twice.
 */
export function checkCode(email, purpose, code) {
  if (!/^\d{6}$/.test(code)) return { ok: false, reason: 'Enter all 6 digits of the code.' }
  const db = getDb()
  const to = normalizeEmail(email)
  const active = db.codes.findLast((c) => c.email === to && c.purpose === purpose)
  if (!active) return { ok: false, reason: 'No code has been sent to this email. Request a new code.' }
  if (active.used) return { ok: false, reason: 'This code has already been used. Request a new code.' }
  if (Date.now() > active.expiresAt) return { ok: false, reason: 'This code has expired. Request a new code.' }
  active.used = true
  save(db)
  return { ok: true }
}

export function markEmailVerified(email) {
  const db = getDb()
  const user = db.users.find((u) => u.email === normalizeEmail(email))
  if (user) {
    user.emailVerified = true
    save(db)
  }
}
