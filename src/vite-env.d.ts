/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_ENV?: 'production' | 'development'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
