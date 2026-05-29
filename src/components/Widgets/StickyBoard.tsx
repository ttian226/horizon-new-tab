import { useState, useEffect, useCallback, useRef } from 'react'
import {
  loadStickies,
  saveStickies,
  onStickiesChange,
  type StickyNote as StickyNoteData,
  type StickyColor,
} from '../../services/stickyNotes'
import { loadConfig as loadNotionConfig, fetchPageContent, type NotionConfig } from '../../services/notion'
import StickyNote from './StickyNote'

interface BodyState {
  text: string | null
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

  // Lazy-fetch each sticky's page body once.
  useEffect(() => {
    if (!config) return
    for (const s of stickies) {
      if (fetchedRef.current.has(s.pageId)) continue
      fetchedRef.current.add(s.pageId)
      setBodies((b) => ({ ...b, [s.pageId]: { text: null, error: null } }))
      fetchPageContent(config, s.pageId)
        .then((pc) => setBodies((b) => ({ ...b, [s.pageId]: { text: pc.text, error: null } })))
        .catch((e) =>
          setBodies((b) => ({
            ...b,
            [s.pageId]: { text: null, error: e instanceof Error ? e.message : 'Failed to load note' },
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

  const handleClose = useCallback((pageId: string) => {
    fetchedRef.current.delete(pageId)
    setStickies((curr) => {
      const next = curr.filter((s) => s.pageId !== pageId)
      saveStickies(next)
      return next
    })
  }, [])

  if (!config || stickies.length === 0) return null

  return (
    <>
      {stickies.map((s) => (
        <StickyNote
          key={s.pageId}
          note={s}
          body={bodies[s.pageId]?.text ?? null}
          loadError={bodies[s.pageId]?.error ?? null}
          notionUrl={`https://www.notion.so/${s.pageId.replace(/-/g, '')}`}
          onLayoutChange={handleLayoutChange}
          onColorChange={handleColorChange}
          onClose={handleClose}
        />
      ))}
    </>
  )
}
