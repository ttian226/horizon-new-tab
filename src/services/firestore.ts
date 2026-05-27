// Firestore Service - Cloud Database
// Used for: User settings sync, Todo sync, Favorites

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  serverTimestamp,
  onSnapshot,
  orderBy,
  Unsubscribe,
} from 'firebase/firestore'
import { db } from '../config/firebase'

// Temperature unit type
export type TemperatureUnit = 'metric' | 'imperial'

// Weather settings interface
export interface WeatherSettings {
  auto: boolean
  cityName: string
  lat: number
  lon: number
  unit?: TemperatureUnit // 'metric' = Celsius, 'imperial' = Fahrenheit
}

// User settings interface (stored in users/{uid}/settings field)
export interface UserSettings {
  weather: WeatherSettings
  clockFormat?: '12h' | '24h'
  showQuote?: boolean
  updatedAt?: Date
}

// 3-state status, aligned with Notion Tasks DB schema (Not done / Doing / Done).
export type TodoStatus = 'todo' | 'doing' | 'done'

// Todo item interface. v0.1.4 expanded the schema to support Notion sync.
// - `status` is the primary state; `completed` is kept in lockstep for
//   backward compatibility with pre-v0.1.4 clients (and is derived from
//   `status` on write, read mapping fills `status` from `completed` for
//   legacy docs that only have the bool).
// - `dueDate`, `icon`, `notionPageId`, `lastSyncedAt` are new optional
//   fields. UI may render them but doesn't require them.
export interface CloudTodoItem {
  id: string
  text: string
  completed: boolean
  status: TodoStatus
  dueDate?: string // ISO 'YYYY-MM-DD'
  icon?: string // emoji
  notionPageId?: string // present when this todo is bound to a Notion page
  lastSyncedAt?: number // ms epoch — last successful sync with Notion
  listId: string // List ID this todo belongs to
  createdAt: Date
  updatedAt: Date
}

// Derive status from a possibly-legacy doc that only has `completed`.
function inferStatus(raw: { status?: string; completed?: boolean }): TodoStatus {
  if (raw.status === 'todo' || raw.status === 'doing' || raw.status === 'done') {
    return raw.status
  }
  return raw.completed ? 'done' : 'todo'
}

// Todo List interface
export interface TodoList {
  id: string
  name: string
  order: number
  isDefault: boolean
  createdAt: Date
}

// User limits configuration
export interface UserLimits {
  maxFavorites: number // Maximum number of favorite wallpapers
  maxTodoLists: number // Maximum number of todo lists
}

// ============ User Settings ============

const DEFAULT_WEATHER_SETTINGS: WeatherSettings = {
  auto: true,
  cityName: 'Shanghai',
  lat: 31.23,
  lon: 121.47,
}

const DEFAULT_USER_SETTINGS: UserSettings = {
  weather: DEFAULT_WEATHER_SETTINGS,
  clockFormat: '24h',
  showQuote: true,
}

// Get user settings from users/{uid} document
export async function getUserSettings(userId: string): Promise<UserSettings> {
  const docRef = doc(db, 'users', userId)
  const docSnap = await getDoc(docRef)

  if (docSnap.exists()) {
    const data = docSnap.data()
    if (data.settings) {
      return {
        weather: data.settings.weather || DEFAULT_WEATHER_SETTINGS,
        clockFormat: data.settings.clockFormat || '24h',
        showQuote: data.settings.showQuote ?? true,
      }
    }
  }

  // Initialize with default settings
  await setDoc(docRef, {
    settings: DEFAULT_USER_SETTINGS,
    updatedAt: serverTimestamp(),
  }, { merge: true })

  return DEFAULT_USER_SETTINGS
}

// Save user settings to users/{uid}/settings field
export async function saveUserSettings(
  userId: string,
  settings: Partial<UserSettings>
): Promise<void> {
  const docRef = doc(db, 'users', userId)
  await updateDoc(docRef, {
    settings: settings,
    updatedAt: serverTimestamp(),
  })
}

