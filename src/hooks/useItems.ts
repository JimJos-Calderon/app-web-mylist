import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/supabaseClient'
import { ERROR_MESSAGES } from '@constants/index'
import { ListItem } from '@typings/index'
import { queryKeys } from '@config/queryKeys'

interface UseItemsReturn {
  items: ListItem[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  addItem: (item: Omit<ListItem, 'id' | 'created_at'>) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  toggleVisto: (id: string, currentState: boolean) => Promise<void>
  updateItem: (id: string, updates: Partial<ListItem>) => Promise<void>
  isAddingItem: boolean
  isDeletingItem: boolean
  isUpdatingItem: boolean
}

/**
 * Hook para gestionar items de una lista específica
 * Lectura con useQuery + Mutaciones con useMutation
 * Soporta realtime updates desde Supabase
 */
export const useItems = (
  tipo: 'pelicula' | 'serie',
  userId: string,
  listId?: string
): UseItemsReturn => {
  const queryClient = useQueryClient()

  // Query para obtener los items
  const {
    data: items = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.items.byList(tipo, listId || ''),
    queryFn: async () => {
      if (!userId || !listId) {
        return []
      }

      const { data, error: fetchError } = await supabase
        .from('items')
        .select('*')
        .eq('tipo', tipo)
        .eq('list_id', listId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      return (data || []) as ListItem[]
    },
    enabled: !!userId && !!listId,
  })

  // Setup realtime listener para actualizaciones automáticas
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
        (_payload) => {
          // Invalidar la query para re-fetchear
          queryClient.invalidateQueries({
            queryKey: queryKeys.items.byList(tipo, listId),
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tipo, listId, userId, queryClient])

  // ─── MUTACIÓN: Agregar Item ───────────────────────────────────
  const addItemMutation = useMutation({
    mutationFn: async (item: Omit<ListItem, 'id' | 'created_at'>) => {
      const { error: insertError } = await supabase
        .from('items')
        .insert([item])

      if (insertError) throw insertError
    },
    onSuccess: () => {
      // Invalidar y re-fetchear items
      queryClient.invalidateQueries({
        queryKey: queryKeys.items.byList(tipo, listId || ''),
      })
    },
    onError: (error) => {
      console.error('Error adding item:', error)
    },
  })

  // ─── MUTACIÓN: Eliminar Item ──────────────────────────────────
  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error: deleteError } = await supabase
        .from('items')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError
    },
    onSuccess: () => {
      // Invalidar y re-fetchear items
      queryClient.invalidateQueries({
        queryKey: queryKeys.items.byList(tipo, listId || ''),
      })
    },
    onError: (error) => {
      console.error('Error deleting item:', error)
    },
  })

  // ─── MUTACIÓN: Toggle Visto ────────────────────────────────────
  const toggleVistoMutation = useMutation({
    mutationFn: async ({ id, currentState }: { id: string; currentState: boolean }) => {
      const { error: updateError } = await supabase
        .from('items')
        .update({ visto: !currentState })
        .eq('id', id)

      if (updateError) throw updateError
    },
    onSuccess: () => {
      // Invalidar y re-fetchear items
      queryClient.invalidateQueries({
        queryKey: queryKeys.items.byList(tipo, listId || ''),
      })
    },
    onError: (error) => {
      console.error('Error toggling visto:', error)
    },
  })

  // ─── MUTACIÓN: Actualizar Item ────────────────────────────────
  const updateItemMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ListItem> }) => {
      const { error: updateError } = await supabase
        .from('items')
        .update(updates)
        .eq('id', id)

      if (updateError) throw updateError
    },
    onSuccess: () => {
      // Invalidar y re-fetchear items
      queryClient.invalidateQueries({
        queryKey: queryKeys.items.byList(tipo, listId || ''),
      })
    },
    onError: (error) => {
      console.error('Error updating item:', error)
    },
  })

  const refetchItems = async () => {
    await refetch()
  }

  return {
    items,
    loading,
    error: error?.message || null,
    refetch: refetchItems,
    addItem: (item) => addItemMutation.mutateAsync(item),
    deleteItem: (id) => deleteItemMutation.mutateAsync(id),
    toggleVisto: (id, currentState) =>
      toggleVistoMutation.mutateAsync({ id, currentState }),
    updateItem: (id, updates) =>
      updateItemMutation.mutateAsync({ id, updates }),
    isAddingItem: addItemMutation.isPending,
    isDeletingItem: deleteItemMutation.isPending,
    isUpdatingItem:
      updateItemMutation.isPending || toggleVistoMutation.isPending,
  }
}
