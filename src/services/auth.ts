// Authentication Service - Firebase Auth
// Supports Google Sign-in for premium features sync
// Uses chrome.identity API for Chrome Extension compatibility

import {
  signInWithCredential,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth'
import { auth } from '../config/firebase'

// Check if running as Chrome Extension
const isChromeExtension = typeof chrome !== 'undefined' && chrome.identity

// Sign in with Google using chrome.identity API
export async function signInWithGoogle(): Promise<User> {
  if (!isChromeExtension) {
    throw new Error('Google Sign-in is only available in Chrome Extension')
  }

  return new Promise((resolve, reject) => {
    // Use chrome.identity to get OAuth token
    chrome.identity.getAuthToken({ interactive: true }, async (token) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
        return
      }

      if (!token) {
        reject(new Error('Failed to get auth token'))
        return
      }

      try {
        // Create Firebase credential with the token
        const credential = GoogleAuthProvider.credential(null, token)
        const result = await signInWithCredential(auth, credential)
        resolve(result.user)
      } catch (error) {
        // If Firebase auth fails, revoke the token and retry
        chrome.identity.removeCachedAuthToken({ token }, () => {
          reject(error)
        })
      }
    })
  })
}

// Sign out
export async function signOut(): Promise<void> {
  // Clear Chrome identity token cache
  if (isChromeExtension) {
    chrome.identity.getAuthToken({ interactive: false }, (token) => {
      if (token) {
        chrome.identity.removeCachedAuthToken({ token }, () => {})
      }
    })
  }
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
