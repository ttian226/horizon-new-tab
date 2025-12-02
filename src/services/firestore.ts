// Firestore Service - Cloud Database
// Used for: User settings sync, Todo sync (premium), Membership status

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

// User settings interface
export interface UserSettings {
  name: string
  showWeather: boolean
  showQuote: boolean
  showTodo: boolean
  showFocus: boolean
  theme: 'light' | 'dark' | 'auto'
  updatedAt?: Date
}

// Todo item interface
export interface CloudTodoItem {
  id: string
  text: string
  completed: boolean
  listId: string // 所属分类
  createdAt: Date
  updatedAt: Date
}

// Todo List interface
export interface TodoList {
  id: string
  name: string
  order: number
  isDefault: boolean
  createdAt: Date
}

// Membership interface
export interface Membership {
  isPro: boolean
  plan: 'free' | 'pro'
  expiresAt?: Date | null
  subscribedAt?: Date | null
  maxFavorites: number // 9 for free, -1 for unlimited
  maxTodoLists: number // 1 for free, -1 for unlimited
}

// ============ User Settings ============

export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  const docRef = doc(db, 'users', userId, 'settings', 'preferences')
  const docSnap = await getDoc(docRef)
  return docSnap.exists() ? (docSnap.data() as UserSettings) : null
}

export async function saveUserSettings(
  userId: string,
  settings: Partial<UserSettings>
): Promise<void> {
  const docRef = doc(db, 'users', userId, 'settings', 'preferences')
  await setDoc(docRef, { ...settings, updatedAt: serverTimestamp() }, { merge: true })
}

// ============ Membership ============

const DEFAULT_FREE_MEMBERSHIP: Membership = {
  isPro: false,
  plan: 'free',
  expiresAt: null,
  subscribedAt: null,
  maxFavorites: 9,
  maxTodoLists: 1,
}

export async function getMembership(userId: string): Promise<Membership> {
  const docRef = doc(db, 'users', userId, 'membership', 'info')
  const docSnap = await getDoc(docRef)
  if (docSnap.exists()) {
    const data = docSnap.data()
    return {
      isPro: data.isPro ?? false,
      plan: data.plan ?? 'free',
      expiresAt: data.expiresAt?.toDate() ?? null,
      subscribedAt: data.subscribedAt?.toDate() ?? null,
      maxFavorites: data.maxFavorites ?? 9,
      maxTodoLists: data.maxTodoLists ?? 1,
    }
  }
  // Default free membership - also initialize in Firestore
  await setDoc(docRef, {
    ...DEFAULT_FREE_MEMBERSHIP,
    expiresAt: null,
    subscribedAt: null,
  })
  return DEFAULT_FREE_MEMBERSHIP
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

  return onSnapshot(q, (snapshot) => {
    const todos = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as CloudTodoItem[]
    callback(todos)
  })
}

// Add a new todo
export async function addTodo(userId: string, text: string, listId: string): Promise<string> {
  const todosRef = collection(db, 'users', userId, 'todos')
  const docRef = doc(todosRef)
  await setDoc(docRef, {
    text,
    completed: false,
    listId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

// Toggle todo completed status
export async function toggleTodo(userId: string, todoId: string, completed: boolean): Promise<void> {
  const docRef = doc(db, 'users', userId, 'todos', todoId)
  await updateDoc(docRef, {
    completed,
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

// Check if user can add more favorites (based on membership)
export async function canAddFavorite(userId: string): Promise<boolean> {
  const membership = await getMembership(userId)
  const currentCount = await getFavoritesCount(userId)

  // -1 means unlimited
  if (membership.maxFavorites === -1) return true

  return currentCount < membership.maxFavorites
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
