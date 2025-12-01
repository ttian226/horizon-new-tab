import { useState, useEffect } from 'react'
import { Settings, RefreshCw, Camera, User } from 'lucide-react'
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
import SettingsModal from './components/SettingsModal'

function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [authLoading, setAuthLoading] = useState(false)
  const [wallpaper, setWallpaper] = useState<WallpaperData | null>(null)
  const [wallpaperLoading, setWallpaperLoading] = useState(true)
  const [category, setCategory] = useState<WallpaperCategory>('nature')
  const [changingWallpaper, setChangingWallpaper] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

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
          {/* User Section */}
          <div className="flex items-center gap-4">
            {user ? (
              <div
                onClick={handleSignOut}
                className="flex items-center gap-3 backdrop-blur-md bg-black/20 border border-white/10 rounded-full pl-2 pr-5 py-2 hover:bg-black/30 transition-colors cursor-pointer group"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="avatar"
                    className="w-8 h-8 rounded-full shadow-lg"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                    <User size={16} className="text-white" />
                  </div>
                )}
                <span className="text-sm font-medium text-white/90 group-hover:text-white transition-colors">
                  Sign Out
                </span>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                disabled={authLoading}
                className="flex items-center gap-3 backdrop-blur-md bg-black/20 border border-white/10 rounded-full pl-2 pr-5 py-2 hover:bg-black/30 transition-colors cursor-pointer group disabled:opacity-50"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                  <User size={16} className="text-white" />
                </div>
                <span className="text-sm font-medium text-white/90 group-hover:text-white transition-colors">
                  {authLoading ? 'Signing in...' : 'Sign In'}
                </span>
              </button>
            )}
          </div>

          {/* Weather Section */}
          <Weather />
        </header>

        {/* --- Main Center Content --- */}
        <main className="flex flex-col items-center justify-center">
          <Clock userName={user?.displayName?.split(' ')[0]} />
        </main>

        {/* --- Footer --- */}
        <footer className="flex justify-between items-end">
          {/* Customize Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600/90 hover:bg-indigo-500 text-white rounded-full shadow-lg shadow-indigo-900/30 transition-all hover:scale-105 active:scale-95 text-sm font-medium backdrop-blur-sm border border-indigo-400/30"
          >
            <Settings size={16} />
            <span>Customize</span>
          </button>

          {/* Bottom Center Brand */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-10 md:bottom-12 opacity-50 hover:opacity-100 transition-opacity">
            <span className="text-xs tracking-[0.2em] uppercase font-semibold">
              Horizon
            </span>
          </div>

          {/* Photo Credit & Actions */}
          <div className="flex flex-col items-end gap-4">
            {/* Refresh button */}
            <button
              onClick={handleNextWallpaper}
              disabled={changingWallpaper}
              className="p-2.5 rounded-full bg-black/20 hover:bg-white/10 backdrop-blur-sm text-white/70 hover:text-white transition-all border border-transparent hover:border-white/20 disabled:opacity-50"
            >
              <RefreshCw size={18} className={changingWallpaper ? 'animate-spin' : ''} />
            </button>

            {/* Photo credit */}
            {wallpaper && (
              <div className="flex items-center gap-2 text-xs text-white/50 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5">
                <Camera size={12} />
                <span>
                  Photo by{' '}
                  <a
                    href={wallpaper.photographerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white/80 transition-colors"
                  >
                    {wallpaper.photographer}
                  </a>
                  {' / '}
                  <a
                    href={wallpaper.photoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white/80 transition-colors"
                  >
                    Unsplash
                  </a>
                </span>
              </div>
            )}
          </div>
        </footer>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        category={category}
        onCategoryChange={handleCategoryChange}
      />
    </div>
  )
}

export default App
