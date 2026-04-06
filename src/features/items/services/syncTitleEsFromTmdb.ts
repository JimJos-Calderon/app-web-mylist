import { supabase } from '@/supabaseClient'
import { enrichFromTmdb } from './tmdbService'

export interface SyncTitleEsResult {
  scanned: number
  updated: number
  skipped: number
  errors: number
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Para listas donde el usuario es owner o admin: rellena `title_es` vía TMDB si está vacío.
 */
export async function syncTitleEsForUserLists(userId: string): Promise<SyncTitleEsResult> {
  if (!import.meta.env.VITE_TMDB_ACCESS_TOKEN?.trim()) {
    throw new Error('Falta VITE_TMDB_ACCESS_TOKEN para sincronizar con TMDB.')
  }

  const { data: memberships, error: memErr } = await supabase
    .from('list_members')
    .select('list_id')
    .eq('user_id', userId)
    .in('role', ['owner', 'admin'])

  if (memErr) throw memErr

  const listIds = [...new Set((memberships ?? []).map((m) => m.list_id).filter(Boolean))]
  if (listIds.length === 0) {
    return { scanned: 0, updated: 0, skipped: 0, errors: 0 }
  }

  const { data: rows, error: itemsErr } = await supabase
    .from('items')
    .select('id, titulo, tipo, title_es, list_id')
    .in('list_id', listIds)
    .is('deleted_at', null)

  if (itemsErr) throw itemsErr

  const needsFill = (rows ?? []).filter((row) => !row.title_es?.trim())
  let updated = 0
  let skipped = 0
  let errors = 0

  for (const row of needsFill) {
    const titulo = row.titulo?.trim()
    if (!titulo) {
      skipped++
      continue
    }

    try {
      const enriched = await enrichFromTmdb(titulo, row.tipo as 'pelicula' | 'serie')
      await delay(120)

      const title_es = enriched?.title_es?.trim()
      if (!title_es) {
        skipped++
        continue
      }

      const { error: upErr } = await supabase.from('items').update({ title_es }).eq('id', row.id)

      if (upErr) {
        console.error('syncTitleEs update', row.id, upErr)
        errors++
      } else {
        updated++
      }
    } catch (e) {
      console.error('syncTitleEs item', row.id, e)
      errors++
    }
  }

  return {
    scanned: needsFill.length,
    updated,
    skipped,
    errors,
  }
}
