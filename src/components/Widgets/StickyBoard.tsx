import { useState, useEffect, useCallback, useRef } from 'react'
import {
  loadStickies,
  saveStickies,
  onStickiesChange,
  type StickyNote as StickyNoteData,
  type StickyColor,
} from '../../services/stickyNotes'
import {
  loadConfig as loadNotionConfig,
  fetchPageContent,
  updatePageContent,
  updateTaskStatus,
  type NotionConfig,
} from '../../services/notion'
import StickyNote from './StickyNote'

interface BodyState {
  text: string | null
  editable: boolean
  error: string | null
}

/**
 * Renders the pinned sticky notes on the work-mode canvas. Each sticky's text
 * is a Notion task's page body, fetched lazily. Stickies only exist with a
 * Notion connection (no page body otherwise), so this renders nothing when
 * Notion isn't configured. App gates this to work mode.
 */
export default function StickyBoard() {
  const [config, setConfig] = useState<NotionConfig | null | undefined>(undefined)
  const [stickies, setStickies] = useState<StickyNoteData[]>([])
  const [bodies, setBodies] = useState<Record<string, BodyState>>({})
  const fetchedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    loadNotionConfig().then(setConfig)
  }, [])

  useEffect(() => {
    loadStickies().then(setStickies)
    return onStickiesChange(() => loadStickies().then(setStickies))
  }, [])

  // Lazy-fetch each visible sticky's page body once.
  useEffect(() => {
    if (!config) return
    for (const s of stickies) {
      if (!s.pinned) continue
      if (fetchedRef.current.has(s.pageId)) continue
      fetchedRef.current.add(s.pageId)
      setBodies((b) => ({ ...b, [s.pageId]: { text: null, editable: false, error: null } }))
      fetchPageContent(config, s.pageId)
        .then((pc) =>
          setBodies((b) => ({ ...b, [s.pageId]: { text: pc.text, editable: pc.editable, error: null } }))
        )
        .catch((e) =>
          setBodies((b) => ({
            ...b,
            [s.pageId]: {
              text: null,
              editable: false,
              error: e instanceof Error ? e.message : 'Failed to load note',
            },
          }))
        )
    }
  }, [config, stickies])

  const handleLayoutChange = useCallback(
    (pageId: string, layout: { x: number; y: number; w: number; h: number }) => {
      setStickies((curr) => {
        const next = curr.map((s) => (s.pageId === pageId ? { ...s, ...layout } : s))
        saveStickies(next)
        return next
      })
    },
    []
  )

  const handleColorChange = useCallback((pageId: string, color: StickyColor) => {
    setStickies((curr) => {
      const next = curr.map((s) => (s.pageId === pageId ? { ...s, color } : s))
      saveStickies(next)
      return next
    })
  }, [])

  // Close = soft-hide. Keep layout/color so re-pinning restores the sticky;
  // keep the fetched body cached for an instant re-open.
  const handleClose = useCallback((pageId: string) => {
    setStickies((curr) => {
      const next = curr.map((s) => (s.pageId === pageId ? { ...s, pinned: false } : s))
      saveStickies(next)
      return next
    })
  }, [])

  // Write the edited note back to the Notion page body. Throws on failure so
  // the sticky can surface an error without discarding the user's text.
  const handleSaveBody = useCallback(
    async (pageId: string, text: string) => {
      if (!config) return
      await updatePageContent(config, pageId, text)
      setBodies((b) => ({ ...b, [pageId]: { text, editable: true, error: null } }))
    },
    [config]
  )

  // Toggle the task's done state from the sticky — optimistic, rolls back on
  // failure. Reuses the v0.1.4 status write.
  const setCompleted = (pageId: string, completed: boolean) =>
    setStickies((curr) => {
      const next = curr.map((s) => (s.pageId === pageId ? { ...s, completed } : s))
      saveStickies(next)
      return next
    })

  const handleToggleDone = useCallback(
    async (pageId: string, completed: boolean) => {
      if (!config) return
      setCompleted(pageId, completed)
      try {
        await updateTaskStatus(config, pageId, completed)
      } catch {
        setCompleted(pageId, !completed)
      }
    },
    [config]
  )

  if (!config) return null
  const visible = stickies.filter((s) => s.pinned)
  if (visible.length === 0) return null

  return (
    <>
      {visible.map((s) => (
        <StickyNote
          key={s.pageId}
          note={s}
          body={bodies[s.pageId]?.text ?? null}
          editable={bodies[s.pageId]?.editable ?? false}
          loadError={bodies[s.pageId]?.error ?? null}
          notionUrl={`https://www.notion.so/${s.pageId.replace(/-/g, '')}`}
          onLayoutChange={handleLayoutChange}
          onColorChange={handleColorChange}
          onSaveBody={handleSaveBody}
          onToggleDone={handleToggleDone}
          onClose={handleClose}
        />
      ))}
    </>
  )
}
