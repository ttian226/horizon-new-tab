import { useState, useEffect } from 'react'

interface ClockProps {
  userName?: string
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

export default function Clock({ userName }: ClockProps) {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const greeting = getGreeting(time.getHours())
  const displayName = userName || 'there'

  return (
    <div className="text-center select-none">
      {/* Time: Montserrat, elegant and refined */}
      <h1 className="text-[8rem] md:text-[11rem] leading-none font-normal tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 drop-shadow-2xl font-clock">
        {formatTime(time)}
      </h1>

      {/* Greeting: Elegant Serif */}
      <h2 className="mt-4 text-2xl md:text-3xl font-serif-elegant italic text-white/80 drop-shadow-md font-normal">
        {greeting}, {displayName}
      </h2>
    </div>
  )
}
