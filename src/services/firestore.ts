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

// ============ Cloud Todos ============

// Subscribe to todos with realtime updates
export function subscribeTodos(
  userId: string,
  callback: (todos: CloudTodoItem[]) => void
): Unsubscribe {
  const todosRef = collection(db, 'users', userId, 'todos')
  const q = query(todosRef, orderBy('createdAt', 'desc'))

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
export async function addTodo(userId: string, text: string): Promise<string> {
  const todosRef = collection(db, 'users', userId, 'todos')
  const docRef = doc(todosRef)
  await setDoc(docRef, {
    text,
    completed: false,
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

// Clear all completed todos
export async function clearCompletedTodos(userId: string): Promise<void> {
  const todosRef = collection(db, 'users', userId, 'todos')
  const q = query(todosRef, where('completed', '==', true))
  const snapshot = await getDocs(q)

  const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref))
  await Promise.all(deletePromises)
}

// Get todo count for limit checking
export async function getTodoCount(userId: string): Promise<number> {
  const todosRef = collection(db, 'users', userId, 'todos')
  const snapshot = await getDocs(todosRef)
  return snapshot.size
}
