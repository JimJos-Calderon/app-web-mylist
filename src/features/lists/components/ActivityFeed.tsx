import React from 'react'
import { useTranslation } from 'react-i18next'
import { Clock3, Loader2, AlertTriangle, Activity } from 'lucide-react'
import { useActivityFeed } from '../hooks/useActivityFeed'

interface ActivityFeedProps {
  listId?: string
  limit?: number
  className?: string
}

const formatRelativeTime = (isoDate: string, locale: string): string => {
  const createdAt = new Date(isoDate)
  const now = new Date()
  const diffMs = now.getTime() - createdAt.getTime()

  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })

  if (Math.abs(diffMs) < hour) {
    const minutes = Math.round(diffMs / minute)
    return rtf.format(-minutes, 'minute')
  }

  if (Math.abs(diffMs) < day) {
    const hours = Math.round(diffMs / hour)
    return rtf.format(-hours, 'hour')
  }

  const days = Math.round(diffMs / day)
  return rtf.format(-days, 'day')
}

const resolveActionLabel = (
  actionKey: string,
  tableName: string,
  action: string,
  t: (key: string, options?: Record<string, unknown>) => string
): string => {
  const normalizedAction = action.toLowerCase()
  const fallbackByAction = {
    insert: t('activity_feed.actions.insert'),
    update: t('activity_feed.actions.update'),
    delete: t('activity_feed.actions.delete'),
  }

  const fallbackLabel = fallbackByAction[normalizedAction as keyof typeof fallbackByAction] || t('activity_feed.actions.generic')
  const byActionKey = t(`activity_feed.action_keys.${actionKey}`, { defaultValue: '' })

  if (byActionKey) {
    return byActionKey
  }

  const byTableAction = t(`activity_feed.action_keys.${tableName.toLowerCase()}_${normalizedAction}`, { defaultValue: '' })
  return byTableAction || fallbackLabel
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({
  listId,
  limit = 20,
  className,
}) => {
  const { t, i18n } = useTranslation()
  const { events, loading, error } = useActivityFeed({ listId, limit })

  if (loading) {
    return (
      <section className={`rounded-2xl border border-cyan-500/20 bg-black/70 backdrop-blur-lg p-5 ${className || ''}`}>
        <header className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-black uppercase tracking-wider text-white">
            {t('activity_feed.title')}
          </h3>
        </header>

        <div className="flex items-center gap-3 text-zinc-300 text-sm">
          <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
          <span>{t('activity_feed.loading')}</span>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className={`rounded-2xl border border-red-500/30 bg-black/70 backdrop-blur-lg p-5 ${className || ''}`}>
        <header className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-red-400" />
          <h3 className="text-sm font-black uppercase tracking-wider text-white">
            {t('activity_feed.title')}
          </h3>
        </header>

        <div className="flex items-start gap-3 text-red-300 text-sm">
          <AlertTriangle className="w-4 h-4 mt-0.5 text-red-400" />
          <span>{t('activity_feed.error')}</span>
        </div>
      </section>
    )
  }

  if (events.length === 0) {
    return (
      <section className={`rounded-2xl border border-cyan-500/20 bg-black/70 backdrop-blur-lg p-5 ${className || ''}`}>
        <header className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-black uppercase tracking-wider text-white">
            {t('activity_feed.title')}
          </h3>
        </header>

        <p className="text-zinc-400 text-sm">{t('activity_feed.empty')}</p>
      </section>
    )
  }

  return (
    <section className={`rounded-2xl border border-cyan-500/20 bg-black/70 backdrop-blur-lg p-5 ${className || ''}`}>
      <header className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-black uppercase tracking-wider text-white">
            {t('activity_feed.title')}
          </h3>
        </div>

        <span className="text-[10px] uppercase tracking-widest text-cyan-300/70 font-bold">
          {t('activity_feed.latest_count', { count: events.length })}
        </span>
      </header>

      <div className="relative pl-6">
        <div className="absolute left-[11px] top-1 bottom-1 w-px bg-gradient-to-b from-cyan-400/50 via-purple-400/20 to-transparent" />

        <ul className="space-y-4">
          {events.map((event) => {
            const actionLabel = resolveActionLabel(event.action_key, event.table_name, event.action, t)
            const relativeTime = formatRelativeTime(event.created_at, i18n.language || 'es')
            const itemTitle = event.item_title || t('activity_feed.fallback.item')
            const listName = event.list_name || t('activity_feed.fallback.list')

            return (
              <li key={event.activity_id} className="relative">
                <span className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_0_4px_rgba(34,211,238,0.18)]" />

                <article className="rounded-xl border border-zinc-800/80 bg-zinc-950/70 px-4 py-3 hover:border-cyan-400/40 transition-colors">
                  <p className="text-sm text-zinc-100 leading-relaxed">
                    <span className="font-black text-cyan-300">{event.actor_name}</span>{' '}
                    <span className="text-zinc-300">{actionLabel}</span>{' '}
                    <span className="font-semibold text-white">{itemTitle}</span>{' '}
                    <span className="text-zinc-500">{t('activity_feed.in_list')}</span>{' '}
                    <span className="font-semibold text-fuchsia-300">{listName}</span>
                  </p>

                  <div className="mt-2 flex items-center gap-2 text-[11px] uppercase tracking-wide text-zinc-500">
                    <Clock3 className="w-3.5 h-3.5" />
                    <span>{relativeTime}</span>
                  </div>
                </article>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

export default ActivityFeed
