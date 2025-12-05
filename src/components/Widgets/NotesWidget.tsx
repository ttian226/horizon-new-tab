import { useState, useEffect, useRef } from 'react'
import { Note } from '@phosphor-icons/react'
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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  return (
    <GlassCard
      id="notes"
      title="Quick Notes"
      icon={Note}
      onClose={onClose}
      defaultWidth={320}
      defaultHeight={280}
    >
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your thoughts..."
        className="w-full h-full bg-transparent text-white/80 text-sm placeholder-white/30 outline-none resize-none leading-relaxed overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
      />
    </GlassCard>
  )
}
