// Wallpaper Service - Reads wallpapers from Firestore
// Wallpapers are updated hourly by Cloud Function

import { collection, doc, getDoc, getDocs } from 'firebase/firestore'
import { db } from '../config/firebase'

// Available wallpaper categories
export const WALLPAPER_CATEGORIES = ['nature', 'architecture', 'minimalist', 'technology'] as const
export type WallpaperCategory = (typeof WALLPAPER_CATEGORIES)[number]

export interface WallpaperData {
  category: WallpaperCategory
  imageUrl: string
  fullUrl: string
  photographer: string
  photographerUrl: string
  photoUrl: string
  unsplashId: string
  createdAt?: Date
}

const CACHE_KEY = 'horizon_wallpaper'
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour (matches Cloud Function schedule)

interface CachedWallpaper extends WallpaperData {
  cachedAt: number
}

// Get wallpaper from local cache
function getCachedWallpaper(category: WallpaperCategory): WallpaperData | null {
  try {
    const cached = localStorage.getItem(`${CACHE_KEY}_${category}`)
    if (!cached) return null

    const data: CachedWallpaper = JSON.parse(cached)
    const now = Date.now()

    // Check if cache is still valid (1 hour)
    if (data.cachedAt && now - data.cachedAt < CACHE_DURATION) {
      return data
    }

    return null
  } catch {
    return null
  }
}

// Save wallpaper to local cache
function cacheWallpaper(data: WallpaperData): void {
  try {
    const cacheData: CachedWallpaper = { ...data, cachedAt: Date.now() }
    localStorage.setItem(`${CACHE_KEY}_${data.category}`, JSON.stringify(cacheData))
  } catch (error) {
    console.error('Failed to cache wallpaper:', error)
  }
}

// Fetch wallpaper from Firestore
async function fetchWallpaperFromFirestore(category: WallpaperCategory): Promise<WallpaperData | null> {
  try {
    const docRef = doc(db, 'wallpapers', category)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const data = docSnap.data() as WallpaperData
      cacheWallpaper(data)
      return data
    }

    console.warn(`No wallpaper found for category: ${category}`)
    return null
  } catch (error) {
    console.error('Failed to fetch wallpaper from Firestore:', error)
    return null
  }
}

// Get all wallpapers from Firestore
export async function getAllWallpapers(): Promise<WallpaperData[]> {
  try {
    const wallpapersRef = collection(db, 'wallpapers')
    const snapshot = await getDocs(wallpapersRef)
    return snapshot.docs.map((doc) => doc.data() as WallpaperData)
  } catch (error) {
    console.error('Failed to fetch all wallpapers:', error)
    return []
  }
}

// Main function: Get wallpaper by category (from cache or Firestore)
export async function getWallpaper(
  category: WallpaperCategory = 'nature',
  forceRefresh = false
): Promise<WallpaperData | null> {
  // Try cache first (unless force refresh)
  if (!forceRefresh) {
    const cached = getCachedWallpaper(category)
    if (cached) {
      console.log(`Using cached wallpaper for ${category}:`, cached.unsplashId)
      return cached
    }
  }

  // Fetch from Firestore
  console.log(`Fetching ${category} wallpaper from Firestore...`)
  return fetchWallpaperFromFirestore(category)
}

// Get random wallpaper from any category
export async function getRandomWallpaper(): Promise<WallpaperData | null> {
  const randomCategory = WALLPAPER_CATEGORIES[
    Math.floor(Math.random() * WALLPAPER_CATEGORIES.length)
  ]
  return getWallpaper(randomCategory)
}
