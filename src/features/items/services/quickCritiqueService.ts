import { supabase } from '@/supabaseClient'

export async function saveQuickCritique(
  itemId: string,
  rating: number,
  liked: boolean
): Promise<void> {
  const { error } = await supabase.rpc('save_quick_critique', {
    p_item_id: itemId,
    p_rating: rating,
    p_liked: liked,
  })
  if (error) throw error
}
