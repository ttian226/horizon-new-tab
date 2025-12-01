import { useState, useEffect } from 'react'
import { CloudSun, Cloud, Sun, CloudRain, CloudSnow, CloudLightning, CloudFog } from 'lucide-react'

interface WeatherData {
  temperature: number
  weatherCode: number
  city: string
}

function getWeatherIcon(code: number) {
  if (code === 0) return Sun
  if (code >= 1 && code <= 3) return CloudSun
  if (code >= 45 && code <= 48) return CloudFog
  if (code >= 51 && code <= 67) return CloudRain
  if (code >= 71 && code <= 86) return CloudSnow
  if (code >= 95) return CloudLightning
  return Cloud
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

// Reverse geocoding to get city name
async function getCityName(lat: number, lon: number): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`
    const response = await fetch(url, {
      headers: { 'User-Agent': 'HorizonNewTab/1.0' }
    })
    if (!response.ok) return 'Unknown'
    const data = await response.json()
    const cityName = data.address?.city || data.address?.town || data.address?.village || data.address?.county || 'Unknown'
    // Remove trailing "City", "District", etc.
    return cityName.replace(/\s*(City|District|County|Prefecture)$/i, '').trim()
  } catch {
    return 'Unknown'
  }
}

async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const [weatherResponse, city] = await Promise.all([
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`),
    getCityName(lat, lon)
  ])

  if (!weatherResponse.ok) throw new Error('Failed to fetch weather')
  const data = await weatherResponse.json()

  return {
    temperature: Math.round(data.current.temperature_2m),
    weatherCode: data.current.weather_code,
    city,
  }
}

const DEFAULT_LOCATION = { latitude: 31.23, longitude: 121.47 }

function getCurrentPosition(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
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
      () => resolve(DEFAULT_LOCATION),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 600000 }
    )
  })
}

interface WeatherProps {
  onWeatherChange?: (description: string) => void
}

export default function Weather({ onWeatherChange }: WeatherProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadWeather = async () => {
      try {
        setLoading(true)
        const { latitude, longitude } = await getCurrentPosition()
        const data = await fetchWeather(latitude, longitude)
        setWeather(data)
        // Notify parent of weather description
        const description = getWeatherDescription(data.weatherCode)
        onWeatherChange?.(description)
      } catch (err) {
        console.error('Weather error:', err)
      } finally {
        setLoading(false)
      }
    }

    loadWeather()
    const interval = setInterval(loadWeather, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [onWeatherChange])

  if (loading) {
    return (
      <div className="flex flex-col items-end text-right">
        <div className="flex items-center gap-2 text-white/60">
          <CloudSun size={20} />
          <span className="text-lg font-medium">--°C</span>
        </div>
      </div>
    )
  }

  if (!weather) return null

  const WeatherIcon = getWeatherIcon(weather.weatherCode)

  return (
    <div className="flex flex-col items-end text-right">
      <div className="flex items-center gap-2 text-white/90">
        <WeatherIcon size={20} />
        <span className="text-lg font-medium">{weather.temperature}°C</span>
      </div>
      <span className="text-xs text-white/60 font-medium tracking-wide uppercase mt-1">
        {weather.city}
      </span>
    </div>
  )
}
