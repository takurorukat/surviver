/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SURVIVOR_SUPPORT_LINK_ENABLED?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
