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
  if (tableName === 'item_comments' && action === 'insert') return 'comment_added'
  if (tableName === 'item_comments' && action === 'update') return 'comment_updated'
  if (tableName === 'item_comments' && action === 'delete') return 'comment_deleted'
  if (tableName === 'lists' && action === 'insert') return 'list_created'
  if (tableName === 'lists' && action === 'update') return 'list_updated'
  if (tableName === 'lists' && action === 'delete') return 'list_deleted'

  return 'fallback'
}

export const getHumanizedFeedMessage = (
  event: ActivityFeedEvent,
  themeMode: FeedThemeMode,
  t: TFunction
): string => {
  const actorName = event.actor_name || t('activityFeed.common.actorUnknown')
  const itemTitle = event.item_title || t('activityFeed.common.fallbackItem')
  const listName = event.list_name || t('activityFeed.common.fallbackList')
  const eventKey = getFeedEventKey(event)

  return t(`activityFeed.${themeMode}.events.${eventKey}`, {
    user: actorName,
    item: itemTitle,
    list: listName,
    defaultValue: t(`activityFeed.${themeMode}.events.fallback`, {
      user: actorName,
      item: itemTitle,
      list: listName,
    }),
  })
}
