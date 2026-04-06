/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OMDB_KEY: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_VAPID_PUBLIC_KEY: string
  /** Bearer token de TMDB (lectura); opcional si no usas enriquecimiento TMDB. */
  readonly VITE_TMDB_ACCESS_TOKEN?: string
  readonly VITE_GROQ_API_KEY?: string
  // Agrega más variables de entorno según sea necesario
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
