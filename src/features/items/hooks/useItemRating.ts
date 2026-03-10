import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/supabaseClient'
import { useAuth } from '@/features/auth'

export interface ItemRating {
  id: string
  item_id: number
  user_id: string
  rating: number | null
  liked: boolean | null
  created_at: string
  updated_at: string
}

interface UseItemRatingReturn {
  rating: ItemRating | null
  loading: boolean
  error: string | null
  updateRating: (stars: number) => Promise<ItemRating>
  updateLike: (liked: boolean | null) => Promise<ItemRating>
  isUpdatingRating: boolean
  isUpdatingLike: boolean
}

/**
 * Hook para gestionar el rating y likes de items
 * Lectura con useQuery + Mutaciones con useMutation
 */
export const useItemRating = (itemId: string): UseItemRatingReturn => {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Query para obtener el rating del item
  const {
    data: rating = null,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ['itemRating', itemId, user?.id],
    queryFn: async () => {
      if (!user?.id) {
        return null
      }

      const { data, error: fetchError } = await supabase
        .from('item_ratings')
        .select('*')
        .eq('item_id', itemId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (fetchError) throw fetchError

      return (data as ItemRating) ?? null
    },
    enabled: !!user?.id && !!itemId,
  })

  // ─── MUTACIÓN: Actualizar Rating ──────────────────────────────
  const updateRatingMutation = useMutation({
    mutationFn: async (stars: number) => {
      if (!user?.id) {
        throw new Error('Debes iniciar sesión')
      }

      if (rating) {
        // Update existing
        const { data, error: updateError } = await supabase
          .from('item_ratings')
          .update({
            rating: stars,
            updated_at: new Date().toISOString(),
          })
          .eq('id', rating.id)
          .select()
          .single()

        if (updateError) throw updateError
        return data as ItemRating
      } else {
        // Insert new
        const { data, error: insertError } = await supabase
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

        if (insertError) throw insertError
        return data as ItemRating
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['itemRating', itemId, user?.id],
      })
    },
  })

  // ─── MUTACIÓN: Actualizar Like ────────────────────────────────
  const updateLikeMutation = useMutation({
    mutationFn: async (liked: boolean | null) => {
      if (!user?.id) {
        throw new Error('Debes iniciar sesión')
      }

      if (rating) {
        // Update existing
        const { data, error: updateError } = await supabase
          .from('item_ratings')
          .update({
            liked: liked,
            updated_at: new Date().toISOString(),
          })
          .eq('id', rating.id)
          .select()
          .single()

        if (updateError) throw updateError
        return data as ItemRating
      } else {
        // Insert new
        const { data, error: insertError } = await supabase
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

        if (insertError) throw insertError
        return data as ItemRating
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['itemRating', itemId, user?.id],
      })
    },
  })

  return {
    rating,
    loading,
    error: error?.message || null,
    updateRating: (stars) => updateRatingMutation.mutateAsync(stars),
    updateLike: (liked) => updateLikeMutation.mutateAsync(liked),
    isUpdatingRating: updateRatingMutation.isPending,
    isUpdatingLike: updateLikeMutation.isPending,
  }
}
