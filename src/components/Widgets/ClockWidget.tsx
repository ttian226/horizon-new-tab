import { useState, useEffect } from 'react'
import { Clock } from '@phosphor-icons/react'
import GlassCard from './GlassCard'

type ClockFormat = '12h' | '24h'

interface ClockWidgetProps {
  clockFormat?: ClockFormat
  onClose?: () => void
}

function formatTime(date: Date, format: ClockFormat): { time: string; period?: string } {
  if (format === '12h') {
    const timeStr = date.toLocaleTimeString('en-US', {
      hour12: true,
      hour: 'numeric',
      minute: '2-digit',
    })
    const match = timeStr.match(/^(.+?)\s*(AM|PM)$/i)
    if (match) {
      return { time: match[1], period: match[2].toUpperCase() }
    }
    return { time: timeStr }
  }
  return {
    time: date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    })
  }
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

export default function ClockWidget({ clockFormat = '24h', onClose }: ClockWidgetProps) {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formattedTime = formatTime(time, clockFormat)
  const formattedDate = formatDate(time)

  return (
    <GlassCard title="Clock" icon={Clock} onClose={onClose}>
      <div className="text-center py-2">
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-4xl font-clock text-white/90 tracking-tight">
            {formattedTime.time}
          </span>
          {formattedTime.period && (
            <span className="text-lg font-clock text-white/50">
              {formattedTime.period}
            </span>
          )}
        </div>
        <p className="text-sm text-white/50 mt-2">{formattedDate}</p>
      </div>
    </GlassCard>
  )
}
