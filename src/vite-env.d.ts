/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  /** DSN de Sentry para errores en producción; sin valor, Sentry no se inicializa. */
  readonly VITE_SENTRY_DSN?: string
  /** Clave pública VAPID (Push en navegador); opcional si no usas push. */
  readonly VITE_VAPID_PUBLIC_KEY?: string
  /** Bearer token de TMDB (lectura); opcional si no usas enriquecimiento TMDB. */
  readonly VITE_TMDB_ACCESS_TOKEN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
