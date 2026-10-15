/* The Messages inbox and conversation (Frames 12 and 17), working: threads,
 * replies, per-person unread, search and a New message dialog. Behaviour is
 * ported from comex-frontend-v2 (components/messages/MessagesView.jsx); the
 * look is V1's original MessagesPanel. Data: src/lib/messages.js. */
import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Plus, Search } from 'lucide-react'
import { Avatar, BotAvatar } from './Showcase'
import { Modal, Toast } from './Applications'
import { FieldError, Label, OutlineButton, PrimaryButton } from './Form'
import { markThreadRead, rememberPerson, sendMessage, startConversation, useMessages } from '../lib/messages'
import { MAX_MESSAGE_LENGTH, filterThreads } from '../lib/messageThreads'

const buttonClass = 'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded border border-gray-800 px-3 py-2 text-sm font-medium shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:cursor-default disabled:opacity-60'

/** A person gets their initials; the Office and departments get the bot avatar, as in the frames. */
function ContactAvatar({ thread, size }) {
  const isPerson = thread.recipientId && thread.recipientId !== 'office' && !thread.recipientId.startsWith('dept:')
  return isPerson ? <Avatar name={thread.contactName} size={size} className="text-xs" /> : <BotAvatar size={size} />
}

export function MessagesPanel({ user, showNewBadge = false }) {
  const { threads, recipients } = useMessages(user)
  const [selectedId, setSelectedId] = useState(null)
  const [search, setSearch] = useState('')
  const [composing, setComposing] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => { rememberPerson(user) }, [user])

  const visible = useMemo(() => filterThreads(threads, search), [threads, search])
  const selected = threads.find((t) => t.id === selectedId) ?? null

  /* Opening a conversation, or a reply landing in the open one, marks it read. */
  const unreadInOpen = selected?.unreadCount ?? 0
  useEffect(() => {
    if (selectedId && unreadInOpen > 0) markThreadRead(selectedId, user)
  }, [selectedId, unreadInOpen, user])

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,20rem)_1fr]">
      <div className={`min-h-[28rem] flex-col border border-gray-800 shadow-md ${selected ? 'hidden lg:flex' : 'flex'}`}>
        <div className="flex flex-wrap items-center justify-between gap-3 bg-gold px-4 py-3">
          <h2 className="text-3xl font-bold">Inbox</h2>
          <button type="button" onClick={() => setComposing(true)} className={`${buttonClass} bg-white`}>
            <Plus className="size-4 shrink-0" aria-hidden="true" />New message
          </button>
        </div>
        <div className="p-3">
          <div className="flex min-w-0 items-center gap-2 rounded border border-gray-800 bg-white px-3 py-2.5 shadow-sm">
            <Search className="size-4 shrink-0 text-gray-600" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search conversations"
              placeholder="Search conversations"
              className="min-w-0 w-full bg-transparent text-sm outline-none"
            />
          </div>
        </div>
        {visible.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center text-gray-600">
            <p>{search ? 'No matching conversations.' : 'No conversations yet.'}</p>
            {!search && <button type="button" onClick={() => setComposing(true)} className={`${buttonClass} bg-white text-black`}>Start one</button>}
          </div>
        ) : (
          <ul aria-label="Conversations">
            {visible.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(t.id)}
                  aria-current={t.id === selectedId ? 'true' : undefined}
                  className={`flex w-full cursor-pointer gap-3 border-b border-gray-800 px-3 py-3 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-navy ${t.id === selectedId ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                >
                  <ContactAvatar thread={t} size="size-8" />
                  <span className="min-w-0 flex-1 text-lg leading-snug">
                    <span className="flex items-center justify-between gap-2 font-bold">
                      <span className="truncate">{t.contactName}</span>
                      {t.unreadCount > 0 && (showNewBadge
                        ? <span className="rounded-full bg-red-600 px-2 text-[10px] font-normal text-white">New</span>
                        : <span className="size-2.5 shrink-0 rounded-full bg-red-600"><span className="sr-only">Unread</span></span>)}
                    </span>
                    <span className={`block truncate ${t.unreadCount > 0 ? 'font-semibold' : ''}`}>{t.preview}</span>
                    <span className="block text-xs text-gray-600">{t.lastMessageAt}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {selected ? (
        <Conversation thread={selected} user={user} onBack={() => setSelectedId(null)} onError={(message) => setToast({ message, tone: 'error' })} />
      ) : (
        <div className="hidden min-h-[28rem] items-center justify-center border border-gray-800 p-6 text-center text-gray-600 shadow-md lg:flex">
          Select a conversation, or start a new message.
        </div>
      )}
      {composing && (
        <ComposeDialog
          user={user}
          recipients={recipients}
          onClose={() => setComposing(false)}
          onSent={(thread) => {
            setComposing(false)
            setSearch('')
            setSelectedId(thread.id)
            setToast({ message: 'Message sent.' })
          }}
        />
      )}
      <Toast message={toast?.message} tone={toast?.tone} onDismiss={() => setToast(null)} />
    </div>
  )
}

function Conversation({ thread, user, onBack, onError }) {
  const [draft, setDraft] = useState('')
  const end = useRef(null)
  useEffect(() => { end.current?.scrollIntoView?.({ block: 'nearest' }) }, [thread.id, thread.messages.length])

  const send = (e) => {
    e.preventDefault()
    if (!draft.trim()) return
    const result = sendMessage(thread.id, user, draft)
    if (result.success) setDraft('')
    else onError(result.error)
  }

  return (
    <section className="flex min-h-[28rem] flex-col border border-gray-800 shadow-md" aria-label={`Conversation with ${thread.contactName}`}>
      <div className="flex items-center gap-3 bg-gold px-4 py-3">
        <button type="button" onClick={onBack} aria-label="Back to inbox" className="flex size-11 items-center justify-center rounded-full hover:bg-black/10 lg:hidden">
          <ArrowLeft className="size-5" />
        </button>
        <ContactAvatar thread={thread} size="size-8" />
        <div className="min-w-0">
          <h2 className="truncate text-2xl font-bold">{thread.contactName}</h2>
          {thread.contactRole && <p className="truncate text-sm">{thread.contactRole}</p>}
        </div>
      </div>
      <ol className="max-h-[32rem] flex-1 space-y-6 overflow-y-auto p-6">
        {thread.messages.map((m) => m.isMine ? (
          <li key={m.id} className="ml-auto max-w-md">
            <p className="whitespace-pre-wrap break-words rounded bg-sidebar px-5 py-3 text-sm font-medium text-white">{m.body}</p>
            <p className="mt-1 text-right text-xs text-gray-600">{m.sentAt}</p>
          </li>
        ) : (
          <li key={m.id} className="flex items-start gap-3">
            <ContactAvatar thread={thread} size="size-8" />
            <div className="max-w-lg">
              <p className="whitespace-pre-wrap break-words rounded bg-gray-200 px-4 py-3 text-sm font-medium">{m.body}</p>
              <p className="mt-1 text-xs text-gray-600">{m.sentAt}</p>
            </div>
          </li>
        ))}
        <li ref={end} aria-hidden="true" />
      </ol>
      <form onSubmit={send} className="flex items-center gap-4 p-4">
        <textarea
          rows={1}
          value={draft}
          maxLength={MAX_MESSAGE_LENGTH}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            // Enter sends, Shift+Enter starts a new line — as in V2.
            if (e.key === 'Enter' && !e.shiftKey) send(e)
          }}
          placeholder="Type a message..."
          aria-label="Message"
          className="min-w-0 flex-1 resize-none rounded border border-gray-800 px-4 py-3 text-lg shadow-md outline-none focus-visible:ring-2 focus-visible:ring-navy/20"
        />
        <button type="submit" disabled={!draft.trim()} className="cursor-pointer rounded border border-gray-800 bg-gray-200 px-5 py-3 text-lg font-medium focus-visible:outline-2 focus-visible:outline-navy disabled:cursor-default disabled:opacity-60">
          Send
        </button>
      </form>
    </section>
  )
}

const GROUPS = ['Office', 'Departments', 'People']

function ComposeDialog({ user, recipients, onClose, onSent }) {
  const [recipientId, setRecipientId] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState('')

  const submit = (e) => {
    e.preventDefault()
    const recipient = recipients.find((r) => r.id === recipientId)
    const result = startConversation(user, { recipientId, recipientName: recipient?.name, recipientRole: recipient?.role, body })
    if (result.success) onSent(result.data)
    else setError(result.error)
  }

  return (
    <Modal
      title="New message"
      subtitle="Write to the COMEX Office, a department's representatives, or another user."
      onClose={onClose}
      footer={<>
        <OutlineButton type="button" onClick={onClose}>Cancel</OutlineButton>
        <PrimaryButton type="submit" form="compose-message">Send</PrimaryButton>
      </>}
    >
      <form id="compose-message" onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <Label htmlFor="compose-to" required>To</Label>
          <select
            id="compose-to"
            value={recipientId}
            onChange={(e) => { setRecipientId(e.target.value); setError('') }}
            className="w-full rounded-sm border border-gray-400 bg-white px-2.5 py-2 text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/20"
          >
            <option value="">Choose a recipient</option>
            {GROUPS.map((group) => {
              const options = recipients.filter((r) => r.group === group)
              return options.length > 0 && (
                <optgroup key={group} label={group}>
                  {options.map((r) => <option key={r.id} value={r.id}>{r.name}{r.role ? ` — ${r.role}` : ''}</option>)}
                </optgroup>
              )
            })}
          </select>
        </div>
        <div>
          <Label htmlFor="compose-body" required>Message</Label>
          <textarea
            id="compose-body"
            rows={5}
            value={body}
            maxLength={MAX_MESSAGE_LENGTH}
            onChange={(e) => { setBody(e.target.value); setError('') }}
            className="w-full rounded-sm border border-gray-400 bg-white px-2.5 py-2 text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/20"
          />
        </div>
        <FieldError id="compose-error">{error}</FieldError>
      </form>
    </Modal>
  )
}