// Update weather settings only
export async function updateWeatherSettings(
  userId: string,
  weather: WeatherSettings
): Promise<void> {
  const docRef = doc(db, 'users', userId)
  const docSnap = await getDoc(docRef)

  if (docSnap.exists()) {
    const currentSettings = docSnap.data().settings || DEFAULT_USER_SETTINGS
    await updateDoc(docRef, {
      settings: {
        ...currentSettings,
        weather,
      },
      updatedAt: serverTimestamp(),
    })
  } else {
    await setDoc(docRef, {
      settings: {
        ...DEFAULT_USER_SETTINGS,
        weather,
      },
      updatedAt: serverTimestamp(),
    })
  }
}

// Update clock format setting
export async function updateClockFormat(
  userId: string,
  clockFormat: '12h' | '24h'
): Promise<void> {
  const docRef = doc(db, 'users', userId)
  const docSnap = await getDoc(docRef)

  if (docSnap.exists()) {
    const currentSettings = docSnap.data().settings || DEFAULT_USER_SETTINGS
    await updateDoc(docRef, {
      settings: {
        ...currentSettings,
        clockFormat,
      },
      updatedAt: serverTimestamp(),
    })
  } else {
    await setDoc(docRef, {
      settings: {
        ...DEFAULT_USER_SETTINGS,
        clockFormat,
      },
      updatedAt: serverTimestamp(),
    })
  }
}

// ============ User Limits ============

// Default limits for all users
const DEFAULT_USER_LIMITS: UserLimits = {
  maxFavorites: 9,
  maxTodoLists: 1,
}

export function getUserLimits(): UserLimits {
  return DEFAULT_USER_LIMITS
}

// ============ Todo Lists ============

const DEFAULT_TODO_LIST_ID = 'today'

// Get or create default "Today" list
export async function ensureDefaultTodoList(userId: string): Promise<string> {
  const docRef = doc(db, 'users', userId, 'todolists', DEFAULT_TODO_LIST_ID)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    await setDoc(docRef, {
      name: 'Today',
      order: 0,
      isDefault: true,
      createdAt: serverTimestamp(),
    })
  }

  return DEFAULT_TODO_LIST_ID
}

// Get all todo lists
export async function getTodoLists(userId: string): Promise<TodoList[]> {
  const listsRef = collection(db, 'users', userId, 'todolists')
  const q = query(listsRef, orderBy('order', 'asc'))
  const snapshot = await getDocs(q)

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
  })) as TodoList[]
}

// ============ Cloud Todos ============

// Subscribe to todos with realtime updates (filter by listId)
export function subscribeTodos(
  userId: string,
  listId: string,
  callback: (todos: CloudTodoItem[]) => void
): Unsubscribe {
  const todosRef = collection(db, 'users', userId, 'todos')
  const q = query(todosRef, where('listId', '==', listId), orderBy('createdAt', 'desc'))

  return onSnapshot(
    q,
    (snapshot) => {
      const todos = snapshot.docs.map((doc) => {
        const data = doc.data()
        const status = inferStatus(data)
        return {
          id: doc.id,
          ...data,
          status,
          completed: data.completed ?? status === 'done',
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as CloudTodoItem
      })
      callback(todos)
    },
    (error) => {
      console.error('subscribeTodos error:', error)
      // Return empty array on error to stop loading state
      callback([])
    }
  )
}

// Add a new todo. Optional fields (status / dueDate / icon / notionPageId /
// lastSyncedAt) let the caller pre-populate Notion-synced data. completed
// always tracks status to keep pre-v0.1.4 readers happy.
export interface AddTodoOptions {
  status?: TodoStatus
  dueDate?: string
  icon?: string
  notionPageId?: string
  lastSyncedAt?: number
}

export async function addTodo(
  userId: string,
  text: string,
  listId: string,
  options: AddTodoOptions = {}
): Promise<string> {
  const todosRef = collection(db, 'users', userId, 'todos')
  const docRef = doc(todosRef)
  const status: TodoStatus = options.status ?? 'todo'
  const payload: Record<string, unknown> = {
    text,
    completed: status === 'done',
    status,
    listId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  if (options.dueDate !== undefined) payload.dueDate = options.dueDate
  if (options.icon !== undefined) payload.icon = options.icon
  if (options.notionPageId !== undefined) payload.notionPageId = options.notionPageId
  if (options.lastSyncedAt !== undefined) payload.lastSyncedAt = options.lastSyncedAt
  await setDoc(docRef, payload)
  return docRef.id
}

// Toggle todo completed status. Writes both `completed` and `status` so
// pre-v0.1.4 readers and v0.1.4+ readers stay consistent. Toggling off
// always resets to 'todo' (the 'doing' state is set via a dedicated
// updateTodo call when UI supports it).
export async function toggleTodo(userId: string, todoId: string, completed: boolean): Promise<void> {
  const docRef = doc(db, 'users', userId, 'todos', todoId)
  await updateDoc(docRef, {
    completed,
    status: completed ? 'done' : 'todo',
    updatedAt: serverTimestamp(),
  })
}

// Delete a todo
export async function deleteTodo(userId: string, todoId: string): Promise<void> {
  const docRef = doc(db, 'users', userId, 'todos', todoId)
  await deleteDoc(docRef)
}

// Clear all completed todos in a specific list
export async function clearCompletedTodos(userId: string, listId: string): Promise<void> {
  const todosRef = collection(db, 'users', userId, 'todos')
  const q = query(todosRef, where('listId', '==', listId), where('completed', '==', true))
  const snapshot = await getDocs(q)

  const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref))
  await Promise.all(deletePromises)
}

