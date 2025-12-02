// Authentication Service - Firebase Auth
// Supports Google Sign-in for premium features sync
// Uses Firebase signInWithPopup for better compatibility across different extension installations

import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth'
import { auth } from '../config/firebase'

// Sign in with Google using Firebase popup
export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({
    prompt: 'select_account'
  })

  try {
    const result = await signInWithPopup(auth, provider)
    return result.user
  } catch (error: any) {
    // Handle specific error cases
    if (error.code === 'auth/popup-blocked') {
      throw new Error('Popup was blocked. Please allow popups for this extension.')
    }
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in cancelled')
    }
    throw error
  }
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
