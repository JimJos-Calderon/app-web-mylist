import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/supabaseClient'
import { ListItem } from '@/features/shared'
import { queryKeys } from '@config/queryKeys'
import { saveQuickCritique } from '../services/quickCritiqueService'
import { setUserItemWatched } from '../services/itemUserWatchService'
import { mergeUserWatchIntoItems } from '../utils/mergeUserWatchIntoItems'
import { isDuplicateItemConstraintError } from '../utils/isDuplicateItemConstraintError'
import { normalizeItemTitleForStorage } from '../utils/normalizeItemTitleForStorage'

export type ItemsListQueryData = {
  items: ListItem[]
  listMemberCount: number
}

interface UseItemsReturn {
  items: ListItem[]
  listMemberCount: number
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  addItem: (item: Omit<ListItem, 'id' | 'created_at'>) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  toggleVisto: (id: string, currentState: boolean) => Promise<void>
  updateItem: (id: string, updates: Partial<ListItem>) => Promise<void>
  quickCritiqueAndWatch: (args: {
    itemId: string
    rating: number
    liked: boolean
    comment?: string | null
  }) => Promise<void>
  isAddingItem: boolean
  isDeletingItem: boolean
  isUpdatingItem: boolean
  reorderItems: (orderedIds: string[]) => Promise<void>
  isReorderingItems: boolean
}

function attachWatchGroupToItems(
  items: ListItem[],
  watchedByItemId: Map<string, number>,
  listMemberCount: number,
): ListItem[] {
  if (listMemberCount <= 1) {
    return items
  }
  return items.map((item) => ({
    ...item,
    watch_group: {
      watched: watchedByItemId.get(String(item.id)) ?? 0,
      total: listMemberCount,
    },
  }))
}

/**
 * Hook para gestionar items de una lista específica
 * Lectura con useQuery + Mutaciones con useMutation
 * Soporta realtime updates desde Supabase
 */
