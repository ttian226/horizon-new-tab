// Firebase Configuration
// Project: Horizon (horizon-30aa6)
// Plan: Blaze (Pay as you go with $300 free credits)

import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getAnalytics, isSupported } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: 'AIzaSyAPA95DcThrXBxA9VXtooGpYGwp8hDUfQA',
  authDomain: 'horizon-30aa6.firebaseapp.com',
  projectId: 'horizon-30aa6',
  storageBucket: 'horizon-30aa6.firebasestorage.app',
  messagingSenderId: '1021420058440',
  appId: '1:1021420058440:web:df604e11c37cfc63d4257d',
  measurementId: 'G-98C90DF795',
}

// Initialize Firebase
export const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)

// Analytics (only in browser environment, not in extension background)
export const initAnalytics = async () => {
  if (await isSupported()) {
    return getAnalytics(app)
  }
  return null
}
