import { useQuery } from '@tanstack/react-query'
import { OmdbResponse } from '@/types'
import { ERROR_MESSAGES } from '@constants/index'
import { queryKeys } from '@config/queryKeys'
import { supabase } from '@/supabaseClient'

interface UseOmdbReturn {
  getPosterUrl: (title: string) => { data: string | null; isLoading: boolean; error: Error | null }
  getSynopsis: (title: string) => { data: string | null; isLoading: boolean; error: Error | null }
  getGenre: (title: string) => { data: string | null; isLoading: boolean; error: Error | null }
  fetchPlot: (title: string) => Promise<string | null>
}

/**
 * Hook para obtener datos de OMDB API
 * Usa useQuery para cachear los resultados y evitar repeated requests
 * Ahora utiliza la Edge Function de Supabase para mantener la API key segura en el servidor
 */
export const useOmdb = (): UseOmdbReturn => {

  const fetchFromOmdb = async (title: string): Promise<OmdbResponse> => {
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
          query: title,
          type: 'movie',
          page: 1,
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data: OmdbResponse = await response.json()

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

  /** Plain async function — safe to call from event handlers (no hooks). */
  const fetchPlot = async (title: string): Promise<string | null> => {
    const response = await fetch(
      'https://lpaysuasdjgajiftyush.supabase.co/functions/v1/search-omdb',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwYXlzdWFzZGpnYWppZnR5dXNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDgyNzUxNDIsImV4cCI6MTk5Mzg1MTE0Mn0.I6I8scpqFLX0xc7OgPRQvQ5zBBBEO1_4rCjQhljW6lI',
        },
        body: JSON.stringify({ query: title, type: 'movie', mode: 'detail' }),
      }
    )
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    const data: OmdbResponse = await response.json()
    return data.Plot && data.Plot !== 'N/A' ? data.Plot : null
  }

  return {
    getPosterUrl,
    getSynopsis,
    getGenre,
    fetchPlot,
  }
}
