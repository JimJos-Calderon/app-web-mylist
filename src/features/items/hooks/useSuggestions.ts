import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { OmdbSuggestion, OmdbResponse, DEBOUNCE_DELAY, MAX_SUGGESTIONS } from '@/features/shared'
import { queryKeys } from '@config/queryKeys'
import { supabase } from '@/supabaseClient'
import { searchTmdbAsOmdbSuggestions } from '@/features/items/services/tmdbService'

function normalizeSuggestionKey(s: OmdbSuggestion): string {
  const t = s.Title.trim().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
  return `${t}|${s.Year}`
}

/** TMDB primero (mejor para títulos en español); OMDB rellena huecos. Sin duplicados obvios por título+año. */
function mergeSearchSuggestions(tmdb: OmdbSuggestion[], omdb: OmdbSuggestion[]): OmdbSuggestion[] {
  const seen = new Set<string>()
  const out: OmdbSuggestion[] = []
  for (const s of [...tmdb, ...omdb]) {
    if (!s.Title?.trim()) continue
    const k = normalizeSuggestionKey(s)
    if (seen.has(k)) continue
    seen.add(k)
    out.push(s)
    if (out.length >= MAX_SUGGESTIONS) break
  }
  return out
}

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
  const [manualSuggestions, setManualSuggestions] = useState<OmdbSuggestion[] | null>(null)

  // Debounce logic
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedQuery(searchQuery)
      setManualSuggestions(null)
    }, DEBOUNCE_DELAY)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.suggestions.byType(tipo, debouncedQuery),
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 3) {
        return []
      }

      const [tmdbList, omdbResult] = await Promise.all([
        searchTmdbAsOmdbSuggestions(debouncedQuery, tipo),
        supabase.functions.invoke('search-omdb', {
          body: {
            query: debouncedQuery,
            type: tipo === 'pelicula' ? 'movie' : 'series',
            page: 1,
          },
        }),
      ])

      const { data, error } = omdbResult

      if (error) {
        throw new Error(error.message || 'Failed to fetch OMDB suggestions')
      }

      const omdbData = data as OmdbResponse

      const omdbList =
        omdbData.Response === 'False' || omdbData.Error
          ? []
          : (omdbData.Search || []).slice(0, MAX_SUGGESTIONS)

      return mergeSearchSuggestions(tmdbList, omdbList)
    },
    enabled: debouncedQuery.length >= 3,
    staleTime: 60 * 60 * 1000, // 60 minutos (mismo TTL que antes)
  })

  const resolvedSuggestions = manualSuggestions ?? data ?? []

  return {
    suggestions: resolvedSuggestions,
    loading: isLoading,
    error: error?.message || null,
    setSuggestions: setManualSuggestions,
  }
}
