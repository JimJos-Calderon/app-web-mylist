import type { TFunction } from 'i18next'
import type { ActivityFeedEvent } from '../hooks/useActivityFeed'

export type FeedThemeMode = 'default' | 'retro'

export const getFeedEventKey = (event: ActivityFeedEvent): string => {
  const tableName = event.table_name.toLowerCase()
  const action = event.action.toLowerCase()

  if (tableName === 'items' && action === 'insert') return 'item_added'
  if (tableName === 'items' && action === 'update') return 'item_updated'
  if (tableName === 'items' && action === 'delete') return 'item_deleted'
  if (tableName === 'item_ratings' && action === 'insert') return 'rating_added'
  if (tableName === 'item_ratings' && action === 'update') return 'rating_updated'
  if (tableName === 'item_ratings' && action === 'delete') return 'rating_updated'
  if (tableName === 'item_comments' && action === 'insert') return 'comment_added'
  if (tableName === 'item_comments' && action === 'update') return 'comment_updated'
  if (tableName === 'item_comments' && action === 'delete') return 'comment_deleted'
  if (tableName === 'lists' && action === 'insert') return 'list_created'
  if (tableName === 'lists' && action === 'update') return 'list_updated'
  if (tableName === 'lists' && action === 'delete') return 'list_deleted'

  return 'fallback'
}

/** Título del ítem para copy social; si falta, "un elemento" / "an item" (i18n). */
const resolveItemLabel = (event: ActivityFeedEvent, t: TFunction): string => {
  const raw = event.item_title?.trim()
  if (raw) return raw
  return t('activityFeed.common.itemGeneric')
}

/**
 * Mensaje principal del feed: tono conversacional, sin parecer log de sistema.
 * Respeta `themeMode` (default vs retro) vía claves i18n.
 */
export const getEventMessage = (
  event: ActivityFeedEvent,
  themeMode: FeedThemeMode,
  t: TFunction
): string => {
  const actor = event.actor_name || t('activityFeed.common.actorUnknown')
  const item = resolveItemLabel(event, t)
  const listName = event.list_name || t('activityFeed.common.fallbackList')
  const tn = event.table_name.toLowerCase()
  const action = (event.action || '').toUpperCase()

  if (tn === 'item_ratings') {
    const raw = event.rating
    if (raw != null && raw !== '' && Number.isFinite(Number(raw))) {
      const rating = Math.min(5, Math.max(1, Math.round(Number(raw))))
      return t(`activityFeed.${themeMode}.events.rating_stars`, { user: actor, rating, item })
    }
    return t(`activityFeed.${themeMode}.events.rating_generic`, { user: actor, item })
  }

  if (tn === 'item_comments') {
    if (action === 'DELETE') {
      return t(`activityFeed.${themeMode}.events.comment_removed`, { user: actor, item })
    }
    return t(`activityFeed.${themeMode}.events.comment_on_item`, { user: actor, item })
  }

  if (tn === 'items') {
    if (action === 'INSERT') {
      return t(`activityFeed.${themeMode}.events.item_insert_social`, {
        user: actor,
        item,
        list: listName,
      })
    }
    if (action === 'DELETE') {
      return t(`activityFeed.${themeMode}.events.item_delete_social`, { user: actor, list: listName })
    }
    if (action === 'UPDATE') {
      return t(`activityFeed.${themeMode}.events.item_update_social`, { user: actor, item })
    }
  }

  const eventKey = getFeedEventKey(event)

  return t(`activityFeed.${themeMode}.events.${eventKey}`, {
    user: actor,
    item,
    list: listName,
    defaultValue: t(`activityFeed.${themeMode}.events.fallback`, {
      user: actor,
      item,
      list: listName,
    }),
  })
}

/** Alias de `getEventMessage` para compatibilidad con imports antiguos. */
export const getHumanizedFeedMessage = getEventMessage
