import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/supabaseClient'
import { useAuth } from './useAuth'

export interface ItemRating {
  id: string
  item_id: number
  user_id: string
  rating: number | null
  liked: boolean | null
  created_at: string
  updated_at: string
}

export const useItemRating = (itemId: string) => {
  const { user } = useAuth()
  const [rating, setRating] = useState<ItemRating | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch rating on mount or when itemId/userId changes
  useEffect(() => {
    const fetchRating = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('item_ratings')
          .select('*')
          .eq('item_id', itemId)
          .eq('user_id', user.id)
          .maybeSingle()

        if (error) throw error

        setRating(data ?? null)
        setError(null)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al cargar calificación'
        setError(message)
        console.error('Fetch rating error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchRating()
  }, [itemId, user?.id])

  // Update rating (stars: 0-5)
  const updateRating = useCallback(
    async (stars: number) => {
      if (!user?.id) {
        setError('Debes iniciar sesión')
        return
      }

      try {
        setError(null)

        if (rating) {
          // Update existing
          const { data, error } = await supabase
            .from('item_ratings')
            .update({
              rating: stars,
              updated_at: new Date().toISOString(),
            })
            .eq('id', rating.id)
            .select()
            .single()

          if (error) throw error
          setRating(data)
        } else {
          // Insert new
          const { data, error } = await supabase
            .from('item_ratings')
            .insert([
              {
                item_id: itemId,
                user_id: user.id,
                rating: stars,
                liked: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ])
            .select()
            .single()

          if (error) throw error
          setRating(data)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al guardar calificación'
        setError(message)
        console.error('Update rating error:', err)
      }
    },
    [itemId, user?.id, rating]
  )

  // Update like/dislike
  const updateLike = useCallback(
    async (liked: boolean | null) => {
      if (!user?.id) {
        setError('Debes iniciar sesión')
        return
      }

      try {
        setError(null)

        if (rating) {
          // Update existing
          const { data, error } = await supabase
            .from('item_ratings')
            .update({
              liked: liked,
              updated_at: new Date().toISOString(),
            })
            .eq('id', rating.id)
            .select()
            .single()

          if (error) throw error
          setRating(data)
        } else {
          // Insert new
          const { data, error } = await supabase
            .from('item_ratings')
            .insert([
              {
                item_id: itemId,
                user_id: user.id,
                rating: null,
                liked: liked,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ])
            .select()
            .single()

          if (error) throw error
          setRating(data)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al guardar valoración'
        setError(message)
        console.error('Update like error:', err)
      }
    },
    [itemId, user?.id, rating]
  )

  return {
    rating,
    loading,
    error,
    updateRating,
    updateLike,
  }
}
