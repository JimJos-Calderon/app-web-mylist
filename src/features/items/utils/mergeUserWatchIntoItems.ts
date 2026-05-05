import type { ListItem } from '@/features/shared'

export type ItemUserWatchRow = { item_id: string | number; watched: boolean | null }

/**
 * Combina filas `item_user_watch` con ítems: `ListItem.visto` = visto solo para el usuario actual.
 */
export function mergeUserWatchIntoItems(
  items: ListItem[],
  watchRows: ItemUserWatchRow[] | null | undefined,
): ListItem[] {
  const map = new Map<string, boolean>()
  for (const row of watchRows ?? []) {
    map.set(String(row.item_id), row.watched === true)
  }
  return items.map((item) => ({
    ...item,
    visto: map.get(String(item.id)) ?? false,
  }))
}
