import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/config/queryKeys'
import type { ListItem } from '@/features/shared'
import { resolveItemWatchProviders } from '../services/tmdbService'

export function useItemWatchProviders(item: ListItem | null, enabled: boolean, uiLanguage: string) {
  const hasToken = Boolean(import.meta.env.VITE_TMDB_ACCESS_TOKEN?.trim())

  return useQuery({
    queryKey: queryKeys.items.watchProviders(item?.id ?? '_', item?.tipo ?? 'pelicula', uiLanguage),
    queryFn: () => resolveItemWatchProviders(item!, uiLanguage),
    enabled: Boolean(enabled && item && hasToken),
    staleTime: 1000 * 60 * 60,
  })
}
