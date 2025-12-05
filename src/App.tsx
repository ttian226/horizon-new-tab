import { useState, useEffect, useCallback } from 'react'
import { Settings, RefreshCw, User, ListTodo, Heart, Maximize2, Minimize2 } from 'lucide-react'
import { signInWithGoogle, signOut, onAuthChange } from './services/auth'
import { getRandomWallpaper, getOrSetCurrentWallpaper, setCurrentWallpaper, WallpaperData } from './services/wallpaper'
import {
  getNickname,
  setNickname,
  isFavorited,
  addFavorite,
  removeFavorite,
  canAddFavorite,
  getUserSettings,
} from './services/firestore'
import { User as FirebaseUser } from 'firebase/auth'
import Clock, { ClockFormat } from './components/Clock'
import Weather from './components/Weather'
import WeatherQuote from './components/WeatherQuote'
import SettingsModal from './components/SettingsModal'
import TodoApp from './components/Todo/TodoApp'
import Toast from './components/Toast'

// localStorage keys
const CLOCK_FORMAT_KEY = 'horizon_clock_format'
const TODO_PINNED_KEY = 'horizon_todo_pinned'
const WORK_MODE_KEY = 'horizon_work_mode'

function loadClockFormat(): ClockFormat {
  try {
    const saved = localStorage.getItem(CLOCK_FORMAT_KEY)
    if (saved === '12h' || saved === '24h') return saved
  } catch {
    // ignore
  }
  return '24h'
}

function saveClockFormat(format: ClockFormat): void {
  try {
    localStorage.setItem(CLOCK_FORMAT_KEY, format)
  } catch {
    // ignore
  }
}

function loadTodoPinned(): boolean {
  try {
    return localStorage.getItem(TODO_PINNED_KEY) === 'true'
  } catch {
    return false
  }
}

function saveTodoPinned(pinned: boolean): void {
  try {
    localStorage.setItem(TODO_PINNED_KEY, String(pinned))
  } catch {
    // ignore
  }
}

function loadWorkMode(): boolean {
  try {
    return localStorage.getItem(WORK_MODE_KEY) === 'true'
  } catch {
    return false
  }
}

function saveWorkMode(enabled: boolean): void {
  try {
    localStorage.setItem(WORK_MODE_KEY, String(enabled))
  } catch {
    // ignore
  }
}

