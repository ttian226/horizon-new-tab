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
  createdAt: Date
  updatedAt: Date
}

// Membership interface
export interface Membership {
  isPremium: boolean
  plan: 'free' | 'monthly' | 'yearly'
  expiresAt?: Date
  subscribedAt?: Date
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

export async function getMembership(userId: string): Promise<Membership> {
  const docRef = doc(db, 'users', userId, 'membership', 'status')
  const docSnap = await getDoc(docRef)
  if (docSnap.exists()) {
    return docSnap.data() as Membership
  }
  // Default free membership
  return { isPremium: false, plan: 'free' }
}

// ============ Cloud Todos (Premium) ============

export async function getCloudTodos(userId: string): Promise<CloudTodoItem[]> {
  const todosRef = collection(db, 'users', userId, 'todos')
  const snapshot = await getDocs(todosRef)
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as CloudTodoItem[]
}

export async function saveCloudTodo(userId: string, todo: Omit<CloudTodoItem, 'id'>): Promise<string> {
  const todosRef = collection(db, 'users', userId, 'todos')
  const docRef = doc(todosRef)
  await setDoc(docRef, { ...todo, updatedAt: serverTimestamp() })
  return docRef.id
}

export async function deleteCloudTodo(userId: string, todoId: string): Promise<void> {
  const docRef = doc(db, 'users', userId, 'todos', todoId)
  await deleteDoc(docRef)
}
