import { useState, useEffect } from 'react'

interface WeatherData {
  temperature: number
  weatherCode: number
}

// Weather code to emoji mapping based on WMO Weather interpretation codes
// https://open-meteo.com/en/docs
function getWeatherEmoji(code: number): string {
  if (code === 0) return '☀️' // Clear sky
  if (code === 1 || code === 2 || code === 3) return '⛅' // Partly cloudy
  if (code >= 45 && code <= 48) return '🌫️' // Fog
  if (code >= 51 && code <= 55) return '🌧️' // Drizzle
  if (code >= 56 && code <= 57) return '🌧️' // Freezing drizzle
  if (code >= 61 && code <= 65) return '🌧️' // Rain
  if (code >= 66 && code <= 67) return '🌧️' // Freezing rain
  if (code >= 71 && code <= 77) return '🌨️' // Snow
  if (code >= 80 && code <= 82) return '🌧️' // Rain showers
  if (code >= 85 && code <= 86) return '🌨️' // Snow showers
  if (code === 95) return '⛈️' // Thunderstorm
  if (code >= 96 && code <= 99) return '⛈️' // Thunderstorm with hail
  return '☁️' // Default cloudy
}

function getWeatherDescription(code: number): string {
  if (code === 0) return 'Clear'
  if (code === 1) return 'Mainly Clear'
  if (code === 2) return 'Partly Cloudy'
  if (code === 3) return 'Overcast'
  if (code >= 45 && code <= 48) return 'Foggy'
  if (code >= 51 && code <= 57) return 'Drizzle'
  if (code >= 61 && code <= 67) return 'Rainy'
  if (code >= 71 && code <= 77) return 'Snowy'
  if (code >= 80 && code <= 82) return 'Showers'
  if (code >= 85 && code <= 86) return 'Snow Showers'
  if (code >= 95) return 'Thunderstorm'
  return 'Cloudy'
}

async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch weather')
  }

  const data = await response.json()
  return {
    temperature: Math.round(data.current.temperature_2m),
    weatherCode: data.current.weather_code,
  }
}

// Default location (Shanghai) as fallback
const DEFAULT_LOCATION = { latitude: 31.23, longitude: 121.47 }

function getCurrentPosition(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported, using default location')
      resolve(DEFAULT_LOCATION)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      },
      (error) => {
        console.warn('Geolocation error, using default location:', error.message)
        resolve(DEFAULT_LOCATION)
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 600000, // Cache for 10 minutes
      }
    )
  })
}

export default function Weather() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadWeather = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get user's location (or default)
        const { latitude, longitude } = await getCurrentPosition()
        console.log('Weather location:', { latitude, longitude })

        // Fetch weather data
        const data = await fetchWeather(latitude, longitude)
        setWeather(data)
        console.log('Weather data:', data)
      } catch (err) {
        console.error('Weather error:', err)
        setError('Unable to load weather')
      } finally {
        setLoading(false)
      }
    }

    loadWeather()

    // Refresh weather every 30 minutes
    const interval = setInterval(loadWeather, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="weather-container">
        <span className="weather-loading">...</span>
      </div>
    )
  }

  if (error || !weather) {
    return (
      <div className="weather-container">
        <span className="weather-error">🌡️ --°</span>
      </div>
    )
  }

  return (
    <div className="weather-container">
      <span className="weather-emoji">{getWeatherEmoji(weather.weatherCode)}</span>
      <span className="weather-temp">{weather.temperature}°C</span>
      <span className="weather-desc">{getWeatherDescription(weather.weatherCode)}</span>
    </div>
  )
}