function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [authLoading, setAuthLoading] = useState(false)
  const [wallpaper, setWallpaper] = useState<WallpaperData | null>(null)
  const [wallpaperLoading, setWallpaperLoading] = useState(true)
  const [changingWallpaper, setChangingWallpaper] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isTodoOpen, setIsTodoOpen] = useState(false)
  const [weatherDescription, setWeatherDescription] = useState<string>('')
  const [nickname, setNicknameState] = useState<string | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null)
  const [weatherRefreshTrigger, setWeatherRefreshTrigger] = useState(0)
  const [clockFormat, setClockFormat] = useState<ClockFormat>(loadClockFormat)
  const [isTodoPinned, setIsTodoPinned] = useState(loadTodoPinned)
  const [isWorkMode, setIsWorkMode] = useState(loadWorkMode)

  const handleWeatherChange = useCallback((description: string) => {
    setWeatherDescription(description)
  }, [])

  const handleWeatherSettingsChange = useCallback(() => {
    setWeatherRefreshTrigger((prev) => prev + 1)
  }, [])

  // Load current wallpaper on mount (persistent across tabs)
  useEffect(() => {
    const loadWallpaper = async () => {
      setWallpaperLoading(true)
      try {
        // Get current wallpaper or random if none exists
        const data = await getOrSetCurrentWallpaper()
        setWallpaper(data)
      } catch (error) {
        console.error('Failed to load wallpaper:', error)
      } finally {
        setWallpaperLoading(false)
      }
    }
    loadWallpaper()
  }, [])

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setUser(user)
    })
    return () => unsubscribe()
  }, [])

  // Load nickname and clock format when user changes
  useEffect(() => {
    if (user) {
      getNickname(user.uid).then(setNicknameState).catch(console.error)
      // Sync clock format from cloud
      getUserSettings(user.uid).then((settings) => {
        if (settings.clockFormat) {
          setClockFormat(settings.clockFormat)
          saveClockFormat(settings.clockFormat)
        }
      }).catch(console.error)
      // Auto-open todo panel if pinned
      if (isTodoPinned) {
        setIsTodoOpen(true)
      }
    } else {
      setNicknameState(null)
    }
  }, [user, isTodoPinned])

  // Check if current wallpaper is favorited
  useEffect(() => {
    if (user && wallpaper?.unsplashId) {
      isFavorited(user.uid, wallpaper.unsplashId)
        .then(setIsFavorite)
        .catch(console.error)
    } else {
      setIsFavorite(false)
    }
  }, [user, wallpaper?.unsplashId])

  const handleSignIn = async () => {
    setAuthLoading(true)
    try {
      await signInWithGoogle()
    } catch (error) {
      console.error('Sign in error:', error)
    } finally {
      setAuthLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const handleNextWallpaper = async () => {
    setChangingWallpaper(true)
    try {
      const next = await getRandomWallpaper()
      if (next) {
        setWallpaper(next)
        // Save as current wallpaper for persistence across tabs
        setCurrentWallpaper(next)
      }
    } catch (error) {
      console.error('Failed to get next wallpaper:', error)
    } finally {
      setChangingWallpaper(false)
    }
  }

  const handleNicknameChange = async (newNickname: string) => {
    if (!user) return
    try {
      await setNickname(user.uid, newNickname)
      setNicknameState(newNickname)
    } catch (error) {
      console.error('Failed to save nickname:', error)
    }
  }

  const handleClockFormatChange = (format: ClockFormat) => {
    setClockFormat(format)
    saveClockFormat(format)
  }

  const handleTodoPinToggle = (pinned: boolean) => {
    setIsTodoPinned(pinned)
    saveTodoPinned(pinned)
    // If pinning, ensure todo panel is open
    if (pinned) {
      setIsTodoOpen(true)
    }
  }

  const handleTodoClose = () => {
    // Only close if not pinned
    if (!isTodoPinned) {
      setIsTodoOpen(false)
    }
  }

  const handleWorkModeToggle = () => {
    const newValue = !isWorkMode
    setIsWorkMode(newValue)
    saveWorkMode(newValue)
  }

  const handleToggleFavorite = async () => {
    if (!user || !wallpaper?.unsplashId) return

    try {
      if (isFavorite) {
        await removeFavorite(user.uid, wallpaper.unsplashId)
        setIsFavorite(false)
      } else {
        // Check if user can add more favorites (max 9)
        const canAdd = await canAddFavorite(user.uid)

        if (!canAdd) {
          setToast({ message: 'Maximum 9 favorites allowed', type: 'warning' })
          return
        }

        await addFavorite(user.uid, {
          id: wallpaper.unsplashId,
          imageUrl: wallpaper.imageUrl,
          photographer: wallpaper.photographer,
          photographerUrl: wallpaper.photographerUrl,
          photoUrl: wallpaper.photoUrl,
          category: wallpaper.category,
        })
        setIsFavorite(true)
        setToast({ message: 'Added to favorites', type: 'success' })
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
      setToast({ message: 'Failed to save, please try again', type: 'error' })
    }
  }

  // Handle setting wallpaper (from favorites or other sources)
  // Also save to localStorage for persistence across tabs
  const handleSetWallpaper = (wallpaper: WallpaperData) => {
    setWallpaper(wallpaper)
    setCurrentWallpaper(wallpaper)
  }

  return (
    <div className="relative w-full h-screen overflow-hidden text-white font-sans-display selection:bg-white/30">
      {/* Background Image */}
      {wallpaper && (
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
          style={{ backgroundImage: `url(${wallpaper.imageUrl})` }}
        />
      )}

      {/* Vignette & Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/40 pointer-events-none" />

      {/* Noise texture for cinematic feel */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E')]" />

      {/* Loading overlay */}
      {wallpaperLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
          <div className="text-white/70 text-lg">Loading...</div>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="relative z-10 grid grid-rows-[auto_1fr_auto] h-full p-8 md:p-12">
        {/* --- Top Header --- */}
        <header className="flex justify-between items-start">
          {/* User Avatar - Floating minimal style */}
          <div>
            {user ? (
              <div className="p-1 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/15 hover:scale-105 transition-all duration-300 cursor-pointer">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="avatar"
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                    <User size={18} className="text-white" />
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                disabled={authLoading}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all disabled:opacity-50 shadow-lg"
              >
                <User size={18} className="text-white/80" />
              </button>
            )}
          </div>

          {/* Weather Section - Reduced opacity in work mode */}
          <div className={`transition-opacity duration-500 ease-in-out ${isWorkMode ? 'opacity-50 hover:opacity-100' : 'opacity-100'}`}>
            <Weather
              onWeatherChange={handleWeatherChange}
              userId={user?.uid || null}
              refreshTrigger={weatherRefreshTrigger}
            />
          </div>
        </header>

        {/* --- Main Center Content --- */}
        <main className={`flex flex-col transition-all duration-700 ease-in-out ${
          isWorkMode
            ? 'items-end justify-end -mb-6 pr-4'
            : 'items-center justify-center'
        }`}>
          <Clock
            userName={user?.displayName?.split(' ')[0]}
            nickname={nickname}
            onNicknameChange={user ? handleNicknameChange : undefined}
            clockFormat={clockFormat}
            isWorkMode={isWorkMode}
          />
          {/* Quote with fixed spacing to prevent layout shift - Hidden in work mode */}
          <div className={`mt-6 transition-all duration-500 ease-in-out ${
            isWorkMode ? 'opacity-0 h-0 mt-0 overflow-hidden pointer-events-none' : 'opacity-100'
          }`}>
            <WeatherQuote weatherDescription={weatherDescription} />
          </div>
        </main>

        {/* --- Footer --- */}
        <footer className="flex justify-between items-end">
          {/* Bottom Control Hub - Left */}
          <div className="relative flex items-end gap-5">
            {/* Settings Icon */}
            <button
              onClick={() => {
                setIsSettingsOpen(true)
                setIsTodoOpen(false)
              }}
              className="text-white/70 hover:text-white transition-opacity"
            >
              <Settings size={20} />
            </button>

            {/* Focus/Work Mode Toggle */}
            <button
              onClick={handleWorkModeToggle}
              className={`transition-all duration-300 ${
                isWorkMode ? 'text-blue-400 hover:text-blue-300' : 'text-white/70 hover:text-white'
              }`}
              title={isWorkMode ? 'Exit focus mode' : 'Enter focus mode'}
            >
              {isWorkMode ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>

            {/* Todo Icon - Only show when logged in */}
            {user && (
              <button
                onClick={() => {
                  if (isTodoPinned && isTodoOpen) {
                    // If pinned and open, unpin and close
                    handleTodoPinToggle(false)
                    setIsTodoOpen(false)
                  } else {
                    setIsTodoOpen(!isTodoOpen)
                  }
                  setIsSettingsOpen(false)
                }}
                className={`transition-opacity ${
                  isTodoPinned ? 'text-blue-400 hover:text-blue-300' : 'text-white/70 hover:text-white'
                }`}
              >
                <ListTodo size={20} />
              </button>
            )}

            {/* Todo Panel - positioned relative to control hub */}
            {user && (
              <TodoApp
                userId={user.uid}
                isOpen={isTodoOpen}
                isPinned={isTodoPinned}
                onPinToggle={handleTodoPinToggle}
                onToggle={() => setIsTodoOpen(false)}
              />
            )}
          </div>

          {/* Bottom Center Brand */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-10 md:bottom-12 opacity-50 hover:opacity-100 transition-opacity">
            <span className="text-xs tracking-[0.2em] uppercase font-semibold">
              Horizon
            </span>
          </div>

          {/* Right side: Favorite + Photo Credit */}
          {wallpaper && (
            <div className="flex items-center gap-3">
              {/* Favorite Heart - Only show when logged in */}
              {user && (
                <button
                  onClick={handleToggleFavorite}
                  className="transition-all duration-300 hover:scale-110 active:scale-90"
                  title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Heart
                    size={16}
                    strokeWidth={1.5}
                    className={`transition-all duration-500 ${
                      isFavorite
                        ? 'fill-white/50 text-white/50 drop-shadow-[0_0_8px_rgba(251,113,133,0.5)]'
                        : 'fill-transparent text-white/50 hover:text-white/70'
                    }`}
                  />
                </button>
              )}

              {/* Photo Credit */}
              <button
                onClick={handleNextWallpaper}
                disabled={changingWallpaper}
                className="group flex items-center gap-2 text-xs text-white font-light font-clock cursor-pointer transition-all hover:opacity-100 opacity-70 disabled:opacity-40"
                style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
              >
                <RefreshCw
                  size={12}
                  className={`transition-transform group-hover:rotate-180 duration-300 ${changingWallpaper ? 'animate-spin' : ''}`}
                />
                <span className="group-hover:underline underline-offset-2">
                  Photo by {wallpaper.photographer} / Unsplash
                </span>
              </button>
            </div>
          )}
        </footer>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={user}
        onSignOut={handleSignOut}
        onSetWallpaper={handleSetWallpaper}
        onWeatherSettingsChange={handleWeatherSettingsChange}
        clockFormat={clockFormat}
        onClockFormatChange={handleClockFormatChange}
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}

export default App
