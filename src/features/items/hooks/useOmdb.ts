import { OmdbResponse } from '@/features/shared'
import { supabase } from '@/supabaseClient'

interface UseOmdbReturn {
  fetchPlot: (title: string) => Promise<string | null>
}

/**
 * Hook para obtener datos de OMDB API
 * Usa useQuery para cachear los resultados y evitar repeated requests
 * Ahora utiliza la Edge Function de Supabase para mantener la API key segura en el servidor
 */
export const useOmdb = (): UseOmdbReturn => {
  /** Plain async function — safe to call from event handlers (no hooks). */
  const fetchPlot = async (title: string): Promise<string | null> => {
    const { data, error } = await supabase.functions.invoke('search-omdb', {
      body: { query: title, type: 'movie', mode: 'detail' },
    })

    if (error) {
      throw new Error(error.message || 'Failed to fetch OMDB plot')
    }

    const omdbData = data as OmdbResponse
    return omdbData.Plot && omdbData.Plot !== 'N/A' ? omdbData.Plot : null
  }

  return {
    fetchPlot,
  }
}
