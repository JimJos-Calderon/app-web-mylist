import { useState, useEffect, useCallback } from 'react'
import { OmdbSuggestion, OmdbResponse } from '@/types'
import { OMDB_BASE_URL, OMDB_API_KEY, DEBOUNCE_DELAY, MAX_SUGGESTIONS, ERROR_MESSAGES } from '@constants/index'
import { searchCache } from '@utils/cache'

interface UseSuggestionsReturn {
  suggestions: OmdbSuggestion[]
  loading: boolean
  error: string | null
  setSuggestions: (suggestions: OmdbSuggestion[]) => void
  clearError: () => void
}

export const useSuggestions = (
  searchQuery: string,
  tipo: 'pelicula' | 'serie'
): UseSuggestionsReturn => {
  const [suggestions, setSuggestions] = useState<OmdbSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([])
      setError(null)
      setLoading(false)
      return
    }

    // Check cache first
    const cacheKey = `${query}-${tipo}`
    const cachedData = searchCache.get<OmdbSuggestion[]>(cacheKey)

    if (cachedData) {
      setSuggestions(cachedData)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      if (!OMDB_API_KEY) {
        throw new Error('OMDB API key not configured')
      }

      const params = new URLSearchParams({
        s: query,
        type: tipo === 'pelicula' ? 'movie' : 'series',
        apikey: OMDB_API_KEY,
      })

      const response = await fetch(`${OMDB_BASE_URL}?${params}`)

      if (!response.ok) {
        throw new Error(ERROR_MESSAGES.SEARCH_SUGGESTIONS)
      }

      const data: OmdbResponse = await response.json()

      if (data.Response === 'False') {
        setSuggestions([])
        setError(null)
        return
      }

      const results = (data.Search || []).slice(0, MAX_SUGGESTIONS)
      setSuggestions(results)

      // Cache the results
      searchCache.set(cacheKey, results, 60) // 60 minutes cache

      setError(null)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : ERROR_MESSAGES.SEARCH_SUGGESTIONS
      setError(message)
      setSuggestions([])
      console.error('Suggestions error:', err)
    } finally {
      setLoading(false)
    }
  }, [tipo])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSuggestions(searchQuery)
    }, DEBOUNCE_DELAY)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, fetchSuggestions])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    suggestions,
    loading,
    error,
    setSuggestions,
    clearError,
  }
}
