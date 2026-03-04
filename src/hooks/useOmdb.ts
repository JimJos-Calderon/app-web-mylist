import { useQuery } from '@tanstack/react-query'
import { OmdbResponse } from '@/types'
import { ERROR_MESSAGES } from '@constants/index'
import { queryKeys } from '@config/queryKeys'
import { supabase } from '@/supabaseClient'

interface UseOmdbReturn {
  getPosterUrl: (title: string) => { data: string | null; isLoading: boolean; error: Error | null }
  getSynopsis: (title: string) => { data: string | null; isLoading: boolean; error: Error | null }
  getGenre: (title: string) => { data: string | null; isLoading: boolean; error: Error | null }
}

/**
 * Hook para obtener datos de OMDB API
 * Usa useQuery para cachear los resultados y evitar repeated requests
 * Ahora utiliza la Edge Function de Supabase para mantener la API key segura en el servidor
 */
export const useOmdb = (): UseOmdbReturn => {

  const fetchFromOmdb = async (title: string): Promise<OmdbResponse> => {
    // Llamar a la Edge Function de Supabase en lugar de OMDB directamente
    const { data, error } = await supabase.functions.invoke('search-omdb', {
      body: {
        query: title,
        type: 'movie',
        page: 1,
      },
    })

    if (error) {
      throw new Error(error.message || ERROR_MESSAGES.SEARCH_SUGGESTIONS)
    }

    if (data.Response === 'False' || data.Error) {
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
