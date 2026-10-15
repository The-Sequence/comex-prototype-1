/*
 * Building blocks for the display-only dashboard pages (Figma Frames 9–17).
 * Everything here is visual: buttons, tabs, dropdowns and inputs are inert
 * on purpose — only the Sprint 1 account features actually work.
 */
import { Bot, ChevronDown, Heart, MoreHorizontal, Paperclip, Pencil, Plus, Share2, Trash2 } from 'lucide-react'
import poster from '../assets/ecoways-poster.jpg'
import { initials } from '../lib/format'
import { SEED_OPPORTUNITY, postedDate } from '../lib/opportunityRules'
import { DisplayButton, DisplaySearch } from './DashboardControls'

const INERT = { type: 'button', title: 'Not available yet' }

export function PageTitle({ children, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-3xl font-bold tracking-tight text-black md:text-4xl">{children}</h1>
      {action}
    </div>
  )
}

export function YellowButton({ children, className = '', onClick, disabled = false }) {
  return (
    <button
      {...(onClick || disabled ? { type: 'button', onClick, disabled } : INERT)}
      className={`min-h-11 cursor-pointer disabled:cursor-default disabled:opacity-60 rounded-full border border-gray-700 bg-gold px-6 py-2 font-bold text-black shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy ${className}`}
    >
      {children}
    </button>
  )
}

export function NavyButton({ children, className = '' }) {
  return (
    <button {...INERT} className={`cursor-pointer rounded bg-navy-dark px-4 py-2 text-xs font-semibold text-white shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy ${className}`}>
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
      <h2 className="bg-sidebar text-lg font-bold text-white md:text-xl">
        <button {...INERT} className="flex w-full cursor-pointer items-center gap-4 px-6 py-5 text-left focus-visible:outline-2 focus-visible:outline-gold">
          <ChevronDown className={`size-5 shrink-0 fill-white ${open ? '' : '-rotate-90'}`} aria-hidden="true" />
          {title}
        </button>
      </h2>
      {open && <div className="bg-white">{children}</div>}
    </section>
  )
}

/** Underlined-first tab strip (New / Ongoing / Done, Faculty / ASP / Students). */
export function Tabs({ items }) {
  return (
    <div className="flex gap-8 border-b border-gray-700 px-6 py-3 text-sm font-medium">
      {items.map((item, i) => (
        <button {...INERT} key={item} className={`cursor-pointer focus-visible:outline-2 focus-visible:outline-navy ${i === 0 ? 'underline underline-offset-4' : ''}`}>
          {item}
        </button>
      ))}
    </div>
  )
}

/** Static look-alike of a <select>. */
export function FakeSelect({ children, className = '' }) {
  return (
    <button {...INERT} className={`flex cursor-pointer items-center justify-between rounded border border-gray-800 bg-white px-3 py-2.5 text-left text-sm shadow-sm focus-visible:outline-2 focus-visible:outline-navy ${className}`}>
      <span className="truncate">{children}</span>
      <ChevronDown className="size-4 fill-black" />
    </button>
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

export const ECOWAYS_ID = SEED_OPPORTUNITY.id
export const ECOWAYS = { id: ECOWAYS_ID, title: SEED_OPPORTUNITY.title }
const IMAGES = { 'ecoways-poster': { src: poster, alt: 'Nationalian EcoWays flexible plastic waste collection poster' } }

/** Volunteer opportunity post — Frames 9 and 14. `onEdit` / `onDelete` show the office's post controls. */
export function OpportunityPost({ opportunity = SEED_OPPORTUNITY, action, onEdit, onDelete, children }) {
  const image = IMAGES[opportunity.imageUrl]
  return (
    <article className="max-w-4xl">
      <div className="flex flex-wrap items-center gap-3">
        <Avatar name={opportunity.postedBy} size="size-14" />
        <div className="leading-snug">
          <p className="text-lg font-medium">{opportunity.postedBy}</p>
          <p className="text-sm text-gray-600">{opportunity.postedByRole}</p>
          <p className="text-sm">{postedDate(opportunity.postedAt)} / {opportunity.audience}</p>
        </div>
        {(onEdit || onDelete) && <div className="ml-auto flex flex-wrap gap-2">
          {onEdit && <DisplayButton icon={Pencil} label={`Edit ${opportunity.title}`} onClick={onEdit}>Edit</DisplayButton>}
          {onDelete && <DisplayButton icon={Trash2} label={`Delete ${opportunity.title}`} className="text-red-600" onClick={onDelete}>Delete</DisplayButton>}
        </div>}
      </div>
      <h2 className="mt-5 text-2xl font-bold md:text-3xl">{opportunity.title}</h2>
      {opportunity.caption && <p className="mt-1 whitespace-pre-line text-lg">{opportunity.caption}</p>}
      {image && <img src={image.src} alt={image.alt} className="mt-3 w-full max-w-3xl" />}
      <div className="mt-4 flex flex-wrap items-center gap-6">
        {action}
        <DisplayButton label="Like opportunity" className="!flex-col !gap-0 !border-0 !shadow-none">
          <Heart className="size-7" /> {opportunity.likes ?? 0}
        </DisplayButton>
        <DisplayButton label="Share opportunity" className="!flex-col !gap-0 !border-0 !shadow-none">
          <Share2 className="size-6" /> {opportunity.shares ?? 0}
        </DisplayButton>
      </div>
      {children}
    </article>
  )
}
