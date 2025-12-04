// Authentication Service - Firebase Auth
// Supports Google Sign-in for premium features sync
// Uses chrome.identity API for Manifest V3 compatibility (avoids CSP issues)

import {
  signInWithCredential,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth'
import { auth } from '../config/firebase'

// Sign in with Google using chrome.identity
export async function signInWithGoogle(): Promise<User> {
  try {
    // Get OAuth token using chrome.identity
    const token = await new Promise<string>((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
        } else if (token) {
          resolve(token)
        } else {
          reject(new Error('No token received'))
        }
      })
    })

    // Create Google credential with the token
    const credential = GoogleAuthProvider.credential(null, token)

    // Sign in to Firebase with the credential
    const result = await signInWithCredential(auth, credential)
    return result.user
  } catch (error: any) {
    console.error('Sign in error:', error)
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
