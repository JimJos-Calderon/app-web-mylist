import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/supabaseClient'
import { queryKeys } from '@config/queryKeys'

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 50

export interface ActivityFeedEvent {
  activity_id: number
  created_at: string
  actor_user_id: string
  actor_name: string
  table_name: 'items' | 'lists' | 'item_ratings' | 'list_members' | string
  action: 'INSERT' | 'UPDATE' | 'DELETE' | string
  action_key: string
  record_id: string
  item_id: string | null
  item_title: string | null
  list_id: string | null
  list_name: string | null
}

interface UseActivityFeedOptions {
  listId?: string
  limit?: number
  enabled?: boolean
}

interface UseActivityFeedReturn {
  events: ActivityFeedEvent[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

const normalizeLimit = (limit?: number): number => {
  if (!Number.isFinite(limit)) {
    return DEFAULT_LIMIT
  }

  const safeLimit = Math.floor(limit as number)
  return Math.min(Math.max(safeLimit, 1), MAX_LIMIT)
}

export const useActivityFeed = (options: UseActivityFeedOptions = {}): UseActivityFeedReturn => {
  const { listId, enabled = true } = options
  const limit = normalizeLimit(options.limit)

  const {
    data: events = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.lists.activityFeed(listId ?? 'all', limit),
    queryFn: async () => {
      let query = supabase
        .from('activity_feed_view')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (listId) {
        query = query.eq('list_id', listId)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      return (data || []) as ActivityFeedEvent[]
    },
    enabled,
  })

  const refetchActivityFeed = async () => {
    await refetch()
  }

  return {
    events,
    loading,
    error: error?.message || null,
    refetch: refetchActivityFeed,
  }
}
