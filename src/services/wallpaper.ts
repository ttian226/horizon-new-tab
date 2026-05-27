// Wallpaper Service - Reads wallpapers from Firestore
// Wallpapers are updated hourly by Cloud Function
// Fetches from all categories and returns random wallpaper

import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '../config/firebase'

// All wallpaper categories (synced with Cloud Function)
const CATEGORIES = ['nature', 'travel', 'architecture', 'earth'] as const

export interface WallpaperData {
  category: string
  imageUrl: string
  fullUrl: string
  photographer: string
  photographerUrl: string
  photoUrl: string
  unsplashId: string
  createdAt?: Date
}

const CACHE_KEY = 'horizon_all_wallpapers'
const CURRENT_WALLPAPER_KEY = 'horizon_current_wallpaper'
const NEXT_WALLPAPER_KEY = 'horizon_next_wallpaper'
const CURRENT_WALLPAPER_MAX_AGE = 60 * 60 * 1000 // 1 hour — auto-rotate after this

interface CachedWallpapers {
  wallpapers: WallpaperData[]
  cachedAt: number
}

interface CurrentWallpaper {
  wallpaper: WallpaperData
  setAt: number
}

// Get cached wallpapers
function getCachedWallpapers(): WallpaperData[] | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return null

    const data: CachedWallpapers = JSON.parse(cached)
    // Cache for 1 hour
    if (Date.now() - data.cachedAt < 60 * 60 * 1000) {
      return data.wallpapers
    }
    return null
  } catch {
    return null
  }
}

