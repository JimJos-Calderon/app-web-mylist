import { supabase } from '@/supabaseClient'

/** Marca visto (true) o no visto (false) solo para el usuario actual. */
export async function setUserItemWatched(
  itemId: string,
  userId: string,
  watched: boolean,
): Promise<void> {
  if (watched) {
    const { error } = await supabase.from('item_user_watch').upsert(
      {
        item_id: itemId,
        user_id: userId,
        watched: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'item_id,user_id' },
    )
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('item_user_watch')
      .delete()
      .eq('item_id', itemId)
      .eq('user_id', userId)
    if (error) throw error
  }
}
