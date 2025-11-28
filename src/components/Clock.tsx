import { useState, useEffect } from 'react'

interface ClockProps {
  userName?: string
}

function getGreeting(hour: number): string {
  if (hour >= 5 && hour < 12) {
    return 'Good Morning'
  } else if (hour >= 12 && hour < 17) {
    return 'Good Afternoon'
  } else if (hour >= 17 && hour < 21) {
    return 'Good Evening'
  } else {
    return 'Good Night'
  }
}

function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

export default function Clock({ userName }: ClockProps) {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    // Update time every minute
    const timer = setInterval(() => {
      setTime(new Date())
    }, 60000)

    // Sync to the start of the next minute
    const now = new Date()
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds()

    const syncTimer = setTimeout(() => {
      setTime(new Date())
    }, msUntilNextMinute)

    return () => {
      clearInterval(timer)
      clearTimeout(syncTimer)
    }
  }, [])

  const greeting = getGreeting(time.getHours())
  const displayName = userName || 'there'

  return (
    <div className="clock-container">
      <div className="clock-time">{formatTime(time)}</div>
      <div className="clock-greeting">
        {greeting}, {displayName}
      </div>
    </div>
  )
}