// Save wallpapers to cache
function cacheWallpapers(wallpapers: WallpaperData[]): void {
  try {
    const data: CachedWallpapers = { wallpapers, cachedAt: Date.now() }
    localStorage.setItem(CACHE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('Failed to cache wallpapers:', error)
  }
}

// Fetch all wallpapers from all categories
async function fetchAllWallpapers(): Promise<WallpaperData[]> {
  try {
    const allWallpapers: WallpaperData[] = []

    // Fetch from all categories in parallel
    const fetchPromises = CATEGORIES.map(async (category) => {
      const photosRef = collection(db, 'wallpapers', category, 'photos')
      const q = query(photosRef, orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)
      return snapshot.docs.map((doc) => doc.data() as WallpaperData)
    })

    const results = await Promise.all(fetchPromises)
    results.forEach((wallpapers) => allWallpapers.push(...wallpapers))

    if (allWallpapers.length > 0) {
      cacheWallpapers(allWallpapers)
    }

    console.log(`Fetched ${allWallpapers.length} wallpapers from all categories`)
    return allWallpapers
  } catch (error) {
    console.error('Failed to fetch wallpapers from Firestore:', error)
    return []
  }
}

// Get all wallpapers (from cache or Firestore)
export async function getAllWallpapers(): Promise<WallpaperData[]> {
  // Try cache first
  const cached = getCachedWallpapers()
  if (cached && cached.length > 0) {
    console.log(`Using ${cached.length} cached wallpapers`)
    return cached
  }

  // Fetch from Firestore
  console.log('Fetching wallpapers from Firestore...')
  return fetchAllWallpapers()
}

// Get a random wallpaper from all categories. If excludeUnsplashId is given,
// avoid returning that one (so consecutive rotations / preloads always pick a
// different image). Falls back to the full pool when filtering would empty it.
export async function getRandomWallpaper(excludeUnsplashId?: string): Promise<WallpaperData | null> {
  const wallpapers = await getAllWallpapers()

  if (wallpapers.length === 0) {
    console.warn('No wallpapers found')
    return null
  }

  let pool = wallpapers
  if (excludeUnsplashId) {
    const filtered = wallpapers.filter((w) => w.unsplashId !== excludeUnsplashId)
    if (filtered.length > 0) pool = filtered
  }

  const randomIndex = Math.floor(Math.random() * pool.length)
  return pool[randomIndex]
}

// Get wallpaper count
export async function getWallpaperCount(): Promise<number> {
  const wallpapers = await getAllWallpapers()
  return wallpapers.length
}

// ============ Current Wallpaper (Persistent across tabs) ============

// Get current wallpaper from localStorage (ignores freshness — raw read)
export function getCurrentWallpaper(): WallpaperData | null {
  try {
    const cached = localStorage.getItem(CURRENT_WALLPAPER_KEY)
    if (!cached) return null

    const data: CurrentWallpaper = JSON.parse(cached)
    return data.wallpaper
  } catch {
    return null
  }
}

// Read the timestamp at which the current wallpaper was set
function getCurrentWallpaperAge(): number | null {
  try {
    const cached = localStorage.getItem(CURRENT_WALLPAPER_KEY)
    if (!cached) return null
    const data: CurrentWallpaper = JSON.parse(cached)
    return Date.now() - data.setAt
  } catch {
    return null
  }
}

// Save current wallpaper to localStorage
export function setCurrentWallpaper(wallpaper: WallpaperData): void {
  try {
    const data: CurrentWallpaper = {
      wallpaper,
      setAt: Date.now(),
    }
    localStorage.setItem(CURRENT_WALLPAPER_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('Failed to save current wallpaper:', error)
  }
}

// Get current wallpaper, or pick a new random one if missing/stale.
// Stale = saved more than CURRENT_WALLPAPER_MAX_AGE ago. Within the freshness
// window every new tab reuses the same wallpaper (multi-tab consistency).
// When rotating, prefer the preloaded next wallpaper if one was prepared by a
// previous tab session — its image is already in the browser HTTP cache.
export async function getOrSetCurrentWallpaper(): Promise<WallpaperData | null> {
  const current = getCurrentWallpaper()
  const age = getCurrentWallpaperAge()

  if (current && age !== null && age < CURRENT_WALLPAPER_MAX_AGE) {
    console.log(`Using saved current wallpaper (age ${Math.round(age / 60000)}m)`)
    return current
  }

  const preloaded = getPreloadedNextWallpaper()
  if (preloaded) {
    console.log('Rotating to preloaded next wallpaper (cache-warm)')
    clearPreloadedNextWallpaper()
    setCurrentWallpaper(preloaded)
    return preloaded
  }

  console.log(current ? 'Current wallpaper expired, rotating' : 'No current wallpaper, getting random')
  const random = await getRandomWallpaper(current?.unsplashId)
  if (random) {
    setCurrentWallpaper(random)
  }
  return random
}

// ============ Preloaded Next Wallpaper ============
// Persisted across tabs so a tab that opens after rotation can pick up the
// wallpaper that a previous tab already warmed into the browser HTTP cache.

export function getPreloadedNextWallpaper(): WallpaperData | null {
  try {
    const cached = localStorage.getItem(NEXT_WALLPAPER_KEY)
    if (!cached) return null
    return JSON.parse(cached) as WallpaperData
  } catch {
    return null
  }
}

export function savePreloadedNextWallpaper(wallpaper: WallpaperData): void {
  try {
    localStorage.setItem(NEXT_WALLPAPER_KEY, JSON.stringify(wallpaper))
  } catch (error) {
    console.error('Failed to save preloaded next wallpaper:', error)
  }
}

export function clearPreloadedNextWallpaper(): void {
  try {
    localStorage.removeItem(NEXT_WALLPAPER_KEY)
  } catch {
    // ignore
  }
}

// Convert wallpaper URL to thumbnail (for settings panel, favorites grid, etc.)
// Reduces 4K (3840x2160) to small thumbnail (400px width)
export function getThumbnailUrl(imageUrl: string): string {
  return imageUrl
    .replace(/w=\d+/, 'w=400')
    .replace(/h=\d+/, 'h=225')
    .replace(/q=\d+/, 'q=70')
}
