/** Columnas de `lists` expuestas al cliente (sin `discord_webhook_url`). Usar en todos los `.from('lists').select(...)` salvo ajustes de owner (p. ej. modal de lista). */
export const LIST_SELECT_PUBLIC =
  'id, name, description, owner_id, created_at, updated_at, is_private, invite_code, deleted_at, theme, tags, next_queue_item_id' as const
