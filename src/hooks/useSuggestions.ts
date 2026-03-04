import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { OmdbSuggestion, OmdbResponse } from '@/types'
import { DEBOUNCE_DELAY, MAX_SUGGESTIONS, ERROR_MESSAGES } from '@constants/index'
import { queryKeys } from '@config/queryKeys'
import { supabase } from '@/supabaseClient'

interface UseSuggestionsReturn {
  suggestions: OmdbSuggestion[]
  loading: boolean
  error: string | null
  setSuggestions: (suggestions: OmdbSuggestion[]) => void
}

/**
 * Hook para obtener sugerencias de búsqueda desde OMDB
 * Con debounce automático y caché gestionado por React Query
 * Ahora usa la Edge Function segura en lugar de llamadas directas a OMDB
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

      // Llamar a la Edge Function de Supabase en lugar de OMDB directamente
      const { data, error } = await supabase.functions.invoke('search-omdb', {
        body: {
          query: debouncedQuery,
          type: tipo === 'pelicula' ? 'movie' : 'series',
          page: 1,
        },
      })

      if (error) {
        throw new Error(error.message || ERROR_MESSAGES.SEARCH_SUGGESTIONS)
      }

      if (data.Response === 'False' || data.Error) {
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
