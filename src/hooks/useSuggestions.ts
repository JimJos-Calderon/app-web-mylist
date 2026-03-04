import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { OmdbSuggestion, OmdbResponse } from '@/types'
import { OMDB_BASE_URL, OMDB_API_KEY, DEBOUNCE_DELAY, MAX_SUGGESTIONS, ERROR_MESSAGES } from '@constants/index'
import { queryKeys } from '@config/queryKeys'

interface UseSuggestionsReturn {
  suggestions: OmdbSuggestion[]
  loading: boolean
  error: string | null
  setSuggestions: (suggestions: OmdbSuggestion[]) => void
}

/**
 * Hook para obtener sugerencias de búsqueda desde OMDB
 * Con debounce automático y caché gestionado por React Query
 */
export const useSuggestions = (
  searchQuery: string,
  tipo: 'pelicula' | 'serie'
): UseSuggestionsReturn => {
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [localSuggestions, setLocalSuggestions] = useState<OmdbSuggestion[]>([])

  // Debounce logic
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, DEBOUNCE_DELAY)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.suggestions.byType(tipo),
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 3) {
        return []
      }

      if (!OMDB_API_KEY) {
        throw new Error('OMDB API key not configured')
      }

      const params = new URLSearchParams({
        s: debouncedQuery,
        type: tipo === 'pelicula' ? 'movie' : 'series',
        apikey: OMDB_API_KEY,
      })

      const response = await fetch(`${OMDB_BASE_URL}?${params}`)

      if (!response.ok) {
        throw new Error(ERROR_MESSAGES.SEARCH_SUGGESTIONS)
      }

      const data: OmdbResponse = await response.json()

      if (data.Response === 'False') {
        return []
      }

      return (data.Search || []).slice(0, MAX_SUGGESTIONS)
    },
    enabled: debouncedQuery.length >= 3,
    staleTime: 60 * 60 * 1000, // 60 minutos (mismo TTL que antes)
  })

  // Actualizar sugerencias cuando sea necesario
  useEffect(() => {
    if (data) {
      setLocalSuggestions(data)
    } else if (!debouncedQuery || debouncedQuery.length < 3) {
      setLocalSuggestions([])
    }
  }, [data, debouncedQuery])

  return {
    suggestions: localSuggestions,
    loading: isLoading,
    error: error?.message || null,
    setSuggestions: setLocalSuggestions,
  }
}
