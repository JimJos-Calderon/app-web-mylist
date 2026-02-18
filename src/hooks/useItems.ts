import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/supabaseClient'
import { ListItem, ApiError } from '@types/index'
import { ERROR_MESSAGES } from '@constants/index'

interface UseItemsReturn {
  items: ListItem[]
  loading: boolean
  error: string | null
  addItem: (item: Omit<ListItem, 'id' | 'created_at'>) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  toggleVisto: (id: string, currentState: boolean) => Promise<void>
  updateItem: (id: string, updates: Partial<ListItem>) => Promise<void>
  refetch: () => Promise<void>
  clearError: () => void
}

export const useItems = (tipo: 'pelicula' | 'serie', userId: string): UseItemsReturn => {
  const [items, setItems] = useState<ListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchItems = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    try {
      const { data, error: fetchError } = await supabase
        .from('items')
        .select('*')
        .eq('tipo', tipo)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setItems((data || []) as ListItem[])
      setError(null)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : ERROR_MESSAGES.FETCH_ITEMS
      setError(message)
      console.error('Fetch items error:', err)
    } finally {
      setLoading(false)
    }
  }, [tipo, userId])

  // Subscribe to realtime changes
  useEffect(() => {
    fetchItems()

    // Setup realtime listener
    const channel = supabase
      .channel(`items:${tipo}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'items',
          filter: `tipo=eq.${tipo}`,
        },
        (_payload) => {
          // Refetch when changes occur
          fetchItems()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tipo, fetchItems])

  const addItem = useCallback(
    async (item: Omit<ListItem, 'id' | 'created_at'>) => {
      try {
        const { error: insertError } = await supabase
          .from('items')
          .insert([item])

        if (insertError) throw insertError

        await fetchItems()
      } catch (err) {
        const message =
          err instanceof Error ? err.message : ERROR_MESSAGES.ADD_ITEM
        setError(message)
        throw err
      }
    },
    [fetchItems]
  )

  const deleteItem = useCallback(
    async (id: string) => {
      try {
        const { error: deleteError } = await supabase
          .from('items')
          .delete()
          .eq('id', id)

        if (deleteError) throw deleteError

        await fetchItems()
      } catch (err) {
        const message =
          err instanceof Error ? err.message : ERROR_MESSAGES.DELETE_ITEM
        setError(message)
        throw err
      }
    },
    [fetchItems]
  )

  const toggleVisto = useCallback(
    async (id: string, currentState: boolean) => {
      try {
        const { error: updateError } = await supabase
          .from('items')
          .update({ visto: !currentState })
          .eq('id', id)

        if (updateError) throw updateError

        await fetchItems()
      } catch (err) {
        const message =
          err instanceof Error ? err.message : ERROR_MESSAGES.UPDATE_ITEM
        setError(message)
        throw err
      }
    },
    [fetchItems]
  )

  const updateItem = useCallback(
    async (id: string, updates: Partial<ListItem>) => {
      try {
        const { error: updateError } = await supabase
          .from('items')
          .update(updates)
          .eq('id', id)

        if (updateError) throw updateError

        await fetchItems()
      } catch (err) {
        const message =
          err instanceof Error ? err.message : ERROR_MESSAGES.UPDATE_ITEM
        setError(message)
        throw err
      }
    },
    [fetchItems]
  )

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    items,
    loading,
    error,
    addItem,
    deleteItem,
    toggleVisto,
    updateItem,
    refetch: fetchItems,
    clearError,
  }
}
