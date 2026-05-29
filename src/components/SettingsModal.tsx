import { useState, useEffect } from 'react'
import { X, Settings, Heart, User, MapPin, Search, Trash2, Clock, Database, Info } from 'lucide-react'
import { User as FirebaseUser } from 'firebase/auth'
import { subscribeFavorites, removeFavorite, FavoriteWallpaper, updateWeatherSettings, updateClockFormat, type WeatherSettings as FirestoreWeatherSettings } from '../services/firestore'
import { WallpaperData, getThumbnailUrl } from '../services/wallpaper'
import {
  loadConfig as loadNotionConfig,
  saveConfig as saveNotionConfig,
  clearConfig as clearNotionConfig,
  testConnection as testNotionConnection,
  DEFAULT_VIEW_SETTINGS,
  type NotionViewSettings,
} from '../services/notion'
import { ClockFormat } from './Clock'

type TabType = 'general' | 'favorites' | 'account' | 'notion'

// Empty by default — each user pastes their own database ID. Never ship a
// real (personal) database ID as the default.
const DEFAULT_NOTION_DATABASE_ID = ''

interface WeatherSettings {
  isAuto: boolean
  lat: number
  lon: number
  cityName: string
}

const SETTINGS_KEY = 'horizon_weather_settings'
const DEFAULT_LOCATION = { lat: 31.23, lon: 121.47, cityName: 'Shanghai' }

function loadWeatherSettings(): WeatherSettings {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch {
    // ignore
  }
  return { isAuto: true, ...DEFAULT_LOCATION }
}

function saveWeatherSettings(settings: WeatherSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch {
    // ignore
  }
}

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

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  user: FirebaseUser | null
  onSignOut: () => void
  onSetWallpaper: (wallpaper: WallpaperData) => void
  onWeatherSettingsChange?: () => void
  clockFormat: ClockFormat
  onClockFormatChange: (format: ClockFormat) => void
}

