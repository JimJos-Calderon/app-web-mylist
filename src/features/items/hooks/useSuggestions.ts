import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { OmdbSuggestion, OmdbResponse, DEBOUNCE_DELAY, MAX_SUGGESTIONS, ERROR_MESSAGES } from '@/features/shared'
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
    queryKey: queryKeys.suggestions.byType(tipo, debouncedQuery),
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 3) {
        return []
      }

      // Usar fetch directo en lugar de supabase.functions.invoke para evitar requerimientos de JWT
      const response = await fetch(
        'https://lpaysuasdjgajiftyush.supabase.co/functions/v1/search-omdb',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwYXlzdWFzZGpnYWppZnR5dXNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDgyNzUxNDIsImV4cCI6MTk5Mzg1MTE0Mn0.I6I8scpqFLX0xc7OgPRQvQ5zBBBEO1_4rCjQhljW6lI',
          },
          body: JSON.stringify({
            query: debouncedQuery,
            type: tipo === 'pelicula' ? 'movie' : 'series',
            page: 1,
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

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
