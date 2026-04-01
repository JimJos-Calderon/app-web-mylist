import React from 'react'
import { useTranslation } from 'react-i18next'
import { Clock3, Loader2, AlertTriangle, MessageCircleMore } from 'lucide-react'
import { useActivityFeed } from '../hooks/useActivityFeed'
import HudContainer from '../../shared/components/HudContainer'
import TechLabel from '../../shared/components/TechLabel'
import { useTheme } from '@/features/shared'
import { getHumanizedFeedMessage, type FeedThemeMode } from '../utils/activityFeedUtils'

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

const isRetroTheme = (theme: string) => theme === 'retro' || theme === 'retro-cartoon'

const ActivityFeed: React.FC<ActivityFeedProps> = ({
  listId,
  limit = 20,
  className,
}) => {
  const { t, i18n } = useTranslation()
  const { theme } = useTheme()
  const { events, loading, error } = useActivityFeed({ listId, limit })
  const retroMode = isRetroTheme(theme)
  const themeMode: FeedThemeMode = retroMode ? 'retro' : 'default'
  const headerLabel = t(`activityFeed.${themeMode}.header.label`)
  const errorHeaderLabel = t(`activityFeed.${themeMode}.header.errorLabel`)
  const headerTitle = t(`activityFeed.${themeMode}.header.title`)
  const headerSubtitle = t(`activityFeed.${themeMode}.header.subtitle`)
  const emptyMessage = t(`activityFeed.${themeMode}.states.empty`)
  const loadingMessage = t(`activityFeed.${themeMode}.states.loading`)
  const errorMessage = t(`activityFeed.${themeMode}.states.error`)

  if (loading) {
    return (
      <HudContainer className={`p-4 ${className || ''}`}>
        <header className="mb-3 flex items-center gap-2 border-b border-[rgba(var(--color-accent-primary-rgb),0.2)] pb-2">
          <MessageCircleMore className="h-4 w-4 text-accent-primary" />
          <TechLabel text={headerLabel} blink />
        </header>
        <div className={`flex items-center gap-2 text-xs text-[var(--color-text-muted)] ${retroMode ? 'theme-heading-font' : 'font-mono'}`}>
          <Loader2 className="h-3 w-3 animate-spin text-accent-primary" />
          <span>{loadingMessage}</span>
        </div>
      </HudContainer>
    )
  }

  if (error) {
    return (
      <HudContainer className={`p-4 border-[rgba(var(--color-accent-secondary-rgb),0.3)] ${className || ''}`}>
        <header className="mb-3 flex items-center gap-2 border-b border-[rgba(var(--color-accent-secondary-rgb),0.2)] pb-2">
          <AlertTriangle className="h-4 w-4 text-accent-secondary" />
          <TechLabel text={errorHeaderLabel} tone="secondary" blink />
        </header>
        <div className={`flex items-start gap-2 text-xs text-accent-secondary ${retroMode ? 'theme-heading-font' : 'font-mono'}`}>
          <span>{errorMessage}</span>
        </div>
      </HudContainer>
    )
  }

  if (events.length === 0) {
    return (
      <HudContainer className={`p-4 ${className || ''}`}>
        <header className="mb-3 flex items-center gap-2 border-b border-[rgba(var(--color-accent-primary-rgb),0.2)] pb-2">
          <MessageCircleMore className="h-4 w-4 text-accent-primary" />
          <TechLabel text={headerLabel} />
        </header>
        <p className={`text-xs text-[var(--color-text-muted)] ${retroMode ? 'theme-heading-font' : 'font-mono'}`}>
          {emptyMessage}
        </p>
      </HudContainer>
    )
  }

  return (
    <HudContainer className={`p-4 ${className || ''}`}>
      <header className="mb-4 flex items-start justify-between gap-4 border-b border-[rgba(var(--color-accent-primary-rgb),0.2)] pb-3">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-full border ${
            retroMode
              ? 'border-black bg-[var(--color-bg-primary)] shadow-[3px_3px_0px_0px_#000000]'
              : 'border-[rgba(var(--color-accent-primary-rgb),0.35)] bg-[rgba(var(--color-accent-primary-rgb),0.08)]'
          }`}>
            <MessageCircleMore className="h-4 w-4 text-accent-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <TechLabel text={headerLabel} />
            </div>
            <h3 className={`mt-1 text-base font-semibold text-[var(--color-text-primary)] ${retroMode ? 'theme-heading-font uppercase' : ''}`}>
              {headerTitle}
            </h3>
            <p className={`mt-1 text-xs text-[var(--color-text-muted)] ${retroMode ? 'theme-heading-font' : ''}`}>
              {headerSubtitle}
            </p>
          </div>
        </div>
        <span className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-accent-primary ${
          retroMode
            ? 'theme-heading-font border-black bg-[var(--color-bg-primary)] text-black'
            : 'font-mono border-[rgba(var(--color-accent-primary-rgb),0.25)] bg-[rgba(var(--color-accent-primary-rgb),0.08)]'
        }`}>
          {t('activityFeed.common.countBadge', { count: events.length })}
        </span>
      </header>

      <div className="custom-scrollbar max-h-[320px] space-y-3 overflow-y-auto pr-2">
        {events.map((event) => {
          const relativeTime = formatRelativeTime(event.created_at, i18n.language || 'es')
          const message = getHumanizedFeedMessage(event, themeMode, t)
          const itemTitle = event.item_title || t('activityFeed.common.fallbackItem')
          const listName = event.list_name || t('activityFeed.common.fallbackList')
          const actorName = event.actor_name || t('activityFeed.common.actorUnknown')

          return (
            <article
              key={event.activity_id}
              className={`rounded-2xl border p-3 transition-all ${
                retroMode
                  ? 'border-black bg-[var(--color-bg-primary)] shadow-[4px_4px_0px_0px_#000000]'
                  : 'border-[rgba(var(--color-accent-primary-rgb),0.14)] bg-[rgba(0,0,0,0.18)] hover:border-[rgba(var(--color-accent-primary-rgb),0.28)] hover:bg-[rgba(var(--color-accent-primary-rgb),0.05)]'
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                  retroMode
                    ? 'theme-heading-font border border-black bg-[#fff4a8] text-black'
                    : 'border border-[rgba(var(--color-accent-primary-rgb),0.25)] bg-[rgba(var(--color-accent-primary-rgb),0.08)] text-accent-primary'
                }`}>
                  {actorName}
                </span>
                {event.item_title && (
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                    retroMode
                      ? 'theme-heading-font border border-black bg-[#c3ecff] text-black'
                      : 'border border-[rgba(var(--color-accent-secondary-rgb),0.25)] bg-[rgba(var(--color-accent-secondary-rgb),0.08)] text-accent-secondary'
                  }`}>
                    {itemTitle}
                  </span>
                )}
                {event.list_name && (
                  <span className={`rounded-full px-2.5 py-1 text-[10px] ${
                    retroMode
                      ? 'theme-heading-font border border-black bg-white text-black/80'
                      : 'border border-white/10 bg-white/5 text-[var(--color-text-muted)]'
                  }`}>
                    {listName}
                  </span>
                )}
              </div>

              <p className={`mt-3 break-words text-sm leading-relaxed text-[var(--color-text-primary)] ${
                retroMode ? 'theme-heading-font' : ''
              }`}>
                {message}
              </p>

              <div className={`mt-3 flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)] ${
                retroMode ? 'theme-heading-font' : ''
              }`}>
                <Clock3 className="h-3 w-3" />
                <span>{relativeTime}</span>
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
