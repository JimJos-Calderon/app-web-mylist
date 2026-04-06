import { supabase } from '@/supabaseClient'

const MAX_COMMENT_LEN = 2000

export async function saveQuickCritique(
  itemId: string,
  rating: number,
  liked: boolean,
  comment?: string | null
): Promise<void> {
  const trimmed = comment?.trim() ?? ''
  if (trimmed.length > MAX_COMMENT_LEN) {
    throw new Error(`El comentario no puede superar ${MAX_COMMENT_LEN} caracteres.`)
  }

  const { error } = await supabase.rpc('save_quick_critique', {
    p_item_id: itemId,
    p_rating: rating,
    p_liked: liked,
    p_comment: trimmed.length > 0 ? trimmed : null,
  })
  if (error) throw error
}
