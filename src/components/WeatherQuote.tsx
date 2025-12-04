import { useState, useEffect } from 'react'

interface WeatherQuoteProps {
  weatherDescription: string
}

// Weather-based quotes collection
const WEATHER_QUOTES: Record<string, string[]> = {
  Clear: [
    'Let the sunshine warm your soul and brighten your path.',
    'Clear skies invite endless possibilities.',
    'Sunshine is the best medicine for the soul.',
    'A clear day is a gift wrapped in blue sky.',
  ],
  Sunny: [
    'Golden rays remind us that light always returns.',
    'Embrace the warmth of this beautiful day.',
    'Let the sun inspire your brightest ideas.',
    'Sunny days are made for dreaming big.',
  ],
  Cloudy: [
    'Behind every cloud, the sun waits with endless patience.',
    'Soft clouds paint stories across the sky.',
    'Even cloudy days hold hidden beauty.',
    'The sky speaks in shades of gray today.',
  ],
  Overcast: [
    'Gray skies create the perfect canvas for reflection.',
    'Overcast days invite us to look inward.',
    'Find peace in the quiet of a clouded sky.',
  ],
  Rainy: [
    'Rain washes the world clean, preparing it for new beginnings.',
    'Let the rain remind you that growth needs storms.',
    'Dancing raindrops write poetry on windows.',
    'After rain, the world sparkles anew.',
  ],
  Drizzle: [
    'Gentle drops whisper secrets to the earth.',
    "A soft drizzle is nature's lullaby.",
  ],
  Snowy: [
    'Snowflakes are whispers from the sky, each one unique.',
    'Snow transforms the world into a peaceful dream.',
    "Winter's blanket covers the world in wonder.",
  ],
  Foggy: [
    'In the mist, we find the beauty of mystery.',
    'Fog invites us to slow down and wonder.',
    'Mystery awaits in the gentle embrace of fog.',
  ],
  Thunderstorm: [
    "Storms remind us of nature's magnificent power.",
    'Thunder speaks, and the world listens.',
    'Even storms pass, leaving clearer skies behind.',
  ],
  default: [
    'Every weather brings its own kind of beauty.',
    "Nature's mood paints today's atmosphere.",
    'The sky tells a different story each day.',
  ],
}

function getQuoteForWeather(weather: string): string {
  // Find matching weather category
  const key = Object.keys(WEATHER_QUOTES).find((k) =>
    weather.toLowerCase().includes(k.toLowerCase())
  )
  const quotes = WEATHER_QUOTES[key || 'default']
  // Return a random quote from the matching category
  return quotes[Math.floor(Math.random() * quotes.length)]
}

export default function WeatherQuote({ weatherDescription }: WeatherQuoteProps) {
  const [quote, setQuote] = useState<string | null>(null)

  useEffect(() => {
    if (!weatherDescription) return
    // Use local quotes directly (no API call needed)
    setQuote(getQuoteForWeather(weatherDescription))
  }, [weatherDescription])

  if (!quote) {
    return null
  }

  return (
    <p
      className="mt-6 text-base md:text-lg font-serif-elegant italic text-white/60 max-w-lg text-center leading-relaxed"
      style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
    >
      "{quote}"
    </p>
  )
}
