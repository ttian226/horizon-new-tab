import { ReactNode, useState, useRef, useEffect, useCallback } from 'react'
import { X, DotsSixVertical, Icon as PhosphorIcon } from '@phosphor-icons/react'

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
  icon: PhosphorIcon
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
        // Set default position based on widget id
        // todo: center-left, notes: center-right
        // Widget width is ~320px, so offset by ~200px to avoid overlap
        let offsetX = 0
        let offsetY = 0

        if (id === 'todo') {
          offsetX = -200  // Left of center
          offsetY = 0
        } else if (id === 'notes') {
          offsetX = 200   // Right of center
          offsetY = 0
        } else {
          // Other widgets: slight random offset
          const hash = id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
          offsetX = (hash % 3 - 1) * 200
          offsetY = (hash % 2) * 50 - 25
        }

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

    // Boundaries
    const padding = 20
    const dockMargin = 100  // Left side Dock area + extra spacing
    const halfWidth = size.width / 2
    const halfHeight = size.height / 2

    // Calculate bounds: widget can move until its edge hits the boundary
    // Left boundary: account for Dock width + spacing
    const minX = -window.innerWidth / 2 + halfWidth + dockMargin
    const maxX = window.innerWidth / 2 - halfWidth - padding
    const minY = -window.innerHeight / 2 + halfHeight + padding
    const maxY = window.innerHeight / 2 - halfHeight - padding

    const constrainedX = Math.max(minX, Math.min(maxX, newX))
    const constrainedY = Math.max(minY, Math.min(maxY, newY))

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
      className={`fixed bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden select-none ${
        isDragging || isResizing ? 'cursor-grabbing' : ''
      } ${className}`}
      style={{
        width: size.width,
        height: size.height,
        left: '50%',
        top: '50%',
        transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
        zIndex: isDragging || isResizing ? 100 : 10,
      }}
    >
      {/* Header - Draggable */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-white/5 cursor-grab active:cursor-grabbing"
        onMouseDown={handleDragStart}
      >
        <div className="flex items-center gap-2">
          <DotsSixVertical size={14} weight="bold" className="text-white/30" />
          <Icon size={16} weight="duotone" className="text-white/60" />
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
            <X size={14} weight="bold" />
          </button>
        )}
      </div>

      {/* Content */}
      <div
        className="p-4 overflow-hidden flex flex-col"
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
