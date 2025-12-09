import { useState, useEffect, useRef } from 'react'
import { StickyNote } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import GlassCard from './GlassCard'

const NOTES_STORAGE_KEY = 'horizon_user_notes'
const DEBOUNCE_DELAY = 500

function loadNotes(): string {
  try {
    return localStorage.getItem(NOTES_STORAGE_KEY) || ''
  } catch {
    return ''
  }
}

function saveNotes(content: string): void {
  try {
    localStorage.setItem(NOTES_STORAGE_KEY, content)
  } catch {
    // ignore
  }
}

interface NotesWidgetProps {
  onClose?: () => void
}

export default function NotesWidget({ onClose }: NotesWidgetProps) {
  const [content, setContent] = useState(loadNotes)
  const [isEditing, setIsEditing] = useState(() => !loadNotes().trim())
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Debounced save to localStorage
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      saveNotes(content)
    }, DEBOUNCE_DELAY)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [content])

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isEditing])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Cmd/Ctrl + Enter to save and exit edit mode
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      setIsEditing(false)
    }
    // Escape to cancel (revert is not implemented, just exit)
    if (e.key === 'Escape') {
      setIsEditing(false)
    }
  }

  const handleBlur = () => {
    // Small delay to allow click events to fire first
    setTimeout(() => {
      setIsEditing(false)
    }, 100)
  }

  return (
    <GlassCard
      id="notes"
      title="Quick Notes"
      icon={StickyNote}
      onClose={onClose}
      defaultWidth={320}
      defaultHeight={280}
    >
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder="Write your thoughts... (Markdown supported)"
          className="w-full h-full bg-transparent text-white/80 text-sm placeholder-white/30 outline-none resize-none leading-relaxed overflow-y-auto font-mono"
        />
      ) : (
        <div
          onClick={() => setIsEditing(true)}
          className="w-full h-full overflow-y-auto cursor-text"
        >
          {content.trim() ? (
            <div className="prose prose-invert prose-sm max-w-none prose-headings:text-white/90 prose-headings:font-medium prose-p:text-white/80 prose-a:text-indigo-300 prose-strong:text-white/90 prose-code:text-indigo-200 prose-code:bg-white/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-pre:bg-white/5 prose-pre:border prose-pre:border-white/10 prose-li:text-white/80 marker:text-white/50 prose-hr:border-white/10">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="text-white/30 text-sm">
              Click to write... (Markdown supported)
            </div>
          )}
        </div>
      )}
    </GlassCard>
  )
}
