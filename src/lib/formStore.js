/* COMEX Forms data — filled-form drafts, forms attached to project steps and
 * the office's replacement templates. Kept in this browser's localStorage only
 * (V2 kept drafts in localStorage too, and templates in Supabase; see
 * docs/supabase-migration.md). Writes return V2's { success, data } or
 * { success: false, error }. */
import { useEffect, useState } from 'react'
import { normalizeLegacyPlacements } from './forms/formFieldSchema.js'

const KEYS = { drafts: 'comex-form-drafts', attachments: 'comex-form-attachments', templates: 'comex-form-templates' }
const EVENT = 'comex-forms-change'
/* A replacement PDF is stored as a data URL, so keep it well inside the ~5 MB localStorage budget. */
export const MAX_TEMPLATE_BYTES = 2 * 1024 * 1024

const defaultStorage = () => (typeof window === 'undefined' ? null : window.localStorage)

function read(key, storage) {
  try {
    const value = JSON.parse(storage?.getItem(KEYS[key]) || '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

function write(key, list, storage) {
  try {
    storage?.setItem(KEYS[key], JSON.stringify(list))
  } catch {
    return false
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(EVENT))
  return true
}

/** One draft per form and language: Form 002 in English and in Filipino are different documents. */
export function draftKey(formCode, language = 'en') {
  return `${formCode}:${language}`
}

export function getDraft(formCode, language, storage = defaultStorage()) {
  return read('drafts', storage).find((d) => d.key === draftKey(formCode, language)) ?? null
}

/** Saves the placed answers (V2's `fields` shape) for one form. */
export function saveDraft({ formCode, language = 'en', fields = [], userId = null }, storage = defaultStorage()) {
  if (!formCode) return { success: false, error: 'Choose a form to save.' }
  const key = draftKey(formCode, language)
  const draft = { key, formCode, language, userId, schemaVersion: 2, fields: normalizeLegacyPlacements(fields), updatedAt: new Date().toISOString() }
  const list = read('drafts', storage).filter((d) => d.key !== key)
  if (!write('drafts', [draft, ...list], storage)) return { success: false, error: 'This browser could not save the draft. Free some storage and try again.' }
  return { success: true, data: draft }
}

export function removeDraft(formCode, language, storage = defaultStorage()) {
  const key = draftKey(formCode, language)
  write('drafts', read('drafts', storage).filter((d) => d.key !== key), storage)
  return { success: true, data: key }
}

/** Every saved draft, newest first. */
export function listDrafts(storage = defaultStorage()) {
  return read('drafts', storage).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

/**
 * Attach the current filled copy of a form to a project step. Other features
 * (the project tracker's steps) call this; the answers are snapshotted so later
 * edits to the draft do not change what was attached.
 */
export function attachFilledForm({ projectId, stepId, formCode, language = 'en', fields, userId = null }, storage = defaultStorage()) {
  if (!projectId || !stepId) return { success: false, error: 'Choose the project step to attach this form to.' }
  if (!formCode) return { success: false, error: 'Choose a form to attach.' }
  const answers = fields ?? getDraft(formCode, language, storage)?.fields
  if (!answers?.length) return { success: false, error: 'Fill in the form before attaching it.' }
  const attachment = { id: `${projectId}:${stepId}:${draftKey(formCode, language)}`, projectId, stepId, formCode, language,
    userId, fields: normalizeLegacyPlacements(answers), attachedAt: new Date().toISOString() }
  const list = read('attachments', storage).filter((a) => a.id !== attachment.id)
  if (!write('attachments', [...list, attachment], storage)) return { success: false, error: 'This browser could not save the attachment.' }
  return { success: true, data: attachment }
}

export function listAttachedForms(projectId, stepId, storage = defaultStorage()) {
  return read('attachments', storage).filter((a) => a.projectId === projectId && (stepId === undefined || a.stepId === stepId))
}

export function detachFilledForm(id, storage = defaultStorage()) {
  write('attachments', read('attachments', storage).filter((a) => a.id !== id), storage)
  return { success: true, data: id }
}

/* ----- Templates: V2's formTemplateRepository (publish / list / activate / revert). ----- */

export function listFormVersions(formCode, language, storage = defaultStorage()) {
  return read('templates', storage)
    .filter((v) => v.formCode === formCode && v.language === language)
    .sort((a, b) => b.version - a.version)
}

export function getActiveVersion(formCode, language, storage = defaultStorage()) {
  return listFormVersions(formCode, language, storage).find((v) => v.isActive) ?? null
}

/** Publish a replacement PDF; it becomes the active version for everyone using this browser. */
export function publishFormVersion({ formCode, language = 'en', fileName, dataUrl, size = 0, keepLayout = true, notes = '', userId = null }, storage = defaultStorage()) {
  if (!formCode) return { success: false, error: 'Choose a form to replace.' }
  if (!dataUrl?.startsWith('data:application/pdf')) return { success: false, error: 'Upload the new form as a PDF file.' }
  if (size > MAX_TEMPLATE_BYTES) return { success: false, error: 'That PDF is larger than 2 MB. Compress it and try again.' }
  const all = read('templates', storage)
  const own = all.filter((v) => v.formCode === formCode && v.language === language)
  const version = { id: `${draftKey(formCode, language)}:v${own.length + 1}`, formCode, language, version: own.length + 1,
    fileName: fileName || `${formCode}.pdf`, dataUrl, keepLayout, notes: notes.trim(), isActive: true, uploadedBy: userId, createdAt: new Date().toISOString() }
  const others = all.map((v) => (v.formCode === formCode && v.language === language ? { ...v, isActive: false } : v))
  if (!write('templates', [...others, version], storage)) return { success: false, error: 'This browser has no room for that PDF. Remove an older version first.' }
  return { success: true, data: version }
}

export function activateFormVersion(id, storage = defaultStorage()) {
  const all = read('templates', storage)
  const target = all.find((v) => v.id === id)
  if (!target) return { success: false, error: 'That version no longer exists.' }
  write('templates', all.map((v) => (v.formCode === target.formCode && v.language === target.language ? { ...v, isActive: v.id === id } : v)), storage)
  return { success: true, data: { ...target, isActive: true } }
}

/** Go back to the office's bundled original; uploaded versions stay listed. */
export function revertToBundledForm(formCode, language, storage = defaultStorage()) {
  write('templates', read('templates', storage).map((v) => (v.formCode === formCode && v.language === language ? { ...v, isActive: false } : v)), storage)
  return { success: true, data: null }
}

/** Re-renders whenever any forms data changes, here or in another tab. */
export function useFormStore() {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const bump = () => setTick((t) => t + 1)
    window.addEventListener(EVENT, bump)
    window.addEventListener('storage', bump)
    return () => {
      window.removeEventListener(EVENT, bump)
      window.removeEventListener('storage', bump)
    }
  }, [])
  return tick
}
