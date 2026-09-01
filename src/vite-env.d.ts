/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Entorno de backend contra el que se comunica la app (Context.md 7.2). */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
