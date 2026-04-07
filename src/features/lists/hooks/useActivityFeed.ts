import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/supabaseClient'
import { queryKeys } from '@config/queryKeys'

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 50

export interface ActivityFeedEvent {
  activity_id: number
  created_at: string
  actor_user_id: string
  actor_name: string
  /** URL pública del avatar (user_profiles.avatar_url). */
  avatar_url?: string | null
  table_name: 'items' | 'lists' | 'item_ratings' | 'item_comments' | 'list_members' | string
  action: 'INSERT' | 'UPDATE' | 'DELETE' | string
  action_key: string
  record_id: string
  item_id: string | null
  item_title: string | null
  /** Póster del ítem (items.poster_url). */
  item_poster_url?: string | null
  list_id: string | null
  list_name: string | null
  /** Solo filas de item_ratings. */
  rating?: number | null
  /** Solo filas de item_comments. */
  comment_text?: string | null
}

/** Alias solicitado para capas de UI / documentación. */
export type ActivityEvent = ActivityFeedEvent

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
  const queryClient = useQueryClient()

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

      let events = (data || []) as ActivityFeedEvent[]
      
      // Fallback: If list_name is missing but we have a list_id, fetch it
      const missingListIds = [...new Set(events.filter(e => !e.list_name && e.list_id).map(e => e.list_id))]
      if (missingListIds.length > 0) {
        const { data: listData } = await supabase
          .from('lists')
          .select('id, name')
          .in('id', missingListIds as string[])
          
        if (listData) {
          const listMap = new Map(listData.map(l => [l.id, l.name]))
          events = events.map(e => {
            if (!e.list_name && e.list_id && listMap.has(e.list_id)) {
              return { ...e, list_name: listMap.get(e.list_id) as string }
            }
            return e
          })
        }
      }

      return events
    },
    enabled,
  })

  // Setup realtime listener para actualizaciones automáticas en activity feed
  useEffect(() => {
    if (!enabled) return

    const channelName = `activity_feed:${listId || 'all'}`
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'audit_logs',
        },
        (_payload) => {
          // Invalidar la query para re-fetchear
          queryClient.invalidateQueries({
            queryKey: queryKeys.lists.activityFeed(listId ?? 'all', limit),
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [listId, enabled, limit, queryClient])

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
