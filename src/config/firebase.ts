// Firebase Configuration
// Production: horizon-30aa6
// Development: horizon-dev-734a4
// Note: Firebase Analytics is NOT supported in Chrome Extensions (loads remote gtag.js)

import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth/web-extension'
import { getFirestore } from 'firebase/firestore'

const firebaseConfigs = {
  production: {
    apiKey: 'AIzaSyAPA95DcThrXBxA9VXtooGpYGwp8hDUfQA',
    authDomain: 'horizon-30aa6.firebaseapp.com',
    projectId: 'horizon-30aa6',
    storageBucket: 'horizon-30aa6.firebasestorage.app',
    messagingSenderId: '1021420058440',
    appId: '1:1021420058440:web:df604e11c37cfc63d4257d',
  },
  development: {
    apiKey: 'AIzaSyAlSYhIdSvBc6VIKsrR1ecW9PEM8nGcOFk',
    authDomain: 'horizon-dev-734a4.firebaseapp.com',
    projectId: 'horizon-dev-734a4',
    storageBucket: 'horizon-dev-734a4.firebasestorage.app',
    messagingSenderId: '425487238446',
    appId: '1:425487238446:web:d935c9b49d4c5658f8e6bf',
  },
}

// Pick env: explicit VITE_FIREBASE_ENV wins; otherwise default to dev in vite dev mode, prod for builds
const env =
  (import.meta.env.VITE_FIREBASE_ENV as keyof typeof firebaseConfigs | undefined) ||
  (import.meta.env.DEV ? 'development' : 'production')
const firebaseConfig = firebaseConfigs[env]

if (import.meta.env.DEV) {
  console.log(`🔥 Firebase: ${env} (${firebaseConfig.projectId})`)
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
