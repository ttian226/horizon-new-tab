import { useState, useEffect, useRef } from 'react'
import { CloudSun, Cloud, Sun, CloudRain, CloudSnow, CloudLightning, CloudFog, MapPin, Search } from 'lucide-react'
import { getUserSettings, updateWeatherSettings, type WeatherSettings as FirestoreWeatherSettings, type TemperatureUnit } from '../services/firestore'

interface WeatherData {
  temperature: number
  weatherCode: number
  city: string
}

interface WeatherSettings {
  isAuto: boolean
  lat: number
  lon: number
  cityName: string
  unit: TemperatureUnit
}

// Smart default: US users get Fahrenheit, others get Celsius
function getDefaultUnit(): TemperatureUnit {
  const lang = navigator.language || 'en'
  return lang === 'en-US' ? 'imperial' : 'metric'
}

// Convert Celsius to Fahrenheit
function celsiusToFahrenheit(celsius: number): number {
  return Math.round((celsius * 9/5) + 32)
}

const SETTINGS_KEY = 'horizon_weather_settings'
const DEFAULT_LOCATION = { lat: 31.23, lon: 121.47, cityName: 'Shanghai' }

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

// Load settings from localStorage
function loadSettings(): WeatherSettings {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      // Ensure unit exists (for backward compatibility)
      return {
        ...parsed,
        unit: parsed.unit || getDefaultUnit()
      }
    }
  } catch {
    // ignore
  }
  return { isAuto: true, ...DEFAULT_LOCATION, unit: getDefaultUnit() }
}

// Save settings to localStorage
function saveSettings(settings: WeatherSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch {
    // ignore
  }
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
    return cityName.replace(/\s*(City|District|County|Prefecture)$/i, '').trim()
  } catch {
    return 'Unknown'
  }
}

// Search city using Open-Meteo Geocoding API
async function searchCity(query: string): Promise<{ lat: number; lon: number; name: string } | null> {
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`
    const response = await fetch(url)
    if (!response.ok) return null
    const data = await response.json()
    if (data.results && data.results.length > 0) {
      const result = data.results[0]
      return {
        lat: result.latitude,
        lon: result.longitude,
        name: result.name + (result.country ? `, ${result.country_code}` : '')
      }
    }
    return null
  } catch {
    return null
  }
}

async function fetchWeather(lat: number, lon: number, cityName?: string): Promise<WeatherData> {
  const weatherResponse = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`
  )

  if (!weatherResponse.ok) throw new Error('Failed to fetch weather')
  const data = await weatherResponse.json()

  // Use provided cityName or fetch it
  const city = cityName || await getCityName(lat, lon)

  return {
    temperature: Math.round(data.current.temperature_2m),
    weatherCode: data.current.weather_code,
    city,
  }
}

function getCurrentPosition(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ latitude: DEFAULT_LOCATION.lat, longitude: DEFAULT_LOCATION.lon })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      },
      () => resolve({ latitude: DEFAULT_LOCATION.lat, longitude: DEFAULT_LOCATION.lon }),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 600000 }
    )
  })
}

interface WeatherProps {
  onWeatherChange?: (description: string) => void
  userId?: string | null // User ID for Firestore sync
  refreshTrigger?: number // External trigger to reload settings
}

