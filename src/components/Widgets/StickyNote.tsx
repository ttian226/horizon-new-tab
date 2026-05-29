import { useState, useRef, useCallback, useEffect } from 'react'
import { X, ExternalLink, Circle, CheckCircle2 } from 'lucide-react'
import { STICKY_COLORS, type StickyColor, type StickyNote as StickyNoteData } from '../../services/stickyNotes'
import { formatDueDate } from '../../utils/formatDate'

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
  /** Whether the body is safe to edit (paragraphs-only). */
  editable: boolean
  loadError: string | null
  notionUrl?: string
  onLayoutChange: (pageId: string, layout: { x: number; y: number; w: number; h: number }) => void
  onColorChange: (pageId: string, color: StickyColor) => void
  /** Write the edited body back to Notion. Rejects on failure. */
  onSaveBody: (pageId: string, text: string) => Promise<void>
  onToggleDone: (pageId: string, completed: boolean) => void
  onClose: (pageId: string) => void
}

export default function StickyNote({
  note,
  body,
  editable,
  loadError,
  notionUrl,
  onLayoutChange,
  onColorChange,
  onSaveBody,
  onToggleDone,
  onClose,
}: StickyNoteProps) {
  const [pos, setPos] = useState({ x: note.x, y: note.y })
  const [size, setSize] = useState({ w: note.w, h: note.h })
  const [dragging, setDragging] = useState(false)
  const [resizing, setResizing] = useState(false)
  const [showColors, setShowColors] = useState(false)
  const [draft, setDraft] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

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
      // Clamp to the viewport so a sticky can't be dragged out of sight.
      const halfW = size.w / 2
      const halfH = size.h / 2
      const pad = 20
      const dock = 100 // keep clear of the left dock
      const minX = -window.innerWidth / 2 + halfW + dock
      const maxX = window.innerWidth / 2 - halfW - pad
      const minY = -window.innerHeight / 2 + halfH + pad
      const maxY = window.innerHeight / 2 - halfH - pad
      const x = Math.max(minX, Math.min(maxX, e.clientX - dragStart.current.x))
      const y = Math.max(minY, Math.min(maxY, e.clientY - dragStart.current.y))
      setPos({ x, y })
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
      const maxW = window.innerWidth - 120
      const maxH = window.innerHeight - 120
      const w = Math.min(maxW, Math.max(MIN_W, resizeStart.current.w + (e.clientX - resizeStart.current.x)))
      const h = Math.min(maxH, Math.max(MIN_H, resizeStart.current.h + (e.clientY - resizeStart.current.y)))
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

  // Seed the editable draft once the body has loaded.
  useEffect(() => {
    if (body !== null && draft === null) setDraft(body)
  }, [body, draft])

  // Save on blur — only if the text actually changed. Keep the draft on
  // failure (don't discard the user's edit), just surface the error.
  const handleBlur = async () => {
    if (draft === null || draft === body) return
    setSaveError(null)
    try {
      await onSaveBody(note.pageId, draft)
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Save failed')
    }
  }

  const due = note.dueDate ? formatDueDate(note.dueDate) : null

  return (
    <div
      className={`group font-task fixed rounded-2xl backdrop-blur-xl border shadow-2xl overflow-hidden select-none flex flex-col ${COLOR_BG[note.color]} ${
        dragging || resizing ? 'cursor-grabbing' : ''
      } ${note.completed ? 'opacity-70' : ''}`}
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
          className={`text-sm font-semibold leading-snug break-words line-clamp-2 pr-8 ${
            note.completed ? 'text-white/40 line-through' : 'text-white/90'
          }`}
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

      {/* Body — the note (task page body). Editable when paragraphs-only. */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 pb-1 select-text">
        {loadError ? (
          <span className="text-[13px] text-red-400">{loadError}</span>
        ) : body === null ? (
          <span className="text-[13px] text-white/30">Loading…</span>
        ) : editable ? (
          <textarea
            value={draft ?? ''}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={handleBlur}
            placeholder="Write a note…"
            className="w-full h-full resize-none bg-transparent outline-none no-scrollbar text-[13px] leading-relaxed text-white/80 placeholder-white/25"
          />
        ) : (
          <div className="text-[13px] leading-relaxed text-white/70 whitespace-pre-wrap break-words">
            {body.trim() === '' ? (
              <span className="text-white/30 italic">Empty — add content in Notion.</span>
            ) : (
              body
            )}
            <span className="mt-2 block text-[11px] text-white/30">Rich content — edit in Notion ↗</span>
          </div>
        )}
      </div>
      {saveError && <div className="shrink-0 px-4 text-[11px] text-red-400">{saveError}</div>}

      {/* Footer — color (left), due date + status (right) */}
      <div className="flex items-center gap-1.5 px-4 py-1.5 pr-6">
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

        <div className="flex-1" />

        {due && (
          <span
            className={`text-[10px] font-mono tabular-nums ${
              due.isPast && !note.completed ? 'text-red-400' : 'text-white/40'
            }`}
          >
            {due.label}
          </span>
        )}
        <button
          onClick={() => onToggleDone(note.pageId, !note.completed)}
          onMouseDown={(e) => e.stopPropagation()}
          title={note.completed ? 'Mark not done' : 'Mark done'}
          className="shrink-0"
        >
          {note.completed ? (
            <CheckCircle2 size={14} className="text-emerald-400" />
          ) : (
            <Circle size={14} className="text-white/40 hover:text-white/70 transition-colors" />
          )}
        </button>
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
