import { OmdbResponse } from '@/features/shared'

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
    fetchPlot,
  }
}
