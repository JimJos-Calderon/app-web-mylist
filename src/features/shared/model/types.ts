export interface User {
  id: string
  email: string | undefined
  user_metadata?: Record<string, any>
}

export interface ListItem {
  id: string
  titulo: string
  /** Título en español (TMDB u orígenes); nullable para ítems antiguos. */
  title_es?: string | null
  tipo: 'pelicula' | 'serie'
  /** Visto para el usuario de la sesión (`item_user_watch`); la columna legacy `items.visto` no se usa en UI. */
  visto: boolean
  user_id: string
  user_email: string
  poster_url: string | null
  created_at: string
  rating?: number
  comentario?: string
  genero?: string
  list_id: string
  /** Orden manual dentro de la lista y tipo (0 = primero). */
  sort_index?: number
  /** Etiquetas del ítem. */
  tags?: string[] | null
  /** Miembros que han marcado visto este título (solo si la lista tiene más de un miembro). */
  watch_group?: {
    watched: number
    total: number
  }
}

export interface ItemRating {
  id: string
  item_id: string
  user_id: string
  rating: number | null
  liked: boolean | null
  created_at: string
  updated_at: string
}

export interface OmdbSuggestion {
  Title: string
  Year: string
  imdbID: string
  Type: string
  Poster: string
}

export interface OmdbResponse {
  Title?: string
  Year?: string
  Poster?: string
  Plot?: string
  Genre?: string
  Response: 'True' | 'False'
  Error?: string
  Search?: OmdbSuggestion[]
}

export interface ApiError {
  message: string
  code?: string
  status?: number
}

export interface FilterState {
  showWatched: boolean
  showUnwatched: boolean
  sortBy: 'date' | 'title' | 'rating' | 'manual'
  sortOrder: 'asc' | 'desc'
  searchQuery: string
  /** Filtrar por etiqueta (coincidencia exacta, sin distinguir mayúsculas). Vacío = todas. */
  tagFilter: string
}

export interface List {
  id: string
  name: string
  description: string | null
  owner_id: string
  created_at: string
  updated_at: string
  is_private: boolean
  invite_code: string
  /** Tema para embeds Discord (y UI futura); null = estilo por defecto. */
  theme?: string | null
  /** Etiquetas de la lista (sugerencias / agrupación). */
  tags?: string[] | null
  /** Ítem marcado como “siguiente en cola” para la lista. */
  next_queue_item_id?: string | null
}

export interface ListMember {
  id: string
  list_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  joined_at: string
}
