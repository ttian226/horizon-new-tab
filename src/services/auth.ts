// Authentication Service - Firebase Auth
// Supports Google Sign-in for premium features sync

import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth'
import { auth } from '../config/firebase'

const googleProvider = new GoogleAuthProvider()

// Sign in with Google
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider)
  return result.user
}

// Sign out
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth)
}

// Get current user
export function getCurrentUser(): User | null {
  return auth.currentUser
}

// Listen to auth state changes
export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback)
}
