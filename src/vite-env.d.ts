/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OMDB_KEY: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  // Agrega más variables de entorno según sea necesario
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
