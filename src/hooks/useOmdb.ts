import { useState, useCallback } from 'react'
import { OmdbResponse } from '@/types'
import { OMDB_BASE_URL, OMDB_API_KEY, ERROR_MESSAGES } from '@constants/index'

interface UseOmdbReturn {
  getPosterUrl: (title: string) => Promise<string | null>
  loading: boolean
  error: string | null
  clearError: () => void
}

export const useOmdb = (): UseOmdbReturn => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getPosterUrl = useCallback(async (title: string): Promise<string | null> => {
    setLoading(true)
    setError(null)

    try {
      if (!OMDB_API_KEY) {
        throw new Error('OMDB API key not configured')
      }

      const params = new URLSearchParams({
        t: title,
        apikey: OMDB_API_KEY,
      })

      const response = await fetch(`${OMDB_BASE_URL}?${params}`)

      if (!response.ok) {
        throw new Error(ERROR_MESSAGES.SEARCH_SUGGESTIONS)
      }

      const data: OmdbResponse = await response.json()

      if (data.Response === 'False' || !data.Poster || data.Poster === 'N/A') {
        return null
      }

      return data.Poster
    } catch (err) {
      const message =
        err instanceof Error ? err.message : ERROR_MESSAGES.SEARCH_SUGGESTIONS
      setError(message)
      console.error('OMDB error:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    getPosterUrl,
    loading,
    error,
    clearError,
  }
}
