/* Messages — kept in this browser's localStorage only. The rules live in
 * messageThreads.js; see docs/supabase-migration.md for moving to Supabase. */
import { useEffect, useState } from 'react'
import * as rules from './messageThreads'

const KEY = 'comex-messages'
const EVENT = 'comex-messages-change'

function read() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(KEY) || 'null')
    const state = rules.emptyState()
    return saved && typeof saved === 'object'
      ? Object.fromEntries(Object.keys(state).map((k) => [k, Array.isArray(saved[k]) ? saved[k] : []]))
      : state
  } catch {
    return rules.emptyState()
  }
}

function write(state) {
  try { window.localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* storage unavailable */ }
  window.dispatchEvent(new Event(EVENT))
}

/** Runs one rule against the stored state; saves only when it changed. Returns { success, data } / { success: false, error }. */
function run(apply) {
  const before = read()
  const { result, state } = apply(before)
  if (state !== before) write(state)
  return result
}

export const sendMessage = (threadId, user, body) => run((s) => rules.sendMessage(s, threadId, user, body))
export const startConversation = (user, draft) => run((s) => rules.startConversation(s, user, draft))
export const markThreadRead = (threadId, user) => run((s) => rules.markThreadRead(s, threadId, user))

/** Lists the signed-in person in the directory so others can message them. */
export function rememberPerson(user) {
  const before = read()
  const next = rules.rememberPerson(before, user)
  if (next !== before) write(next)
}

function useMessageState() {
  const [state, setState] = useState(read)
  useEffect(() => {
    const sync = () => setState(read())
    window.addEventListener(EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])
  return state
}

/** Live inbox and recipient list for one person; updates across components and tabs. */
export function useMessages(user) {
  const state = useMessageState()
  return { threads: rules.listThreads(state, user), recipients: rules.recipientsFor(state, user) }
}

/** How many conversations hold a message this person has not read yet. */
export function useUnreadThreadCount(user) {
  return rules.countUnreadThreads(useMessageState(), user)
}