export default function Weather({ onWeatherChange, userId, refreshTrigger }: WeatherProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [settings, setSettings] = useState<WeatherSettings>(loadSettings)
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [synced, setSynced] = useState(false) // Track if cloud settings loaded
  const panelRef = useRef<HTMLDivElement>(null)

  // Load weather based on settings
  const loadWeather = async (currentSettings: WeatherSettings) => {
    try {
      setLoading(true)
      let lat: number, lon: number, cityName: string | undefined

      if (currentSettings.isAuto) {
        const pos = await getCurrentPosition()
        lat = pos.latitude
        lon = pos.longitude
        cityName = undefined // Will fetch from reverse geocoding
      } else {
        lat = currentSettings.lat
        lon = currentSettings.lon
        cityName = currentSettings.cityName
      }

      const data = await fetchWeather(lat, lon, cityName)
      setWeather(data)

      // Update settings with actual city name if auto
      if (currentSettings.isAuto && data.city !== currentSettings.cityName) {
        const newSettings = { ...currentSettings, lat, lon, cityName: data.city }
        setSettings(newSettings)
        saveSettings(newSettings)

        // Sync to Firestore in background if user is logged in
        if (userId) {
          const firestoreSettings: FirestoreWeatherSettings = {
            auto: newSettings.isAuto,
            lat: newSettings.lat,
            lon: newSettings.lon,
            cityName: newSettings.cityName,
            unit: newSettings.unit,
          }
          updateWeatherSettings(userId, firestoreSettings).catch((err) =>
            console.error('Failed to sync weather settings to cloud:', err)
          )
        }
      }

      const description = getWeatherDescription(data.weatherCode)
      onWeatherChange?.(description)
    } catch (err) {
      console.error('Weather error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Initial load: Local First - load from localStorage immediately
  useEffect(() => {
    loadWeather(settings)
    const interval = setInterval(() => loadWeather(settings), 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Cloud Sync: Background sync with Firestore when user is logged in
  useEffect(() => {
    if (!userId || synced) return

    const syncWithCloud = async () => {
      try {
        const userSettings = await getUserSettings(userId)
        const cloudWeather = userSettings.weather

        // Convert Firestore format to local format
        const cloudSettings: WeatherSettings = {
          isAuto: cloudWeather.auto,
          lat: cloudWeather.lat,
          lon: cloudWeather.lon,
          cityName: cloudWeather.cityName,
          unit: cloudWeather.unit || getDefaultUnit(),
        }

        // Compare with local settings - if different, use cloud settings
        const localSettings = loadSettings()
        const isDifferent =
          localSettings.isAuto !== cloudSettings.isAuto ||
          localSettings.lat !== cloudSettings.lat ||
          localSettings.lon !== cloudSettings.lon ||
          localSettings.cityName !== cloudSettings.cityName ||
          localSettings.unit !== cloudSettings.unit

        if (isDifferent) {
          // Cloud settings are different, update local
          saveSettings(cloudSettings)
          setSettings(cloudSettings)
          await loadWeather(cloudSettings)
        }

        setSynced(true)
      } catch (err) {
        console.error('Failed to sync weather settings:', err)
        setSynced(true) // Mark as synced to avoid retry loops
      }
    }

    syncWithCloud()
  }, [userId, synced]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reload settings when external trigger changes (from SettingsModal)
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      const updatedSettings = loadSettings()
      setSettings(updatedSettings)
      loadWeather(updatedSettings)
    }
  }, [refreshTrigger]) // eslint-disable-line react-hooks/exhaustive-deps

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Toggle auto location
  const handleToggleAuto = async () => {
    const newIsAuto = !settings.isAuto
    const newSettings = { ...settings, isAuto: newIsAuto }
    setSettings(newSettings)
    saveSettings(newSettings) // Save to localStorage immediately

    // Sync to Firestore in background if user is logged in
    if (userId) {
      const firestoreSettings: FirestoreWeatherSettings = {
        auto: newSettings.isAuto,
        lat: newSettings.lat,
        lon: newSettings.lon,
        cityName: newSettings.cityName,
        unit: newSettings.unit,
      }
      updateWeatherSettings(userId, firestoreSettings).catch((err) =>
        console.error('Failed to sync weather settings to cloud:', err)
      )
    }

    if (newIsAuto) {
      await loadWeather(newSettings)
    }
  }

  // Toggle temperature unit
  const handleToggleUnit = () => {
    const newUnit: TemperatureUnit = settings.unit === 'metric' ? 'imperial' : 'metric'
    const newSettings = { ...settings, unit: newUnit }
    setSettings(newSettings)
    saveSettings(newSettings)

    // Sync to Firestore in background if user is logged in
    if (userId) {
      const firestoreSettings: FirestoreWeatherSettings = {
        auto: newSettings.isAuto,
        lat: newSettings.lat,
        lon: newSettings.lon,
        cityName: newSettings.cityName,
        unit: newUnit,
      }
      updateWeatherSettings(userId, firestoreSettings).catch((err) =>
        console.error('Failed to sync weather settings to cloud:', err)
      )
    }
  }

  // Search city
  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setSearching(true)
    try {
      const result = await searchCity(searchQuery.trim())
      if (result) {
        const newSettings: WeatherSettings = {
          isAuto: false,
          lat: result.lat,
          lon: result.lon,
          cityName: result.name
        }
        setSettings(newSettings)
        saveSettings(newSettings) // Save to localStorage immediately
        setSearchQuery('')
        await loadWeather(newSettings)

        // Sync to Firestore in background if user is logged in
        if (userId) {
          const firestoreSettings: FirestoreWeatherSettings = {
            auto: false,
            lat: result.lat,
            lon: result.lon,
            cityName: result.name,
            unit: settings.unit,
          }
          updateWeatherSettings(userId, firestoreSettings).catch((err) =>
            console.error('Failed to sync weather settings to cloud:', err)
          )
        }
      }
    } finally {
      setSearching(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  // Get display temperature based on unit
  const displayTemp = weather
    ? (settings.unit === 'imperial' ? celsiusToFahrenheit(weather.temperature) : weather.temperature)
    : null
  const unitSymbol = settings.unit === 'imperial' ? '°F' : '°C'

  if (loading && !weather) {
    return (
      <div className="flex flex-col items-end text-right px-3 py-2 -mr-3 -mt-2">
        <div className="flex items-center gap-2 text-white/60">
          <CloudSun size={20} />
          <span className="text-lg font-medium">--{unitSymbol}</span>
        </div>
        {/* Placeholder for city name to prevent layout shift */}
        <span className="text-xs text-white/40 font-medium tracking-wide uppercase mt-1">
          Loading...
        </span>
      </div>
    )
  }

  if (!weather) return null

  const WeatherIcon = getWeatherIcon(weather.weatherCode)

  return (
    <div className="relative" ref={panelRef}>
      {/* Weather Display - Clickable */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex flex-col items-end text-right rounded-lg px-3 py-2 -mr-3 -mt-2 hover:bg-white/10 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2 text-white/90">
          <WeatherIcon size={20} />
          <span className="text-lg font-medium">{displayTemp}{unitSymbol}</span>
        </div>
        <span className="text-xs text-white/60 font-medium tracking-wide uppercase mt-1">
          {weather.city}
        </span>
      </button>

      {/* Settings Panel */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-modal-content">
          {/* Header */}
          <div className="p-4 border-b border-white/5">
            <h3 className="text-sm font-medium text-white/90">Weather Settings</h3>
          </div>

          {/* Temperature Unit Toggle */}
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/80">Temperature</span>
              <div className="flex bg-white/10 rounded-lg p-0.5">
                <button
                  onClick={() => {
                    if (settings.unit !== 'metric') handleToggleUnit()
                  }}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    settings.unit === 'metric'
                      ? 'bg-white/20 text-white'
                      : 'text-white/50 hover:text-white/70'
                  }`}
                >
                  °C
                </button>
                <button
                  onClick={() => {
                    if (settings.unit !== 'imperial') handleToggleUnit()
                  }}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    settings.unit === 'imperial'
                      ? 'bg-white/20 text-white'
                      : 'text-white/50 hover:text-white/70'
                  }`}
                >
                  °F
                </button>
              </div>
            </div>
          </div>

          {/* Auto Location Toggle */}
          <div className="p-4 border-b border-white/5">
            <button
              onClick={handleToggleAuto}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-white/60" />
                <span className="text-sm text-white/80">Auto Location</span>
              </div>
              <div
                className={`w-10 h-6 rounded-full transition-colors ${
                  settings.isAuto ? 'bg-blue-500' : 'bg-white/20'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white mt-1 transition-transform ${
                    settings.isAuto ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </div>
            </button>
          </div>

          {/* Manual City Search - Only show when auto is off */}
          {!settings.isAuto && (
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                <Search size={14} className="text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter city name..."
                  className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none"
                />
                <button
                  onClick={handleSearch}
                  disabled={searching || !searchQuery.trim()}
                  className="text-xs text-white/60 hover:text-white disabled:opacity-40 transition-colors"
                >
                  {searching ? '...' : 'Go'}
                </button>
              </div>
            </div>
          )}

          {/* Current Location Display */}
          <div className="p-4">
            <div className="text-xs text-white/40 mb-1">Current Location</div>
            <div className="text-sm text-white/80">{weather.city}</div>
          </div>
        </div>
      )}
    </div>
  )
}
