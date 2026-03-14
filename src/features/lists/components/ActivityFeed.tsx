import React from 'react'
import { useTranslation } from 'react-i18next'
import { Clock3, Loader2, AlertTriangle, TerminalSquare } from 'lucide-react'
import { useActivityFeed } from '../hooks/useActivityFeed'
import HudContainer from '../../shared/components/HudContainer'
import TechLabel from '../../shared/components/TechLabel'

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
      <HudContainer className={`p-4 ${className || ''}`}>
        <header className="flex items-center gap-2 border-b border-[rgba(var(--color-accent-primary-rgb),0.2)] pb-2 mb-3">
          <TerminalSquare className="w-4 h-4 text-accent-primary" />
          <TechLabel text="SYS.LOG" blink />
        </header>
        <div className="flex items-center gap-2 text-[var(--color-text-muted)] font-mono text-xs">
          <Loader2 className="w-3 h-3 animate-spin text-accent-primary" />
          <span>{t('activity_feed.initializing')}</span>
        </div>
      </HudContainer>
    )
  }

  if (error) {
    return (
      <HudContainer className={`p-4 border-[rgba(var(--color-accent-secondary-rgb),0.3)] ${className || ''}`}>
        <header className="flex items-center gap-2 border-b border-[rgba(var(--color-accent-secondary-rgb),0.2)] pb-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-accent-secondary" />
          <TechLabel text="ERR.LOG" tone="secondary" blink />
        </header>
        <div className="flex items-start gap-2 text-accent-secondary font-mono text-xs">
          <span>{'> ERROR:'} {t('activity_feed.error')}</span>
        </div>
      </HudContainer>
    )
  }

  if (events.length === 0) {
    return (
      <HudContainer className={`p-4 ${className || ''}`}>
        <header className="flex items-center gap-2 border-b border-[rgba(var(--color-accent-primary-rgb),0.2)] pb-2 mb-3">
          <TerminalSquare className="w-4 h-4 text-accent-primary" />
          <TechLabel text="SYS.LOG" />
        </header>
        <p className="text-[var(--color-text-muted)] font-mono text-xs">
          {'>'} {t('activity_feed.empty')}
        </p>
      </HudContainer>
    )
  }

  return (
    <HudContainer className={`p-4 ${className || ''}`}>
      <header className="flex items-center justify-between border-b border-[rgba(var(--color-accent-primary-rgb),0.2)] pb-2 mb-3">
        <div className="flex items-center gap-2">
          <TerminalSquare className="w-4 h-4 text-accent-primary" />
          <TechLabel text="SYS.LOG" />
        </div>
        <span className="text-[10px] uppercase font-mono tracking-widest text-accent-primary opacity-60">
          {t('activity_feed.count')}: [{events.length.toString().padStart(2, '0')}]
        </span>
      </header>

      <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
        {events.map((event) => {
          const actionLabel = resolveActionLabel(event.action_key, event.table_name, event.action, t)
          const relativeTime = formatRelativeTime(event.created_at, i18n.language || 'es')
          const itemTitle = event.item_title || t('activity_feed.fallback.item')
          const listName = event.list_name || t('activity_feed.fallback.list')

          return (
            <article 
              key={event.activity_id} 
              className="font-mono text-xs hover:bg-[rgba(var(--color-accent-primary-rgb),0.05)] transition-colors p-1.5 -mx-1.5 rounded"
            >
              <div className="flex gap-2">
                <span className="text-accent-primary opacity-40 shrink-0">
                  [{new Date(event.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}]
                </span>
                <span className="text-[var(--color-text-muted)] min-w-0 break-words leading-relaxed">
                  <span className="text-accent-primary font-bold">{event.actor_name}</span>{' '}
                  <span className="opacity-80">{t('activity_feed.executed')}</span> <span className="text-[var(--color-text-primary)]">[{actionLabel}]</span>{' '}
                  <span className="opacity-80">{t('activity_feed.on_target')}</span> <span className="text-accent-secondary">'{itemTitle}'</span>{' '}
                  <span className="opacity-80">{t('activity_feed.in_region')}</span> <span className="opacity-60">{listName}</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-accent-primary opacity-40 mt-1 pl-20">
                <Clock3 className="w-3 h-3" />
                <span>{relativeTime.toUpperCase()}</span>
                <span className="mx-1">|</span>
                <span>ID:{String(event.activity_id).substring(0,8)}</span>
              </div>
            </article>
          )
        })}
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(var(--color-accent-primary-rgb), 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(var(--color-accent-primary-rgb), 0.5);
        }
      `}</style>
    </HudContainer>
  )
}

export default ActivityFeed
