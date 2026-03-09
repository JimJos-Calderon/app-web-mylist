import type { PersistQueryClientOptions } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'

const QUERY_CACHE_KEY = 'mylist-react-query-cache-v1'

const persister = createSyncStoragePersister({
  storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  key: QUERY_CACHE_KEY,
  throttleTime: 1000,
})

const isOfflineReadableKey = (queryKey: readonly unknown[]) => {
  const root = queryKey[0]
  return root === 'lists' || root === 'items' || root === 'userProfile'
}

export const persistOptions: Omit<PersistQueryClientOptions, 'queryClient'> = {
  persister,
  maxAge: 24 * 60 * 60 * 1000, // 24h
  dehydrateOptions: {
    shouldDehydrateQuery: (query) => isOfflineReadableKey(query.queryKey),
  },
}

export const clearPersistedQueryCache = () => {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(QUERY_CACHE_KEY)
  }
}