export const useItems = (
  tipo: 'pelicula' | 'serie',
  userId: string,
  listId?: string,
): UseItemsReturn => {
  const queryClient = useQueryClient()

  const {
    data,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.items.byList(tipo, listId || ''),
    queryFn: async (): Promise<ItemsListQueryData> => {
      if (!userId || !listId) {
        return { items: [], listMemberCount: 0 }
      }

      const { data: rawRows, error: fetchError } = await supabase
        .from('items')
        .select('*')
        .eq('tipo', tipo)
        .eq('list_id', listId)
        .order('sort_index', { ascending: true })
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      const rows = (rawRows || []) as ListItem[]
      const ids = rows.map((r) => r.id).filter(Boolean)

      const { count: memberCount, error: memberErr } = await supabase
        .from('list_members')
        .select('*', { count: 'exact', head: true })
        .eq('list_id', listId)

      if (memberErr) throw memberErr

      const listMemberCount = memberCount ?? 0

      if (ids.length === 0) {
        return { items: [], listMemberCount }
      }

      const [userWatchRes, groupWatchRes] = await Promise.all([
        supabase
          .from('item_user_watch')
          .select('item_id, watched')
          .eq('user_id', userId)
          .in('item_id', ids),
        supabase
          .from('item_user_watch')
          .select('item_id')
          .eq('watched', true)
          .in('item_id', ids),
      ])

      if (userWatchRes.error) throw userWatchRes.error
      if (groupWatchRes.error) throw groupWatchRes.error

      const withUserVisto = mergeUserWatchIntoItems(rows, userWatchRes.data ?? [])

      const watchedByItemId = new Map<string, number>()
      for (const r of groupWatchRes.data ?? []) {
        const id = String((r as { item_id: string | number }).item_id)
        watchedByItemId.set(id, (watchedByItemId.get(id) ?? 0) + 1)
      }

      const items = attachWatchGroupToItems(withUserVisto, watchedByItemId, listMemberCount)

      return { items, listMemberCount }
    },
    enabled: !!userId && !!listId,
  })

  const items = data?.items ?? []
  const listMemberCount = data?.listMemberCount ?? 0

  useEffect(() => {
    if (!userId || !listId) return

    const channelName = `items:${tipo}:${listId}`
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'items',
          filter: `tipo=eq.${tipo},list_id=eq.${listId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: queryKeys.items.byList(tipo, listId),
          })
        },
      )
      .subscribe()

    const key = queryKeys.items.byList(tipo, listId)
    const watchChannel = supabase
      .channel(`item_user_watch_list:${listId}:${tipo}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'item_user_watch',
        },
        (payload) => {
          const row = (payload.new ?? payload.old) as { item_id?: string | number } | undefined
          const itemId = row?.item_id
          if (itemId == null) return
          const cached = queryClient.getQueryData<ItemsListQueryData>(key)
          if (!cached?.items.some((i) => String(i.id) === String(itemId))) return
          queryClient.invalidateQueries({ queryKey: key })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(watchChannel)
    }
  }, [tipo, listId, userId, queryClient])

  const addItemMutation = useMutation({
    mutationFn: async (item: Omit<ListItem, 'id' | 'created_at'>) => {
      const payload = {
        ...item,
        titulo: normalizeItemTitleForStorage(item.titulo),
      }

      const { data: maxRow, error: maxErr } = await supabase
        .from('items')
        .select('sort_index')
        .eq('list_id', payload.list_id)
        .eq('tipo', payload.tipo)
        .order('sort_index', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (maxErr) throw maxErr
      const nextSort = typeof maxRow?.sort_index === 'number' ? maxRow.sort_index + 1 : 0

      const { error: insertError } = await supabase
        .from('items')
        .insert([{ ...payload, sort_index: nextSort, tags: payload.tags ?? [] }])

      if (insertError) throw insertError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.items.byList(tipo, listId || ''),
      })
    },
    onError: (mutationError) => {
      if (isDuplicateItemConstraintError(mutationError)) return
      console.error('Error adding item:', mutationError)
    },
  })

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error: deleteError } = await supabase.from('items').delete().eq('id', id)

      if (deleteError) throw deleteError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.items.byList(tipo, listId || ''),
      })
    },
    onError: (mutationError) => {
      console.error('Error deleting item:', mutationError)
    },
  })

  const toggleVistoMutation = useMutation({
    mutationFn: async ({ id, currentState }: { id: string; currentState: boolean }) => {
      if (!userId) {
        throw new Error('Sesión requerida')
      }
      await setUserItemWatched(id, userId, !currentState)
    },
    onMutate: async ({ id, currentState }) => {
      const key = queryKeys.items.byList(tipo, listId || '')
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<ItemsListQueryData>(key)

      if (previous) {
        const nextWatched = !currentState
        queryClient.setQueryData<ItemsListQueryData>(key, {
          ...previous,
          items: previous.items.map((item) => {
            if (item.id !== id) return item
            let watch_group = item.watch_group
            if (watch_group && watch_group.total > 1) {
              const delta = nextWatched ? 1 : -1
              watch_group = {
                ...watch_group,
                watched: Math.min(
                  watch_group.total,
                  Math.max(0, watch_group.watched + delta),
                ),
              }
            }
            return { ...item, visto: nextWatched, watch_group }
          }),
        })
      }
      return { previous, key }
    },
    onError: (err, _vars, context) => {
      console.error('Error toggling visto:', err)
      alert(`No se pudo marcar: ${err instanceof Error ? err.message : String(err)} (Podría ser un problema de permisos en la lista)`)
      if (context?.previous) {
        queryClient.setQueryData(context.key, context.previous)
      }
    },
    onSettled: (_data, _err, _vars, context) => {
      if (context?.key) {
        queryClient.invalidateQueries({ queryKey: context.key })
      }
    },
  })

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ListItem> }) => {
      const { error: updateError } = await supabase.from('items').update(updates).eq('id', id)

      if (updateError) throw updateError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.items.byList(tipo, listId || ''),
      })
    },
    onError: (mutationError) => {
      console.error('Error updating item:', mutationError)
    },
  })

  const quickCritiqueMutation = useMutation({
    mutationFn: async ({
      itemId,
      rating,
      liked,
      comment,
    }: {
      itemId: string
      rating: number
      liked: boolean
      comment?: string | null
    }) => {
      await saveQuickCritique(itemId, rating, liked, comment)
    },
    onMutate: async ({ itemId }) => {
      const key = queryKeys.items.byList(tipo, listId || '')
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<ItemsListQueryData>(key)
      if (previous) {
        queryClient.setQueryData<ItemsListQueryData>(key, {
          ...previous,
          items: previous.items.map((item) => {
            if (item.id !== itemId) return item
            let watch_group = item.watch_group
            if (watch_group && watch_group.total > 1 && !item.visto) {
              watch_group = {
                ...watch_group,
                watched: Math.min(watch_group.total, watch_group.watched + 1),
              }
            }
            return { ...item, visto: true, watch_group }
          }),
        })
      }
      return { previous, key }
    },
    onError: (err, _vars, context) => {
      console.error('quickCritique error:', err)
      if (context?.previous && context.key) {
        queryClient.setQueryData(context.key, context.previous)
      }
    },
    onSettled: (_data, _err, vars) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.items.byList(tipo, listId || ''),
      })
      if (vars?.itemId) {
        queryClient.invalidateQueries({
          queryKey: ['itemRating', vars.itemId, userId],
        })
        queryClient.invalidateQueries({
          queryKey: queryKeys.itemComments.byItemAndUser(vars.itemId, userId),
        })
        queryClient.invalidateQueries({
          queryKey: queryKeys.itemComments.byItem(vars.itemId),
        })
      }
      queryClient.invalidateQueries({
        queryKey: queryKeys.oracle.allRatingsForUser(userId),
      })
    },
  })

  const reorderItemsMutation = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      for (let idx = 0; idx < orderedIds.length; idx++) {
        const id = orderedIds[idx]
        const { error } = await supabase.from('items').update({ sort_index: idx }).eq('id', id)
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.items.byList(tipo, listId || ''),
      })
    },
    onError: (e) => {
      console.error('reorderItems:', e)
    },
  })

  const refetchItems = async () => {
    await refetch()
  }

  return {
    items,
    listMemberCount,
    loading,
    error: error?.message || null,
    refetch: refetchItems,
    addItem: (item) => addItemMutation.mutateAsync(item),
    deleteItem: (id) => deleteItemMutation.mutateAsync(id),
    toggleVisto: (id, currentState) => toggleVistoMutation.mutateAsync({ id, currentState }),
    updateItem: (id, updates) => updateItemMutation.mutateAsync({ id, updates }),
    quickCritiqueAndWatch: (args) => quickCritiqueMutation.mutateAsync(args),
    reorderItems: (orderedIds) => reorderItemsMutation.mutateAsync(orderedIds),
    isAddingItem: addItemMutation.isPending,
    isDeletingItem: deleteItemMutation.isPending,
    isUpdatingItem:
      updateItemMutation.isPending ||
      toggleVistoMutation.isPending ||
      quickCritiqueMutation.isPending ||
      reorderItemsMutation.isPending,
    isSavingQuickCritique: quickCritiqueMutation.isPending,
    isReorderingItems: reorderItemsMutation.isPending,
  }
}
