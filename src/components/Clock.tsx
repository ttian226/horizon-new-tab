import { useState, useEffect, useRef } from 'react'

interface ClockProps {
  userName?: string
  nickname?: string | null
  onNicknameChange?: (nickname: string) => void
}

function getGreeting(hour: number): string {
  if (hour >= 5 && hour < 12) return 'Good Morning'
  if (hour >= 12 && hour < 18) return 'Good Afternoon'
  if (hour >= 18 && hour < 22) return 'Good Evening'
  return 'Good Night'
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function Clock({ userName, nickname, onNicknameChange }: ClockProps) {
  const [time, setTime] = useState(new Date())
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const greeting = getGreeting(time.getHours())
  // Priority: nickname > userName > 'there'
  const displayName = nickname || userName || 'there'

  const handleDoubleClick = () => {
    if (onNicknameChange) {
      setEditValue(displayName === 'there' ? '' : displayName)
      setIsEditing(true)
    }
  }

  const handleSave = () => {
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== displayName && onNicknameChange) {
      onNicknameChange(trimmed)
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
    }
  }

  const handleBlur = () => {
    handleSave()
  }

  return (
    <div className="text-center select-none">
      {/* Time: Montserrat, elegant and refined */}
      <h1 className="text-[8rem] md:text-[11rem] leading-none font-normal tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 drop-shadow-2xl font-clock">
        {formatTime(time)}
      </h1>

      {/* Greeting: Elegant Serif */}
      <h2 className="mt-4 text-2xl md:text-3xl font-serif-elegant italic text-white/80 drop-shadow-md font-normal">
        {greeting},{' '}
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            maxLength={30}
            className="bg-transparent border-b border-white/40 outline-none text-white/80 font-serif-elegant italic w-32 md:w-40 text-center"
            placeholder="Your name"
          />
        ) : (
          <span
            onDoubleClick={handleDoubleClick}
            className={onNicknameChange ? 'cursor-pointer hover:text-white transition-colors' : ''}
            title={onNicknameChange ? 'Double-click to edit' : undefined}
          >
            {displayName}
          </span>
        )}
      </h2>
    </div>
  )
}
