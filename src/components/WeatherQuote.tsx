import { useState, useEffect } from 'react'

interface WeatherQuoteProps {
  weatherDescription: string
}

const CLOUD_FUNCTION_URL =
  'https://us-central1-horizon-30aa6.cloudfunctions.net/getWeatherQuote'

const CACHE_KEY = 'horizon_weather_quote'

interface CachedQuote {
  quote: string
  weather: string
  date: string
}

// Fallback quotes for different weather types
const FALLBACK_QUOTES: Record<string, string> = {
  Clear: 'Let the sunshine warm your soul and brighten your path.',
  Sunny: 'Golden rays remind us that light always returns.',
  Cloudy: 'Behind every cloud, the sun waits with endless patience.',
  Rainy: 'Rain washes the world clean, preparing it for new beginnings.',
  Snowy: 'Snowflakes are whispers from the sky, each one unique.',
  Foggy: 'In the mist, we find the beauty of mystery.',
  default: 'Every weather brings its own kind of beauty.',
}

function getFallbackQuote(weather: string): string {
  const key = Object.keys(FALLBACK_QUOTES).find((k) =>
    weather.toLowerCase().includes(k.toLowerCase())
  )
  return FALLBACK_QUOTES[key || 'default']
}

export default function WeatherQuote({ weatherDescription }: WeatherQuoteProps) {
  const [quote, setQuote] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!weatherDescription) return

    const fetchQuote = async () => {
      const today = new Date().toDateString()

      // Check cache first
      try {
        const cached = localStorage.getItem(CACHE_KEY)
        if (cached) {
          const data: CachedQuote = JSON.parse(cached)
          // Use cache if same day and similar weather
          if (
            data.date === today &&
            data.weather.toLowerCase() === weatherDescription.toLowerCase()
          ) {
            setQuote(data.quote)
            setLoading(false)
            return
          }
        }
      } catch {
        // Cache read failed, continue to fetch
      }

      // Fetch from Cloud Function
      try {
        const url = `${CLOUD_FUNCTION_URL}?weatherDescription=${encodeURIComponent(weatherDescription)}`
        const response = await fetch(url)

        if (!response.ok) {
          throw new Error('Failed to fetch quote')
        }

        const data = await response.json()

        if (data.success && data.quote) {
          setQuote(data.quote)
          // Save to cache
          const cacheData: CachedQuote = {
            quote: data.quote,
            weather: weatherDescription,
            date: today,
          }
          localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
        } else {
          throw new Error('Invalid response')
        }
      } catch (error) {
        console.error('Failed to fetch weather quote:', error)
        // Use fallback quote
        setQuote(getFallbackQuote(weatherDescription))
      } finally {
        setLoading(false)
      }
    }

    fetchQuote()
  }, [weatherDescription])

  if (loading || !quote) {
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
