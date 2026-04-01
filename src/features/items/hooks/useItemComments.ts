import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth'
import { queryKeys } from '@config/queryKeys'
import { supabase } from '@/supabaseClient'

export interface ItemComment {
  id: string
  item_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
}

interface UseItemCommentsReturn {
  comment: ItemComment | null
  loading: boolean
  error: string | null
  createComment: (content: string) => Promise<ItemComment>
  updateComment: (content: string) => Promise<ItemComment>
  saveComment: (content: string) => Promise<ItemComment>
  deleteComment: () => Promise<void>
  isCreatingComment: boolean
  isUpdatingComment: boolean
  isDeletingComment: boolean
}

const normalizeContent = (content: string) => content.trim()

export const useItemComments = (itemId?: string): UseItemCommentsReturn => {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const queryKey = queryKeys.itemComments.byItemAndUser(itemId || '', user?.id || '')

  const {
    data: comment = null,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!itemId || !user?.id) return null

      const { data, error: fetchError } = await supabase
        .from('item_comments')
        .select('*')
        .eq('item_id', itemId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (fetchError) throw fetchError

      return (data as ItemComment) ?? null
    },
    enabled: !!itemId && !!user?.id,
  })

  const invalidateCommentQueries = async () => {
    await queryClient.invalidateQueries({
      queryKey,
    })
    await queryClient.invalidateQueries({
      queryKey: queryKeys.itemComments.byItem(itemId || ''),
    })
  }

  const createCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user?.id || !itemId) {
        throw new Error('Debes iniciar sesión para comentar este item')
      }

      const normalizedContent = normalizeContent(content)
      if (!normalizedContent) {
        throw new Error('El comentario no puede estar vacío')
      }

      const { data, error: insertError } = await supabase
        .from('item_comments')
        .insert({
          item_id: itemId,
          user_id: user.id,
          content: normalizedContent,
        })
        .select()
        .single()

      if (insertError) throw insertError

      return data as ItemComment
    },
    onSuccess: async () => {
      await invalidateCommentQueries()
    },
  })

  const updateCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!comment?.id) {
        throw new Error('No existe un comentario previo para editar')
      }

      const normalizedContent = normalizeContent(content)
      if (!normalizedContent) {
        throw new Error('El comentario no puede estar vacío')
      }

      const { data, error: updateError } = await supabase
        .from('item_comments')
        .update({
          content: normalizedContent,
        })
        .eq('id', comment.id)
        .select()
        .single()

      if (updateError) throw updateError

      return data as ItemComment
    },
    onSuccess: async () => {
      await invalidateCommentQueries()
    },
  })

  const deleteCommentMutation = useMutation({
    mutationFn: async () => {
      if (!comment?.id) return

      const { error: deleteError } = await supabase
        .from('item_comments')
        .delete()
        .eq('id', comment.id)

      if (deleteError) throw deleteError
    },
    onSuccess: async () => {
      await invalidateCommentQueries()
    },
  })

  const saveComment = async (content: string) => {
    if (comment) {
      return updateCommentMutation.mutateAsync(content)
    }

    return createCommentMutation.mutateAsync(content)
  }

  return {
    comment,
    loading,
    error: error instanceof Error ? error.message : null,
    createComment: (content) => createCommentMutation.mutateAsync(content),
    updateComment: (content) => updateCommentMutation.mutateAsync(content),
    saveComment,
    deleteComment: () => deleteCommentMutation.mutateAsync(),
    isCreatingComment: createCommentMutation.isPending,
    isUpdatingComment: updateCommentMutation.isPending,
    isDeletingComment: deleteCommentMutation.isPending,
  }
}
