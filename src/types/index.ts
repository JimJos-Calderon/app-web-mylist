export interface User {
  id: string
  email: string | undefined
  user_metadata?: Record<string, any>
}

export interface Session {
  user: User
  access_token: string
  refresh_token: string
}

export interface ListItem {
  id: string
  titulo: string
  tipo: 'pelicula' | 'serie'
  visto: boolean
  user_id: string
  user_email: string
  poster_url: string | null
  created_at: string
  rating?: number
  comentario?: string
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
  sortBy: 'date' | 'title' | 'rating'
  searchQuery: string
}
