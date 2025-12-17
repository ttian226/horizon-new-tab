// Firebase Configuration
// Project: Horizon (horizon-30aa6)
// Note: Firebase Analytics is NOT supported in Chrome Extensions (loads remote gtag.js)

import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth/web-extension'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyAPA95DcThrXBxA9VXtooGpYGwp8hDUfQA',
  authDomain: 'horizon-30aa6.firebaseapp.com',
  projectId: 'horizon-30aa6',
  storageBucket: 'horizon-30aa6.firebasestorage.app',
  messagingSenderId: '1021420058440',
  appId: '1:1021420058440:web:df604e11c37cfc63d4257d',
}

// Initialize Firebase
export const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)
