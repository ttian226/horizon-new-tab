import { ReactNode, useState, useRef, useEffect, useCallback } from 'react'
import { LucideIcon, X, GripHorizontal } from 'lucide-react'

// Minimum dimensions
const MIN_WIDTH = 280
const MIN_HEIGHT = 200

interface Position {
  x: number
  y: number
}

interface Size {
  width: number
  height: number
}

interface GlassCardProps {
  id: string  // Unique ID for localStorage persistence
  title: string
  icon: LucideIcon
  children: ReactNode
  onClose?: () => void
  defaultWidth?: number
  defaultHeight?: number
  className?: string
}

function loadPosition(id: string): Position | null {
  try {
    const saved = localStorage.getItem(`widget_pos_${id}`)
    if (saved) return JSON.parse(saved)
  } catch {
    // ignore
  }
  return null
}

function savePosition(id: string, pos: Position): void {
  try {
    localStorage.setItem(`widget_pos_${id}`, JSON.stringify(pos))
  } catch {
    // ignore
  }
}

function loadSize(id: string): Size | null {
  try {
    const saved = localStorage.getItem(`widget_size_${id}`)
    if (saved) return JSON.parse(saved)
  } catch {
    // ignore
  }
  return null
}

function saveSize(id: string, size: Size): void {
  try {
    localStorage.setItem(`widget_size_${id}`, JSON.stringify(size))
  } catch {
    // ignore
  }
}

export default function GlassCard({
  id,
  title,
  icon: Icon,
  children,
  onClose,
  defaultWidth = 320,
  defaultHeight = 300,
  className = ''
}: GlassCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<Position>(() => loadPosition(id) || { x: 0, y: 0 })
  const [size, setSize] = useState<Size>(() => loadSize(id) || { width: defaultWidth, height: defaultHeight })
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [initialized, setInitialized] = useState(false)

  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const resizeStart = useRef<{ width: number; height: number; x: number; y: number }>({ width: 0, height: 0, x: 0, y: 0 })

  // Initialize position if not set
  useEffect(() => {
    if (!initialized && cardRef.current) {
      const savedPos = loadPosition(id)
      if (!savedPos) {
        // Center the card initially with some offset based on id hash
        const hash = id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
        const offsetX = (hash % 3 - 1) * 180  // -180, 0, or 180
        const offsetY = (hash % 2) * 50 - 25  // -25 or 25
        const newPos = { x: offsetX, y: offsetY }
        setPosition(newPos)
        savePosition(id, newPos)
      }
      setInitialized(true)
    }
  }, [id, initialized])

  // Drag handlers
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y }
  }, [position])

  const handleDrag = useCallback((e: MouseEvent) => {
    if (!isDragging) return

    const newX = e.clientX - dragStart.current.x
    const newY = e.clientY - dragStart.current.y

    // Constrain to viewport
    const maxX = (window.innerWidth - size.width) / 2
    const maxY = (window.innerHeight - size.height) / 2

    const constrainedX = Math.max(-maxX, Math.min(maxX, newX))
    const constrainedY = Math.max(-maxY, Math.min(maxY, newY))

    setPosition({ x: constrainedX, y: constrainedY })
  }, [isDragging, size])

  const handleDragEnd = useCallback(() => {
    if (isDragging) {
      setIsDragging(false)
      savePosition(id, position)
    }
  }, [isDragging, id, position])

  // Resize handlers
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    resizeStart.current = {
      width: size.width,
      height: size.height,
      x: e.clientX,
      y: e.clientY
    }
  }, [size])

  const handleResize = useCallback((e: MouseEvent) => {
    if (!isResizing) return

    const deltaX = e.clientX - resizeStart.current.x
    const deltaY = e.clientY - resizeStart.current.y

    const newWidth = Math.max(MIN_WIDTH, resizeStart.current.width + deltaX)
    const newHeight = Math.max(MIN_HEIGHT, resizeStart.current.height + deltaY)

    // Constrain to viewport
    const maxWidth = window.innerWidth - 100
    const maxHeight = window.innerHeight - 150

    setSize({
      width: Math.min(newWidth, maxWidth),
      height: Math.min(newHeight, maxHeight)
    })
  }, [isResizing])

  const handleResizeEnd = useCallback(() => {
    if (isResizing) {
      setIsResizing(false)
      saveSize(id, size)
    }
  }, [isResizing, id, size])

  // Global mouse event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDrag)
      window.addEventListener('mouseup', handleDragEnd)
      return () => {
        window.removeEventListener('mousemove', handleDrag)
        window.removeEventListener('mouseup', handleDragEnd)
      }
    }
  }, [isDragging, handleDrag, handleDragEnd])

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResize)
      window.addEventListener('mouseup', handleResizeEnd)
      return () => {
        window.removeEventListener('mousemove', handleResize)
        window.removeEventListener('mouseup', handleResizeEnd)
      }
    }
  }, [isResizing, handleResize, handleResizeEnd])

  return (
    <div
      ref={cardRef}
      className={`absolute bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden select-none ${
        isDragging || isResizing ? 'cursor-grabbing' : ''
      } ${className}`}
      style={{
        width: size.width,
        height: size.height,
        transform: `translate(${position.x}px, ${position.y}px)`,
        zIndex: isDragging || isResizing ? 100 : 10,
      }}
    >
      {/* Header - Draggable */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-white/5 cursor-grab active:cursor-grabbing"
        onMouseDown={handleDragStart}
      >
        <div className="flex items-center gap-2">
          <GripHorizontal size={14} className="text-white/30" />
          <Icon size={16} className="text-white/60" />
          <span className="text-sm font-medium text-white/80 tracking-wide">{title}</span>
        </div>
        {onClose && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className="text-white/40 hover:text-white/80 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Content */}
      <div
        className="p-4 overflow-hidden"
        style={{ height: `calc(100% - 48px)` }}
      >
        {children}
      </div>

      {/* Resize Handle - Bottom Right */}
      <div
        className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize group"
        onMouseDown={handleResizeStart}
      >
        <svg
          className="absolute bottom-1 right-1 text-white/20 group-hover:text-white/40 transition-colors"
          width="12"
          height="12"
          viewBox="0 0 12 12"
        >
          <path
            d="M10 0L0 10M10 4L4 10M10 8L8 10"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  )
}
