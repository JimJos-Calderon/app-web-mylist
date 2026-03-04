import { useQuery } from '@tanstack/react-query'
import { OmdbResponse } from '@/types'
import { OMDB_BASE_URL, OMDB_API_KEY, ERROR_MESSAGES } from '@constants/index'
import { queryKeys } from '@config/queryKeys'

interface UseOmdbReturn {
  getPosterUrl: (title: string) => { data: string | null; isLoading: boolean; error: Error | null }
  getSynopsis: (title: string) => { data: string | null; isLoading: boolean; error: Error | null }
  getGenre: (title: string) => { data: string | null; isLoading: boolean; error: Error | null }
}

/**
 * Hook para obtener datos de OMDB API
 * Usa useQuery para cachear los resultados y evitar repeated requests
 */
export const useOmdb = (): UseOmdbReturn => {
  const fetchFromOmdb = async (title: string): Promise<OmdbResponse> => {
    if (!OMDB_API_KEY) {
      throw new Error('OMDB API key not configured')
    }

    const params = new URLSearchParams({
      t: title,
      plot: 'short',
      apikey: OMDB_API_KEY,
    })

    const response = await fetch(`${OMDB_BASE_URL}?${params}`)

    if (!response.ok) {
      throw new Error(ERROR_MESSAGES.SEARCH_SUGGESTIONS)
    }

    const data: OmdbResponse = await response.json()

    if (data.Response === 'False') {
      throw new Error('No se encontró la película o serie')
    }

    return data
  }

  const getPosterUrl = (title: string) => {
    const { data, isLoading, error } = useQuery({
      queryKey: queryKeys.omdb.poster(title),
      queryFn: async () => {
        const data = await fetchFromOmdb(title)
        return data.Poster && data.Poster !== 'N/A' ? data.Poster : null
      },
      enabled: !!title,
      staleTime: 24 * 60 * 60 * 1000, // 24 horas para OMDB (datos externos estables)
    })

    return { data: data || null, isLoading, error }
  }

  const getSynopsis = (title: string) => {
    const { data, isLoading, error } = useQuery({
      queryKey: queryKeys.omdb.synopsis(title),
      queryFn: async () => {
        const data = await fetchFromOmdb(title)
        return data.Plot && data.Plot !== 'N/A' ? data.Plot : null
      },
      enabled: !!title,
      staleTime: 24 * 60 * 60 * 1000,
    })

    return { data: data || null, isLoading, error }
  }

  const getGenre = (title: string) => {
    const { data, isLoading, error } = useQuery({
      queryKey: queryKeys.omdb.genre(title),
      queryFn: async () => {
        const data = await fetchFromOmdb(title)
        return data.Genre && data.Genre !== 'N/A' ? data.Genre : null
      },
      enabled: !!title,
      staleTime: 24 * 60 * 60 * 1000,
    })

    return { data: data || null, isLoading, error }
  }

  return {
    getPosterUrl,
    getSynopsis,
    getGenre,
  }
}
