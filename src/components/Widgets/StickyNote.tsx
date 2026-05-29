import { useState, useRef, useCallback, useEffect } from 'react'
import { X, ExternalLink } from 'lucide-react'
import { STICKY_COLORS, type StickyColor, type StickyNote as StickyNoteData } from '../../services/stickyNotes'

const MIN_W = 180
const MIN_H = 140

const COLOR_BG: Record<StickyColor, string> = {
  amber: 'bg-amber-500/15 border-amber-400/30',
  rose: 'bg-rose-500/15 border-rose-400/30',
  sky: 'bg-sky-500/15 border-sky-400/30',
  violet: 'bg-violet-500/15 border-violet-400/30',
  emerald: 'bg-emerald-500/15 border-emerald-400/30',
}
const COLOR_DOT: Record<StickyColor, string> = {
  amber: 'bg-amber-400',
  rose: 'bg-rose-400',
  sky: 'bg-sky-400',
  violet: 'bg-violet-400',
  emerald: 'bg-emerald-400',
}

interface StickyNoteProps {
  note: StickyNoteData
  /** Page body text; null while loading. */
  body: string | null
  loadError: string | null
  notionUrl?: string
  onLayoutChange: (pageId: string, layout: { x: number; y: number; w: number; h: number }) => void
  onColorChange: (pageId: string, color: StickyColor) => void
  onClose: (pageId: string) => void
}

export default function StickyNote({
  note,
  body,
  loadError,
  notionUrl,
  onLayoutChange,
  onColorChange,
  onClose,
}: StickyNoteProps) {
  const [pos, setPos] = useState({ x: note.x, y: note.y })
  const [size, setSize] = useState({ w: note.w, h: note.h })
  const [dragging, setDragging] = useState(false)
  const [resizing, setResizing] = useState(false)
  const [showColors, setShowColors] = useState(false)

  const dragStart = useRef({ x: 0, y: 0 })
  const resizeStart = useRef({ w: 0, h: 0, x: 0, y: 0 })

  // Keep local layout in sync if the stored note changes externally.
  useEffect(() => {
    setPos({ x: note.x, y: note.y })
    setSize({ w: note.w, h: note.h })
  }, [note.x, note.y, note.w, note.h])

  const onDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setDragging(true)
      dragStart.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
    },
    [pos]
  )

  const onResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setResizing(true)
      resizeStart.current = { w: size.w, h: size.h, x: e.clientX, y: e.clientY }
    },
    [size]
  )

  useEffect(() => {
    if (!dragging) return
    const move = (e: MouseEvent) => {
      setPos({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y })
    }
    const up = () => {
      setDragging(false)
      setPos((p) => {
        onLayoutChange(note.pageId, { x: p.x, y: p.y, w: size.w, h: size.h })
        return p
      })
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
  }, [dragging, note.pageId, onLayoutChange, size.w, size.h])

  useEffect(() => {
    if (!resizing) return
    const move = (e: MouseEvent) => {
      const w = Math.max(MIN_W, resizeStart.current.w + (e.clientX - resizeStart.current.x))
      const h = Math.max(MIN_H, resizeStart.current.h + (e.clientY - resizeStart.current.y))
      setSize({ w, h })
    }
    const up = () => {
      setResizing(false)
      setSize((s) => {
        onLayoutChange(note.pageId, { x: pos.x, y: pos.y, w: s.w, h: s.h })
        return s
      })
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
  }, [resizing, note.pageId, onLayoutChange, pos.x, pos.y])

  return (
    <div
      className={`group fixed rounded-2xl backdrop-blur-xl border shadow-2xl overflow-hidden select-none flex flex-col ${COLOR_BG[note.color]} ${
        dragging || resizing ? 'cursor-grabbing' : ''
      }`}
      style={{
        width: size.w,
        height: size.h,
        left: '50%',
        top: '50%',
        transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
        zIndex: dragging || resizing ? 100 : 15,
      }}
    >
      {/* Floating actions — fade in on hover, no header band */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {notionUrl && (
          <button
            onClick={() => window.open(notionUrl, '_blank', 'noopener,noreferrer')}
            onMouseDown={(e) => e.stopPropagation()}
            title="Open in Notion"
            className="text-white/40 hover:text-white/80 transition-colors"
          >
            <ExternalLink size={12} />
          </button>
        )}
        <button
          onClick={() => onClose(note.pageId)}
          onMouseDown={(e) => e.stopPropagation()}
          title="Unpin (kept for next time)"
          className="text-white/40 hover:text-white/80 transition-colors"
        >
          <X size={13} />
        </button>
      </div>

      {/* Title — non-editable heading, doubles as the drag handle */}
      <div
        className="px-4 pt-3 pb-1.5 cursor-grab active:cursor-grabbing"
        onMouseDown={onDragStart}
      >
        <h3
          className="text-sm font-semibold text-white/90 leading-snug break-words line-clamp-2 pr-8"
          title={note.title}
        >
          {note.icon && (
            <span className="mr-1.5" aria-hidden>
              {note.icon}
            </span>
          )}
          {note.title}
        </h3>
      </div>

      {/* Body — the note (task page body); read-only in M1 */}
      <div className="flex-1 overflow-y-auto px-4 pb-2 text-[13px] leading-relaxed text-white/70 whitespace-pre-wrap break-words">
        {loadError ? (
          <span className="text-red-400">{loadError}</span>
        ) : body === null ? (
          <span className="text-white/30">Loading…</span>
        ) : body.trim() === '' ? (
          <span className="text-white/30 italic">Empty — add content in this task's Notion page.</span>
        ) : (
          body
        )}
      </div>

      {/* Footer — color dot (balances the layout) */}
      <div className="flex items-center gap-1.5 px-4 py-1.5">
        {showColors ? (
          STICKY_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => {
                onColorChange(note.pageId, c)
                setShowColors(false)
              }}
              className={`w-3 h-3 rounded-full ${COLOR_DOT[c]} ${
                c === note.color ? 'ring-2 ring-white/60' : 'hover:scale-110'
              } transition-transform`}
              title={c}
            />
          ))
        ) : (
          <button
            onClick={() => setShowColors(true)}
            className={`w-3 h-3 rounded-full ${COLOR_DOT[note.color]} hover:scale-110 transition-transform`}
            title="Change color"
          />
        )}
      </div>

      {/* Resize handle */}
      <div
        className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize group/resize"
        onMouseDown={onResizeStart}
      >
        <svg
          className="absolute bottom-1 right-1 text-white/20 group-hover/resize:text-white/40 transition-colors"
          width="10"
          height="10"
          viewBox="0 0 12 12"
        >
          <path d="M10 0L0 10M10 4L4 10M10 8L8 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  )
}