export default function SettingsModal({
  isOpen,
  onClose,
  user,
  onSignOut,
  onSetWallpaper,
  onWeatherSettingsChange,
  clockFormat,
  onClockFormatChange,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('general')
  const [favorites, setFavorites] = useState<FavoriteWallpaper[]>([])
  const [weatherSettings, setWeatherSettings] = useState<WeatherSettings>(loadWeatherSettings)
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  // Notion tab state
  const [notionToken, setNotionToken] = useState('')
  const [notionDatabaseId, setNotionDatabaseId] = useState(DEFAULT_NOTION_DATABASE_ID)
  const [notionStatus, setNotionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [notionMessage, setNotionMessage] = useState('')
  const [notionConfigured, setNotionConfigured] = useState(false)
  const [showNotionHelp, setShowNotionHelp] = useState(false)
  const [notionView, setNotionView] = useState<NotionViewSettings>(DEFAULT_VIEW_SETTINGS)

  // Subscribe to favorites when user is logged in and modal is open
  useEffect(() => {
    if (!isOpen || !user) {
      setFavorites([])
      return
    }

    const unsubscribe = subscribeFavorites(user.uid, setFavorites)
    return () => unsubscribe()
  }, [isOpen, user])

  // Reset to general tab and reload weather settings when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab('general')
      setWeatherSettings(loadWeatherSettings())
    }
  }, [isOpen])

  // Load existing Notion config on modal open
  useEffect(() => {
    if (!isOpen) return
    loadNotionConfig().then((config) => {
      if (config) {
        setNotionToken(config.token)
        setNotionDatabaseId(config.databaseId)
        setNotionView(config.view ?? DEFAULT_VIEW_SETTINGS)
        setNotionConfigured(true)
        setNotionStatus('success')
        setNotionMessage('Connected')
      } else {
        setNotionToken('')
        setNotionDatabaseId(DEFAULT_NOTION_DATABASE_ID)
        setNotionView(DEFAULT_VIEW_SETTINGS)
        setNotionConfigured(false)
        setNotionStatus('idle')
        setNotionMessage('')
      }
    })
  }, [isOpen])

  const handleNotionTest = async () => {
    if (!notionToken || !notionDatabaseId) {
      setNotionStatus('error')
      setNotionMessage('Both token and database ID are required')
      return
    }
    setNotionStatus('testing')
    setNotionMessage('')
    const result = await testNotionConnection({ token: notionToken, databaseId: notionDatabaseId })
    if (result.ok) {
      setNotionStatus('success')
      setNotionMessage(`Connection OK${result.taskCount !== undefined ? ` — ${result.taskCount} task${result.taskCount === 1 ? '' : 's'} fetched` : ''}`)
    } else {
      setNotionStatus('error')
      setNotionMessage(result.error || 'Connection failed')
    }
  }

  const handleNotionSave = async () => {
    if (!notionToken || !notionDatabaseId) return
    await saveNotionConfig({ token: notionToken, databaseId: notionDatabaseId, view: notionView })
    setNotionConfigured(true)
    setNotionStatus('success')
    setNotionMessage('Saved')
  }

  const handleNotionDisconnect = async () => {
    await clearNotionConfig()
    setNotionToken('')
    setNotionDatabaseId(DEFAULT_NOTION_DATABASE_ID)
    setNotionView(DEFAULT_VIEW_SETTINGS)
    setNotionConfigured(false)
    setNotionStatus('idle')
    setNotionMessage('')
  }

  // View toggles persist immediately once connected (no re-Save needed) — the
  // open new-tab page picks the change up via onConfigChange and re-fetches.
  const updateNotionView = (patch: Partial<NotionViewSettings>) => {
    const next = { ...notionView, ...patch }
    setNotionView(next)
    if (notionConfigured && notionToken && notionDatabaseId) {
      saveNotionConfig({ token: notionToken, databaseId: notionDatabaseId, view: next }).catch(
        (err) => console.error('Failed to save Notion view settings:', err)
      )
    }
  }

  const handleToggleAuto = () => {
    const newSettings = { ...weatherSettings, isAuto: !weatherSettings.isAuto }
    setWeatherSettings(newSettings)
    saveWeatherSettings(newSettings)

    // Sync to Firestore if user is logged in
    if (user) {
      const firestoreSettings: FirestoreWeatherSettings = {
        auto: newSettings.isAuto,
        lat: newSettings.lat,
        lon: newSettings.lon,
        cityName: newSettings.cityName,
      }
      updateWeatherSettings(user.uid, firestoreSettings).catch((err) =>
        console.error('Failed to sync weather settings to cloud:', err)
      )
    }

    onWeatherSettingsChange?.()
  }

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
        setWeatherSettings(newSettings)
        saveWeatherSettings(newSettings)
        setSearchQuery('')

        // Sync to Firestore if user is logged in
        if (user) {
          const firestoreSettings: FirestoreWeatherSettings = {
            auto: false,
            lat: result.lat,
            lon: result.lon,
            cityName: result.name,
          }
          updateWeatherSettings(user.uid, firestoreSettings).catch((err) =>
            console.error('Failed to sync weather settings to cloud:', err)
          )
        }

        onWeatherSettingsChange?.()
      }
    } finally {
      setSearching(false)
    }
  }

  const handleToggleClockFormat = () => {
    const newFormat: ClockFormat = clockFormat === '24h' ? '12h' : '24h'
    onClockFormatChange(newFormat)

    // Sync to Firestore if user is logged in
    if (user) {
      updateClockFormat(user.uid, newFormat).catch((err) =>
        console.error('Failed to sync clock format to cloud:', err)
      )
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleSelectFavorite = (fav: FavoriteWallpaper) => {
    const wallpaperData: WallpaperData = {
      imageUrl: fav.imageUrl,
      photographer: fav.photographer,
      photographerUrl: fav.photographerUrl,
      photoUrl: fav.photoUrl,
      category: fav.category,
      unsplashId: fav.id,
    }
    onSetWallpaper(wallpaperData)
    onClose()
  }

  const handleRemoveFavorite = async (e: React.MouseEvent, favId: string) => {
    e.stopPropagation()
    if (!user) return
    try {
      await removeFavorite(user.uid, favId)
    } catch (error) {
      console.error('Failed to remove favorite:', error)
    }
  }

  if (!isOpen) return null

  const tabs: { id: TabType; icon: typeof Settings; label: string }[] = [
    { id: 'general', icon: Settings, label: 'General' },
    { id: 'favorites', icon: Heart, label: 'Favorites' },
    { id: 'notion', icon: Database, label: 'Notion' },
    { id: 'account', icon: User, label: 'Account' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-modal-backdrop">
      <div className="relative w-[500px] h-[380px] mx-4 bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl animate-modal-content flex overflow-hidden">
        {/* Left Navigation */}
        <nav className="w-[60px] border-r border-white/10 flex flex-col items-center py-6 gap-2">
          {tabs.map(({ id, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                activeTab === id
                  ? 'bg-white/15 text-white'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5'
              }`}
              title={id.charAt(0).toUpperCase() + id.slice(1)}
            >
              <Icon size={20} />
            </button>
          ))}
        </nav>

        {/* Right Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <h3 className="text-lg font-medium text-white">
              {activeTab === 'general' && 'General'}
              {activeTab === 'favorites' && 'Favorites'}
              {activeTab === 'notion' && 'Notion'}
              {activeTab === 'account' && 'Account'}
            </h3>
            <button
              onClick={onClose}
              className="text-white/40 hover:text-white transition-colors p-1"
            >
              <X size={20} />
            </button>
          </header>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="space-y-4">
                <div className="text-sm text-white/50 mb-4">Weather Location</div>

                {/* Auto Location Toggle */}
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <MapPin size={18} className="text-white/60" />
                    <span className="text-sm text-white/80">Auto Location</span>
                  </div>
                  <button
                    onClick={handleToggleAuto}
                    className={`w-11 h-6 rounded-full transition-colors ${
                      weatherSettings.isAuto ? 'bg-blue-500' : 'bg-white/20'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        weatherSettings.isAuto ? 'translate-x-[22px]' : 'translate-x-[2px]'
                      }`}
                    />
                  </button>
                </div>

                {/* Manual City Search */}
                {!weatherSettings.isAuto && (
                  <div className="flex items-center gap-2 bg-white/5 rounded-xl px-4 py-3">
                    <Search size={16} className="text-white/40" />
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
                      className="text-xs text-white/60 hover:text-white disabled:opacity-40 transition-colors px-2 py-1"
                    >
                      {searching ? '...' : 'Search'}
                    </button>
                  </div>
                )}

                {/* Current Location */}
                <div className="pt-2">
                  <div className="text-xs text-white/40 mb-1">Current Location</div>
                  <div className="text-sm text-white/80">{weatherSettings.cityName}</div>
                </div>

                {/* Divider */}
                <div className="border-t border-white/10 my-4" />

                {/* Clock Settings */}
                <div className="text-sm text-white/50 mb-4">Clock</div>

                {/* 12/24 Hour Toggle */}
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <Clock size={18} className="text-white/60" />
                    <span className="text-sm text-white/80">24-Hour Format</span>
                  </div>
                  <button
                    onClick={handleToggleClockFormat}
                    className={`w-11 h-6 rounded-full transition-colors ${
                      clockFormat === '24h' ? 'bg-blue-500' : 'bg-white/20'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        clockFormat === '24h' ? 'translate-x-[22px]' : 'translate-x-[2px]'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* Favorites Tab */}
            {activeTab === 'favorites' && (
              <div>
                {!user ? (
                  <div className="flex items-center justify-center h-48 text-white/40 text-sm">
                    Sign in to save favorites
                  </div>
                ) : favorites.length === 0 ? (
                  <div className="flex items-center justify-center h-48 text-white/40 text-sm">
                    No favorites yet
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {favorites.map((fav) => (
                      <button
                        key={fav.id}
                        onClick={() => handleSelectFavorite(fav)}
                        className="group relative aspect-[16/10] rounded-xl overflow-hidden hover:ring-2 hover:ring-white/30 transition-all"
                      >
                        <img
                          src={getThumbnailUrl(fav.imageUrl)}
                          alt={fav.photographer}
                          className="w-full h-full object-cover"
                        />
                        {/* Hover overlay with delete button */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            onClick={(e) => handleRemoveFavorite(e, fav.id)}
                            className="p-2 rounded-full bg-black/50 hover:bg-red-500/80 transition-colors"
                            title="Remove from favorites"
                          >
                            <Trash2 size={16} className="text-white" />
                          </button>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Notion Tab */}
            {activeTab === 'notion' && (
              <div className="space-y-4">
                <div className="flex items-start gap-2">
                  <p className="flex-1 text-xs text-white/40 leading-relaxed">
                    Pull tasks from your Notion database into the Todo widget. Token is stored locally on this device only — it is never synced to Firestore.
                  </p>
                  <button
                    onClick={() => setShowNotionHelp((v) => !v)}
                    className={`shrink-0 mt-0.5 transition-colors ${
                      showNotionHelp ? 'text-white/80' : 'text-white/40 hover:text-white/70'
                    }`}
                    title="How to set up"
                  >
                    <Info size={15} />
                  </button>
                </div>

                {showNotionHelp && (
                  <div className="bg-white/[0.03] border border-white/10 rounded-lg p-3 space-y-2 text-[11px] text-white/55 leading-relaxed">
                    <p className="text-white/70 font-medium">How to connect Notion</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Create an integration at <span className="text-white/75">notion.so/my-integrations</span> (type: Internal). Copy its token — starts with <span className="font-mono text-white/75">ntn_</span>.</li>
                      <li>Open your Tasks database in Notion → <span className="text-white/75">•••</span> → <span className="text-white/75">Connections</span> → add your integration.</li>
                      <li>Database ID = the 32-character string in the DB's URL, before <span className="font-mono text-white/75">?v=</span>.</li>
                      <li>Paste both above → <span className="text-white/75">Test</span> → <span className="text-white/75">Save</span>.</li>
                    </ol>
                    <p className="pt-1 border-t border-white/5">
                      <span className="text-white/70">Required columns:</span> Name (title), Status (with "Not done" / "Done"), Due date (date).
                    </p>
                    <p className="text-white/40">
                      One-click Notion login (OAuth) is planned for a future version — for now this manual setup is needed.
                    </p>
                  </div>
                )}

                {/* Token */}
                <div>
                  <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1.5 block">
                    Integration Token
                  </label>
                  <input
                    type="password"
                    value={notionToken}
                    onChange={(e) => setNotionToken(e.target.value)}
                    placeholder="ntn_..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-white/30 transition-colors"
                  />
                </div>

                {/* Database ID */}
                <div>
                  <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1.5 block">
                    Database ID
                  </label>
                  <input
                    type="text"
                    value={notionDatabaseId}
                    onChange={(e) => setNotionDatabaseId(e.target.value)}
                    placeholder="32-character ID from your database URL"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder-white/20 outline-none focus:border-white/30 transition-colors"
                  />
                </div>

                {/* Status / message */}
                {notionMessage && (
                  <div
                    className={`text-xs ${
                      notionStatus === 'success'
                        ? 'text-emerald-400'
                        : notionStatus === 'error'
                          ? 'text-red-400'
                          : 'text-white/60'
                    }`}
                  >
                    {notionStatus === 'testing' ? 'Testing…' : notionMessage}
                  </div>
                )}

                {/* Action row */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleNotionTest}
                    disabled={notionStatus === 'testing' || !notionToken || !notionDatabaseId}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-white/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {notionStatus === 'testing' ? 'Testing…' : 'Test'}
                  </button>
                  <button
                    onClick={handleNotionSave}
                    disabled={!notionToken || !notionDatabaseId}
                    className="px-3 py-1.5 bg-emerald-600/80 hover:bg-emerald-500 rounded-lg text-xs text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Save
                  </button>
                  {notionConfigured && (
                    <button
                      onClick={handleNotionDisconnect}
                      className="ml-auto text-xs text-white/40 hover:text-red-400 transition-colors"
                    >
                      Disconnect
                    </button>
                  )}
                </div>

                {/* View — filter + sort, only meaningful once connected */}
                {notionConfigured && (
                  <div className="pt-3 mt-1 border-t border-white/10 space-y-3">
                    <div className="text-[10px] text-white/40 uppercase tracking-wider">View</div>
                    <ToggleRow
                      label="Show completed tasks"
                      checked={notionView.showCompleted}
                      onChange={(v) => updateNotionView({ showCompleted: v })}
                    />
                    <ToggleRow
                      label="Show overdue tasks"
                      checked={notionView.showOverdue}
                      onChange={(v) => updateNotionView({ showOverdue: v })}
                    />
                    <ToggleRow
                      label="Show due dates"
                      checked={notionView.showDates}
                      onChange={(v) => updateNotionView({ showDates: v })}
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white/70 flex-1">Sort by</span>
                      <select
                        value={notionView.sortBy}
                        onChange={(e) =>
                          updateNotionView({ sortBy: e.target.value as NotionViewSettings['sortBy'] })
                        }
                        className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-white/30 [&>option]:text-black"
                      >
                        <option value="due">Due date</option>
                        <option value="edited">Last edited</option>
                        <option value="created">Created</option>
                      </select>
                      <select
                        value={notionView.sortOrder}
                        onChange={(e) =>
                          updateNotionView({ sortOrder: e.target.value as NotionViewSettings['sortOrder'] })
                        }
                        className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-white/30 [&>option]:text-black"
                      >
                        <option value="asc">Asc</option>
                        <option value="desc">Desc</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Account Tab */}
            {activeTab === 'account' && (
              <div className="flex flex-col h-full">
                {!user ? (
                  <div className="flex items-center justify-center h-48 text-white/40 text-sm">
                    Sign in to view account
                  </div>
                ) : (
                  <>
                    {/* Profile Section */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-1 rounded-full bg-white/5 border border-white/10">
                        {user.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt="avatar"
                            className="w-16 h-16 rounded-full"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                            <User size={28} className="text-white" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-lg text-white font-medium">
                          {user.displayName || 'User'}
                        </div>
                        <div className="text-sm text-white/50">{user.email}</div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="space-y-3 mb-auto">
                      <div className="flex items-center justify-between py-2 border-b border-white/5">
                        <span className="text-sm text-white/60">Favorites</span>
                        <span className="text-sm text-white/80">{favorites.length}</span>
                      </div>
                      {user.metadata.creationTime && (
                        <div className="flex items-center justify-between py-2 border-b border-white/5">
                          <span className="text-sm text-white/60">Joined</span>
                          <span className="text-sm text-white/80">
                            {new Date(user.metadata.creationTime).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                            })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Sign Out Button */}
                    <button
                      onClick={() => {
                        onSignOut()
                        onClose()
                      }}
                      className="mt-6 w-full py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium transition-colors"
                    >
                      Sign Out
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-white/70">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`w-11 h-6 rounded-full transition-colors ${
          checked ? 'bg-blue-500' : 'bg-white/20'
        }`}
      >
        <div
          className={`w-5 h-5 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-[22px]' : 'translate-x-[2px]'
          }`}
        />
      </button>
    </div>
  )
}
