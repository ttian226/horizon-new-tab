// Sticky-note board persistence (v0.1.5 M1).
//
// A sticky = a pinned Notion task. Its TEXT is the task's page body (fetched
// from Notion on demand); only the LAYOUT (position / size / color) and which
// tasks are pinned live here, in chrome.storage.local — per device, since
// pixel positions don't translate across screens.

import { getLocal, setLocal, onLocalChange } from './extensionStorage'

const STICKY_KEY = 'horizon_sticky_notes'

export const STICKY_COLORS = ['amber', 'rose', 'sky', 'violet', 'emerald'] as const
export type StickyColor = (typeof STICKY_COLORS)[number]

/** Soft cap to keep the work-mode canvas from getting cluttered. */
export const MAX_STICKIES = 8

const DEFAULT_W = 240
const DEFAULT_H = 200

export interface StickyNote {
  pageId: string // Notion task page id — the note source
  title: string // task name, cached for display
  x: number // offset from canvas center (matches widget layout convention)
  y: number
  w: number
  h: number
  color: StickyColor
}

export async function loadStickies(): Promise<StickyNote[]> {
  return (await getLocal<StickyNote[]>(STICKY_KEY)) ?? []
}

export async function saveStickies(list: StickyNote[]): Promise<void> {
  await setLocal(STICKY_KEY, list)
}

export function onStickiesChange(cb: () => void): () => void {
  return onLocalChange(STICKY_KEY, cb)
}

/** Pin a task as a new sticky. No-op if already pinned or at the cap.
 *  Returns false when the cap was hit so the caller can warn the user. */
export async function pinTask(pageId: string, title: string): Promise<boolean> {
  const list = await loadStickies()
  if (list.some((s) => s.pageId === pageId)) return true
  if (list.length >= MAX_STICKIES) return false
  const i = list.length
  const note: StickyNote = {
    pageId,
    title,
    x: (i % 3) * 56 - 56,
    y: Math.floor(i / 3) * 56 - 40,
    w: DEFAULT_W,
    h: DEFAULT_H,
    color: STICKY_COLORS[i % STICKY_COLORS.length],
  }
  await saveStickies([...list, note])
  return true
}

export async function isPinned(pageId: string): Promise<boolean> {
  const list = await loadStickies()
  return list.some((s) => s.pageId === pageId)
}
