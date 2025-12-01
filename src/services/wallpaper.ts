// Wallpaper Service - Reads wallpapers from Firestore
// Wallpapers are updated hourly by Cloud Function
// Each category has multiple photos stored in subcollection

import { collection, getDocs, query, orderBy } from 'firebase/firestore'
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

const CACHE_KEY = 'horizon_wallpapers'
const CURRENT_KEY = 'horizon_current_wallpaper'

interface CachedWallpapers {
  category: WallpaperCategory
  wallpapers: WallpaperData[]
  cachedAt: number
}

// Get cached wallpapers for a category
function getCachedWallpapers(category: WallpaperCategory): WallpaperData[] | null {
  try {
    const cached = localStorage.getItem(`${CACHE_KEY}_${category}`)
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
function cacheWallpapers(category: WallpaperCategory, wallpapers: WallpaperData[]): void {
  try {
    const data: CachedWallpapers = { category, wallpapers, cachedAt: Date.now() }
    localStorage.setItem(`${CACHE_KEY}_${category}`, JSON.stringify(data))
  } catch (error) {
    console.error('Failed to cache wallpapers:', error)
  }
}

// Get current wallpaper index for category
function getCurrentIndex(category: WallpaperCategory): number {
  try {
    const data = localStorage.getItem(`${CURRENT_KEY}_${category}`)
    return data ? parseInt(data, 10) : 0
  } catch {
    return 0
  }
}

// Save current wallpaper index
function setCurrentIndex(category: WallpaperCategory, index: number): void {
  try {
    localStorage.setItem(`${CURRENT_KEY}_${category}`, index.toString())
  } catch (error) {
    console.error('Failed to save current index:', error)
  }
}

// Fetch all wallpapers for a category from Firestore
async function fetchWallpapersFromFirestore(category: WallpaperCategory): Promise<WallpaperData[]> {
  try {
    const photosRef = collection(db, 'wallpapers', category, 'photos')
    const q = query(photosRef, orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)

    const wallpapers = snapshot.docs.map((doc) => doc.data() as WallpaperData)

    if (wallpapers.length > 0) {
      cacheWallpapers(category, wallpapers)
    }

    return wallpapers
  } catch (error) {
    console.error('Failed to fetch wallpapers from Firestore:', error)
    return []
  }
}

// Get all wallpapers for a category (from cache or Firestore)
export async function getWallpapers(category: WallpaperCategory): Promise<WallpaperData[]> {
  // Try cache first
  const cached = getCachedWallpapers(category)
  if (cached && cached.length > 0) {
    console.log(`Using ${cached.length} cached wallpapers for ${category}`)
    return cached
  }

  // Fetch from Firestore
  console.log(`Fetching ${category} wallpapers from Firestore...`)
  return fetchWallpapersFromFirestore(category)
}

// Get current wallpaper for a category
export async function getWallpaper(
  category: WallpaperCategory = 'nature'
): Promise<WallpaperData | null> {
  const wallpapers = await getWallpapers(category)

  if (wallpapers.length === 0) {
    console.warn(`No wallpapers found for category: ${category}`)
    return null
  }

  const index = getCurrentIndex(category)
  const safeIndex = index % wallpapers.length

  return wallpapers[safeIndex]
}

// Get next wallpaper in the same category
export async function getNextWallpaper(category: WallpaperCategory): Promise<WallpaperData | null> {
  const wallpapers = await getWallpapers(category)

  if (wallpapers.length === 0) {
    return null
  }

  const currentIndex = getCurrentIndex(category)
  const nextIndex = (currentIndex + 1) % wallpapers.length
  setCurrentIndex(category, nextIndex)

  console.log(`Next wallpaper: ${nextIndex + 1}/${wallpapers.length} for ${category}`)
  return wallpapers[nextIndex]
}

// Get random wallpaper from a category
export async function getRandomWallpaper(category: WallpaperCategory): Promise<WallpaperData | null> {
  const wallpapers = await getWallpapers(category)

  if (wallpapers.length === 0) {
    return null
  }

  const randomIndex = Math.floor(Math.random() * wallpapers.length)
  setCurrentIndex(category, randomIndex)

  console.log(`Random wallpaper: ${randomIndex + 1}/${wallpapers.length} for ${category}`)
  return wallpapers[randomIndex]
}

// Get wallpaper count for a category
export async function getWallpaperCount(category: WallpaperCategory): Promise<number> {
  const wallpapers = await getWallpapers(category)
  return wallpapers.length
}
