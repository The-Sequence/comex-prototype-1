/*
 * Building blocks for the display-only dashboard pages (Figma Frames 9–17).
 * Everything here is visual: buttons, tabs, dropdowns and inputs are inert
 * on purpose — only the Sprint 1 account features actually work.
 */
import { Bot, ChevronDown, Heart, Paperclip, Share2 } from 'lucide-react'
import poster from '../assets/ecoways-poster.jpg'
import { initials } from '../lib/format'

const INERT = { type: 'button', tabIndex: -1, 'aria-disabled': true, title: 'Display only in this prototype' }

export function PageTitle({ children, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-3xl font-bold tracking-tight text-black md:text-4xl">{children}</h1>
      {action}
    </div>
  )
}

export function YellowButton({ children, className = '' }) {
  return (
    <button
      {...INERT}
      className={`cursor-default rounded-full border border-gray-700 bg-gold px-6 py-2 font-bold text-black shadow-md ${className}`}
    >
      {children}
    </button>
  )
}

export function NavyButton({ children, className = '' }) {
  return (
    <button {...INERT} className={`cursor-default rounded bg-navy-dark px-4 py-2 text-xs font-semibold text-white shadow-md ${className}`}>
      {children}
    </button>
  )
}

export function Avatar({ name, size = 'size-12', className = '' }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-navy text-sm font-bold text-gold ${size} ${className}`}
    >
      {initials(name)}
    </span>
  )
}

export function BotAvatar({ size = 'size-9' }) {
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full bg-sky-200 text-navy ${size}`}>
      <Bot className="size-1/2" />
    </span>
  )
}

/** Navy department header; `open` shows its body underneath like the expanded SET panel. */
export function DepartmentPanel({ title, open = false, children }) {
  return (
    <section className={`overflow-hidden rounded-2xl shadow-lg ${open ? 'border border-gray-400' : ''}`}>
      <div className="flex items-center gap-4 bg-sidebar px-6 py-5 text-white">
        <ChevronDown className={`size-5 fill-white ${open ? '' : '-rotate-90'}`} />
        <h2 className="text-lg font-bold md:text-xl">{title}</h2>
      </div>
      {open && <div className="bg-white">{children}</div>}
    </section>
  )
}

/** Underlined-first tab strip (New / Ongoing / Done, Faculty / ASP / Students). */
export function Tabs({ items }) {
  return (
    <div className="flex gap-8 border-b border-gray-700 px-6 py-3 text-sm font-medium">
      {items.map((item, i) => (
        <span key={item} className={i === 0 ? 'underline underline-offset-4' : ''}>
          {item}
        </span>
      ))}
    </div>
  )
}

/** Static look-alike of a <select>. */
export function FakeSelect({ children, className = '' }) {
  return (
    <div className={`flex items-center justify-between rounded border border-gray-800 bg-white px-3 py-2.5 text-sm shadow-sm ${className}`}>
      <span className="truncate">{children}</span>
      <ChevronDown className="size-4 fill-black" />
    </div>
  )
}

export function StatusPill({ tone, children }) {
  const tones = {
    green: 'bg-green-50 text-green-700 border-green-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    navy: 'bg-indigo-50 text-navy border-indigo-200',
  }
  return <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-semibold ${tones[tone]}`}>{children}</span>
}

/** Volunteer opportunity post — Frames 9 and 14. */
export function OpportunityPost({ actionLabel }) {
  return (
    <article className="max-w-4xl">
      <div className="flex items-center gap-3">
        <Avatar name="System Administrator" size="size-14" />
        <div className="leading-snug">
          <p className="text-lg font-medium">System Administrator</p>
          <p className="text-sm text-gray-600">Admin/COMEX head</p>
          <p className="text-sm">May 1, 2026/ For Faculty only</p>
        </div>
      </div>
      <h2 className="mt-5 text-2xl font-bold md:text-3xl">Join EcoWays: Clean and Green Initiative</h2>
      <p className="mt-1 text-lg">Be part of EcoWays’ clean-up drive and help create a cleaner, greener community.</p>
      <img src={poster} alt="Nationalian EcoWays flexible plastic waste collection poster" className="mt-3 w-full max-w-3xl" />
      <div className="mt-4 flex items-center gap-6">
        <YellowButton className="min-w-56 text-lg">{actionLabel}</YellowButton>
        <span className="flex flex-col items-center text-lg font-bold">
          <Heart className="size-7" /> 21
        </span>
        <span className="flex flex-col items-center text-lg font-bold">
          <Share2 className="size-6" /> 3
        </span>
      </div>
    </article>
  )
}

const THREADS = [
  { from: 'SET Representative', preview: 'We would like to request clean-up drive assistance...', isNew: true },
  { from: 'Student Org - IT Dept', preview: 'Follow up on volunteer hours approval...' },
]

/** Inbox + conversation — Frames 12 and 17. */
export function MessagesPanel({ showNewBadge }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,20rem)_1fr]">
      <div className="flex min-h-[28rem] flex-col border border-gray-800 shadow-md">
        <h2 className="bg-gold px-4 py-3 text-3xl font-bold">Inbox</h2>
        {THREADS.map((t) => (
          <div key={t.from} className="flex gap-3 border-b border-gray-800 px-3 py-3">
            <BotAvatar size="size-8" />
            <div className="min-w-0 flex-1 text-lg leading-snug">
              <p className="flex items-center justify-between gap-2 font-bold">
                {t.from}
                {showNewBadge && t.isNew && <span className="rounded-full bg-red-600 px-2 text-[10px] font-normal text-white">New</span>}
              </p>
              <p>{t.preview}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex min-h-[28rem] flex-col border border-gray-800 shadow-md">
        <div className="flex items-center gap-3 bg-gold px-4 py-3">
          <BotAvatar size="size-8" />
          <h2 className="text-2xl font-bold">SBA Representative</h2>
        </div>
        <div className="flex-1 space-y-8 p-6">
          <div className="flex items-center gap-3">
            <BotAvatar size="size-8" />
            <p className="max-w-lg rounded bg-gray-200 px-4 py-3 text-sm font-medium">
              Good day, we would like to request assistance for a clean-up drive in our area.
            </p>
          </div>
          <p className="ml-auto max-w-md rounded bg-sidebar px-5 py-3 text-sm font-medium text-white">
            Noted. Please submit the required COMEX forms.
          </p>
        </div>
        <ChatInput />
      </div>
    </div>
  )
}

function ChatInput() {
  return (
    <div className="flex items-center gap-4 p-4">
      <input
        readOnly
        tabIndex={-1}
        placeholder="Type a message..."
        className="flex-1 cursor-default rounded border border-gray-800 px-4 py-3 text-lg shadow-md outline-none"
      />
      <Paperclip className="size-7" />
      <button {...INERT} className="cursor-default rounded border border-gray-800 bg-gray-200 px-5 py-3 text-lg font-medium">
        Send
      </button>
    </div>
  )
}
