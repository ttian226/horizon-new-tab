import { useState, useEffect } from 'react'
import { signInWithGoogle, signOut, onAuthChange } from './services/auth'
import {
  getWallpaper,
  WallpaperData,
  WallpaperCategory,
  WALLPAPER_CATEGORIES,
} from './services/wallpaper'
import { User } from 'firebase/auth'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [wallpaper, setWallpaper] = useState<WallpaperData | null>(null)
  const [wallpaperLoading, setWallpaperLoading] = useState(true)
  const [category, setCategory] = useState<WallpaperCategory>('nature')

  // Load wallpaper on mount and when category changes
  useEffect(() => {
    const loadWallpaper = async () => {
      setWallpaperLoading(true)
      try {
        const data = await getWallpaper(category)
        setWallpaper(data)
        console.log('Wallpaper loaded:', data)
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
      if (user) {
        console.log('User signed in:', {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        })
      }
    })
    return () => unsubscribe()
  }, [])

  const handleSignIn = async () => {
    setLoading(true)
    try {
      const user = await signInWithGoogle()
      console.log('Sign in successful:', user)
    } catch (error) {
      console.error('Sign in error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      console.log('Sign out successful')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  // Background style with wallpaper
  const backgroundStyle = wallpaper
    ? {
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url(${wallpaper.imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : {}

  return (
    <div className="app" style={backgroundStyle}>
      {wallpaperLoading && <div className="loading">Loading...</div>}

      <h1>Horizon</h1>

      {/* Category selector */}
      <div className="category-selector">
        {WALLPAPER_CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`category-btn ${category === cat ? 'active' : ''}`}
            onClick={() => setCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {user ? (
        <div className="user-info">
          <img
            src={user.photoURL || ''}
            alt="avatar"
            style={{ width: 48, height: 48, borderRadius: '50%' }}
          />
          <p>Welcome, {user.displayName}</p>
          <p style={{ fontSize: '12px', opacity: 0.7 }}>{user.email}</p>
          <button onClick={handleSignOut}>Sign Out</button>
        </div>
      ) : (
        <button onClick={handleSignIn} disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in with Google'}
        </button>
      )}

      {/* Photo credit (required by Unsplash) */}
      {wallpaper && (
        <div className="photo-credit">
          Photo by{' '}
          <a href={wallpaper.photographerUrl} target="_blank" rel="noopener noreferrer">
            {wallpaper.photographer}
          </a>{' '}
          on{' '}
          <a href={wallpaper.photoUrl} target="_blank" rel="noopener noreferrer">
            Unsplash
          </a>
        </div>
      )}
    </div>
  )
}

export default App
