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

interface CachedWallpapers {
  wallpapers: WallpaperData[]
  cachedAt: number
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

// Get a random wallpaper from all categories
export async function getRandomWallpaper(): Promise<WallpaperData | null> {
  const wallpapers = await getAllWallpapers()

  if (wallpapers.length === 0) {
    console.warn('No wallpapers found')
    return null
  }

  const randomIndex = Math.floor(Math.random() * wallpapers.length)
  console.log(`Random wallpaper: ${randomIndex + 1}/${wallpapers.length}`)
  return wallpapers[randomIndex]
}

// Get wallpaper count
export async function getWallpaperCount(): Promise<number> {
  const wallpapers = await getAllWallpapers()
  return wallpapers.length
}
