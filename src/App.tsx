import { useState, useEffect, useCallback } from 'react'
import { Settings, RefreshCw, User, ListTodo, Heart } from 'lucide-react'
import { signInWithGoogle, signOut, onAuthChange } from './services/auth'
import { getRandomWallpaper, WallpaperData } from './services/wallpaper'
import {
  getNickname,
  setNickname,
  isFavorited,
  addFavorite,
  removeFavorite,
} from './services/firestore'
import { User as FirebaseUser } from 'firebase/auth'
import Clock from './components/Clock'
import Weather from './components/Weather'
import WeatherQuote from './components/WeatherQuote'
import SettingsModal from './components/SettingsModal'
import TodoApp from './components/Todo/TodoApp'

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

  const handleWeatherChange = useCallback((description: string) => {
    setWeatherDescription(description)
  }, [])

  // Load random wallpaper on mount
  useEffect(() => {
    const loadWallpaper = async () => {
      setWallpaperLoading(true)
      try {
        const data = await getRandomWallpaper()
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

  // Load nickname when user changes
  useEffect(() => {
    if (user) {
      getNickname(user.uid).then(setNicknameState).catch(console.error)
    } else {
      setNicknameState(null)
    }
  }, [user])

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
      if (next) setWallpaper(next)
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

  const handleToggleFavorite = async () => {
    if (!user || !wallpaper?.unsplashId) return

    try {
      if (isFavorite) {
        await removeFavorite(user.uid, wallpaper.unsplashId)
        setIsFavorite(false)
      } else {
        await addFavorite(user.uid, {
          id: wallpaper.unsplashId,
          imageUrl: wallpaper.imageUrl,
          photographer: wallpaper.photographer,
          photographerUrl: wallpaper.photographerUrl,
          photoUrl: wallpaper.photoUrl,
          category: wallpaper.category,
        })
        setIsFavorite(true)
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    }
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
          <Clock
            userName={user?.displayName?.split(' ')[0]}
            nickname={nickname}
            onNicknameChange={user ? handleNicknameChange : undefined}
          />
          {weatherDescription && <WeatherQuote weatherDescription={weatherDescription} />}
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

            {/* Todo Icon - Only show when logged in */}
            {user && (
              <button
                onClick={() => {
                  setIsTodoOpen(!isTodoOpen)
                  setIsSettingsOpen(false)
                }}
                className="text-white/70 hover:text-white transition-opacity"
              >
                <ListTodo size={20} />
              </button>
            )}

            {/* Todo Panel - positioned relative to control hub */}
            {user && (
              <TodoApp
                userId={user.uid}
                isOpen={isTodoOpen}
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
        isLoggedIn={!!user}
        onSignOut={handleSignOut}
      />
    </div>
  )
}

export default App
