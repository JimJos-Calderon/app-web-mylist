import type { PersistQueryClientOptions } from '@tanstack/react-query-persist-client'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { capacitorStorage } from './capacitorStorage'

const QUERY_CACHE_KEY = 'mylist-react-query-cache-v1'

const persister = createAsyncStoragePersister({
  storage: capacitorStorage,
  key: QUERY_CACHE_KEY,
  throttleTime: 1000,
})

const isOfflineReadableKey = (queryKey: readonly unknown[]) => {
  const root = queryKey[0]
  return (
    root === 'lists' ||
    root === 'items' ||
    root === 'userProfile' ||
    root === 'translations'
  )
}

export const persistOptions: Omit<PersistQueryClientOptions, 'queryClient'> = {
  persister,
  maxAge: 24 * 60 * 60 * 1000, // 24h
  dehydrateOptions: {
    shouldDehydrateQuery: (query) => isOfflineReadableKey(query.queryKey),
  },
}

export const clearPersistedQueryCache = async () => {
  await capacitorStorage.removeItem(QUERY_CACHE_KEY)
}