// Get todo count for a specific list
export async function getTodoCount(userId: string, listId: string): Promise<number> {
  const todosRef = collection(db, 'users', userId, 'todos')
  const q = query(todosRef, where('listId', '==', listId))
  const snapshot = await getDocs(q)
  return snapshot.size
}

// ============ User Profile (Nickname) ============

export async function getNickname(userId: string): Promise<string | null> {
  const docRef = doc(db, 'users', userId)
  const docSnap = await getDoc(docRef)
  if (docSnap.exists()) {
    return docSnap.data().nickname || null
  }
  return null
}

export async function setNickname(userId: string, nickname: string): Promise<void> {
  const docRef = doc(db, 'users', userId)
  await setDoc(docRef, { nickname }, { merge: true })
}

// ============ Favorites (Wallpapers) ============

export interface FavoriteWallpaper {
  id: string
  imageUrl: string
  photographer: string
  photographerUrl: string
  photoUrl: string
  category: string
  createdAt: Date
}

// Check if wallpaper is favorited
export async function isFavorited(userId: string, wallpaperId: string): Promise<boolean> {
  const docRef = doc(db, 'users', userId, 'favorites', wallpaperId)
  const docSnap = await getDoc(docRef)
  return docSnap.exists()
}

// Add wallpaper to favorites
export async function addFavorite(
  userId: string,
  wallpaper: Omit<FavoriteWallpaper, 'createdAt'>
): Promise<void> {
  const docRef = doc(db, 'users', userId, 'favorites', wallpaper.id)
  await setDoc(docRef, {
    ...wallpaper,
    createdAt: serverTimestamp(),
  })
}

// Remove wallpaper from favorites
export async function removeFavorite(userId: string, wallpaperId: string): Promise<void> {
  const docRef = doc(db, 'users', userId, 'favorites', wallpaperId)
  await deleteDoc(docRef)
}

// Get all favorites
export async function getFavorites(userId: string): Promise<FavoriteWallpaper[]> {
  const favRef = collection(db, 'users', userId, 'favorites')
  const q = query(favRef, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({
    ...doc.data(),
    id: doc.id,
    createdAt: doc.data().createdAt?.toDate() || new Date(),
  })) as FavoriteWallpaper[]
}

// Get favorites count
export async function getFavoritesCount(userId: string): Promise<number> {
  const favRef = collection(db, 'users', userId, 'favorites')
  const snapshot = await getDocs(favRef)
  return snapshot.size
}

// Check if user can add more favorites (based on limits)
export async function canAddFavorite(userId: string): Promise<boolean> {
  const limits = getUserLimits()
  const currentCount = await getFavoritesCount(userId)

  return currentCount < limits.maxFavorites
}

// Subscribe to favorites with realtime updates
export function subscribeFavorites(
  userId: string,
  callback: (favorites: FavoriteWallpaper[]) => void
): Unsubscribe {
  const favRef = collection(db, 'users', userId, 'favorites')
  const q = query(favRef, orderBy('createdAt', 'desc'))

  return onSnapshot(q, (snapshot) => {
    const favorites = snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as FavoriteWallpaper[]
    callback(favorites)
  })
}
