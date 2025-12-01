import { useState, useEffect, useCallback } from 'react'
import { Settings, RefreshCw, User } from 'lucide-react'
import { signInWithGoogle, signOut, onAuthChange } from './services/auth'
import {
  getWallpaper,
  getNextWallpaper,
  WallpaperData,
  WallpaperCategory,
} from './services/wallpaper'
import { User as FirebaseUser } from 'firebase/auth'
import Clock from './components/Clock'
import Weather from './components/Weather'
import WeatherQuote from './components/WeatherQuote'
import SettingsModal from './components/SettingsModal'

function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [authLoading, setAuthLoading] = useState(false)
  const [wallpaper, setWallpaper] = useState<WallpaperData | null>(null)
  const [wallpaperLoading, setWallpaperLoading] = useState(true)
  const [category, setCategory] = useState<WallpaperCategory>('nature')
  const [changingWallpaper, setChangingWallpaper] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [weatherDescription, setWeatherDescription] = useState<string>('')

  const handleWeatherChange = useCallback((description: string) => {
    setWeatherDescription(description)
  }, [])

  // Load wallpaper on mount and when category changes
  useEffect(() => {
    const loadWallpaper = async () => {
      setWallpaperLoading(true)
      try {
        const data = await getWallpaper(category)
        setWallpaper(data)
      } catch (error) {
        console.error('Failed to load wallpaper:', error)
      } finally {
        setWallpaperLoading(false)
      }
    }
    loadWallpaper()
  }, [category])

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setUser(user)
    })
    return () => unsubscribe()
  }, [])

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
      const next = await getNextWallpaper(category)
      if (next) setWallpaper(next)
    } catch (error) {
      console.error('Failed to get next wallpaper:', error)
    } finally {
      setChangingWallpaper(false)
    }
  }

  const handleCategoryChange = async (newCategory: WallpaperCategory) => {
    setCategory(newCategory)
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

          {/* Weather Section */}
          <Weather onWeatherChange={handleWeatherChange} />
        </header>

        {/* --- Main Center Content --- */}
        <main className="flex flex-col items-center justify-center">
          <Clock userName={user?.displayName?.split(' ')[0]} />
          {weatherDescription && <WeatherQuote weatherDescription={weatherDescription} />}
        </main>

        {/* --- Footer --- */}
        <footer className="flex justify-between items-end">
          {/* Settings Icon - Minimal */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="text-white/70 hover:text-white transition-opacity"
          >
            <Settings size={20} />
          </button>

          {/* Bottom Center Brand */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-10 md:bottom-12 opacity-50 hover:opacity-100 transition-opacity">
            <span className="text-xs tracking-[0.2em] uppercase font-semibold">
              Horizon
            </span>
          </div>

          {/* Photo Credit & Refresh - Minimal floating text */}
          {wallpaper && (
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
          )}
        </footer>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        category={category}
        onCategoryChange={handleCategoryChange}
        isLoggedIn={!!user}
        onSignOut={handleSignOut}
      />
    </div>
  )
}

export default App
