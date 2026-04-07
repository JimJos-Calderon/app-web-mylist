import React, { useCallback, useState, type CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  Clock3,
  Edit3,
  MessageCircleMore,
  MessageSquare,
  PlusCircle,
  Star,
  XCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useActivityFeed, type ActivityFeedEvent } from '../hooks/useActivityFeed'
import HudContainer from '../../shared/components/HudContainer'
import TechLabel from '../../shared/components/TechLabel'
import { useTheme } from '@/features/shared'
import { formatRetroHeading } from '@/features/shared/utils/textUtils'
import { getEventMessage, type FeedThemeMode } from '../utils/activityFeedUtils'
import { supabase } from '@/supabaseClient'
import ActivityFeedSkeleton, { type ActivityFeedSkeletonTheme } from './ActivityFeedSkeleton'

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

function mapSkeletonTheme(theme: string): ActivityFeedSkeletonTheme {
  if (theme === 'retro-cartoon') return 'retro-cartoon'
  if (theme === 'cyberpunk') return 'cyberpunk'
  if (theme === 'terminal') return 'terminal'
  return 'default'
}

function getActionGlyph(event: ActivityFeedEvent): { Icon: LucideIcon; className: string } {
  const tn = event.table_name.toLowerCase()
  if (tn === 'item_ratings') {
    return {
      Icon: Star,
      className:
        'fill-[color:var(--color-retro-yellow)] stroke-black stroke-[2.5] [paint-order:stroke_fill] text-[color:var(--color-retro-yellow)]',
    }
  }
  if (tn === 'item_comments') {
    return { Icon: MessageSquare, className: 'text-[color:var(--color-retro-pink)]' }
  }
  const a = (event.action || '').toUpperCase()
  if (a === 'INSERT') return { Icon: PlusCircle, className: 'text-[color:var(--color-retro-yellow)]' }
  if (a === 'DELETE') return { Icon: XCircle, className: 'text-[color:var(--color-retro-pink)]' }
  if (a === 'UPDATE') return { Icon: Edit3, className: 'text-[color:var(--color-retro-cyan)]' }
  return { Icon: PlusCircle, className: 'text-[var(--color-text-muted)]' }
}

/** Fondo de tarjeta: rotación vanilla / hunyadi / auburn (modo vintage). */
function getRetroFeedCardBackgroundStyle(event: ActivityFeedEvent): CSSProperties {
  const tn = event.table_name.toLowerCase()
  if (tn === 'item_comments') return { backgroundColor: 'var(--color-retro-pink)' }
  if (tn === 'item_ratings') return { backgroundColor: 'var(--color-retro-yellow)' }
  const i = event.activity_id % 3
  if (i === 0) return { backgroundColor: 'var(--color-bg-primary)' }
  if (i === 1) return { backgroundColor: 'var(--color-retro-yellow)' }
  return { backgroundColor: 'var(--color-retro-pink)' }
}

/** Tarjeta con fondo auburn: texto vanilla para contraste. */
function isRetroFeedCardDark(event: ActivityFeedEvent): boolean {
  const tn = event.table_name.toLowerCase()
  if (tn === 'item_comments') return true
  if (tn === 'item_ratings') return false
  return event.activity_id % 3 === 2
}

/** Icono sobre pastilla (contraste según tono). */
function getRetroActionPresentation(event: ActivityFeedEvent): { shell: string; iconClass: string } {
  const tn = event.table_name.toLowerCase()
  if (tn === 'item_ratings') {
    return {
      shell: 'bg-retro-yellow',
      iconClass:
        '!text-[var(--color-text-primary)] fill-[var(--color-text-primary)] stroke-black stroke-[2.5] [paint-order:stroke_fill]',
    }
  }
  if (tn === 'item_comments') {
    return {
      shell: 'bg-retro-pink',
      iconClass: '!text-[var(--color-bg-primary)] stroke-[var(--color-bg-primary)] stroke-[2.5]',
    }
  }
  const a = (event.action || '').toUpperCase()
  if (a === 'INSERT')
    return { shell: 'bg-retro-yellow', iconClass: '!text-[var(--color-text-primary)] stroke-black stroke-[2.5]' }
  if (a === 'DELETE')
    return { shell: 'bg-retro-pink', iconClass: '!text-[var(--color-bg-primary)] stroke-[var(--color-bg-primary)] stroke-[2.5]' }
  if (a === 'UPDATE')
    return { shell: 'bg-retro-cyan', iconClass: '!text-[var(--color-bg-primary)] stroke-[var(--color-bg-primary)] stroke-[2.5]' }
  return { shell: 'bg-[color:var(--color-bg-primary)]', iconClass: '!text-[var(--color-text-primary)] stroke-black stroke-2' }
}

function cardShellClasses(theme: string): string {
  switch (theme) {
    case 'cyberpunk':
      return [
        'rounded-2xl border border-cyan-500/40 bg-black/60 p-3',
        'shadow-[0_0_18px_rgba(0,255,255,0.12)]',
        'transition-all duration-300',
        'hover:border-cyan-400/70 hover:shadow-[0_0_28px_rgba(255,0,255,0.18)] hover:bg-black/70',
        'cursor-pointer',
      ].join(' ')
    case 'terminal':
      return [
        'rounded-none border border-green-500/35 bg-black/90 p-3 font-mono',
        'shadow-none transition-colors duration-200',
        'hover:border-amber-500/40 hover:bg-black',
        'cursor-pointer',
      ].join(' ')
    case 'retro-cartoon':
      return [
        'rounded-2xl border-2 border-black p-3',
        'shadow-[5px_5px_0px_0px_#000000]',
        'transition-transform hover:-translate-y-0.5',
        'cursor-pointer',
      ].join(' ')
    default:
      return [
        'rounded-2xl border border-[rgba(var(--color-accent-primary-rgb),0.14)] bg-[rgba(0,0,0,0.18)] p-3',
        'transition-all hover:border-[rgba(var(--color-accent-primary-rgb),0.28)] hover:bg-[rgba(var(--color-accent-primary-rgb),0.06)]',
        'cursor-pointer',
      ].join(' ')
  }
}

const listMotion = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.055, delayChildren: 0.04 },
  },
}

const rowMotion = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const },
  },
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ listId, limit = 20, className }) => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { theme } = useTheme()
  const { events, loading, error } = useActivityFeed({ listId, limit })
  const retroMode = isRetroTheme(theme)
  const feedI18nMode: FeedThemeMode = retroMode ? 'retro' : 'default'
  const headerLabel = t(`activityFeed.${feedI18nMode}.header.label`)
  const errorHeaderLabel = t(`activityFeed.${feedI18nMode}.header.errorLabel`)
  const headerTitle = t(`activityFeed.${feedI18nMode}.header.title`)
  const headerSubtitle = t(`activityFeed.${feedI18nMode}.header.subtitle`)
  const emptyMessage = t(`activityFeed.${feedI18nMode}.states.empty`)
  const errorMessage = t(`activityFeed.${feedI18nMode}.states.error`)
  const formattedHeaderTitle = formatRetroHeading(headerTitle, theme)
  const [avatarBroken, setAvatarBroken] = useState<Record<number, boolean>>({})

  const navigateForEvent = useCallback(
    async (event: ActivityFeedEvent) => {
      if (!event.list_id) return

      if (!event.item_id) {
        navigate(`/peliculas?list=${encodeURIComponent(event.list_id)}`)
        return
      }

      const { data } = await supabase.from('items').select('tipo').eq('id', event.item_id).maybeSingle()

      const base = data?.tipo === 'serie' ? '/series' : '/peliculas'
      navigate(
        `${base}?list=${encodeURIComponent(event.list_id)}&openItem=${encodeURIComponent(String(event.item_id))}`
      )
    },
    [navigate]
  )

  const onKeyNavigate = (e: React.KeyboardEvent, event: ActivityFeedEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      void navigateForEvent(event)
    }
  }

  if (loading) {
    return <ActivityFeedSkeleton headerLabel={headerLabel} theme={mapSkeletonTheme(theme)} className={className} />
  }

  if (error) {
    return (
      <HudContainer className={`p-4 border-[rgba(var(--color-accent-secondary-rgb),0.3)] ${className || ''}`}>
        <header
          className={`mb-3 flex items-center gap-2 border-b pb-2 ${retroMode ? '-mx-4 -mt-4 mb-4 border-b-2 border-black !bg-retro-yellow px-4 pb-3 pt-4' : 'border-[rgba(var(--color-accent-secondary-rgb),0.2)]'}`}
          style={retroMode ? { backgroundColor: 'var(--color-retro-yellow)' } : undefined}
        >
          <AlertTriangle className={`h-4 w-4 ${retroMode ? '!text-black' : 'text-accent-secondary'}`} />
          <TechLabel text={errorHeaderLabel} tone="secondary" blink />
        </header>
        <div
          className={`flex items-start gap-2 text-xs ${retroMode ? 'theme-heading-font !text-black' : 'font-mono text-accent-secondary'}`}
        >
          <span>{errorMessage}</span>
        </div>
      </HudContainer>
    )
  }

  if (events.length === 0) {
    return (
      <HudContainer className={`p-4 ${className || ''}`}>
        <header
          className={`mb-3 flex items-center gap-2 border-b pb-2 ${retroMode ? '-mx-4 -mt-4 mb-4 border-b-2 border-black !bg-retro-cyan px-4 pb-3 pt-4 !text-[var(--color-bg-primary)]' : 'border-[rgba(var(--color-accent-primary-rgb),0.2)]'}`}
          style={retroMode ? { backgroundColor: 'var(--color-retro-cyan)' } : undefined}
        >
          <MessageCircleMore className={`h-4 w-4 ${retroMode ? '!text-[var(--color-bg-primary)]' : 'text-accent-primary'}`} />
          <TechLabel text={headerLabel} />
        </header>
        <p
          className={`text-xs ${retroMode ? 'theme-heading-font !text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)] font-mono'}`}
        >
          {emptyMessage}
        </p>
      </HudContainer>
    )
  }

  return (
    <HudContainer className={`p-4 ${className || ''}`}>
      <header
        className={`mb-4 flex items-start justify-between gap-4 border-b pb-3 ${retroMode ? '-mx-4 -mt-4 mb-4 border-b-2 border-black !bg-retro-cyan px-4 pb-3 pt-4 !text-[var(--color-bg-primary)]' : 'border-[rgba(var(--color-accent-primary-rgb),0.2)]'}`}
        style={retroMode ? { backgroundColor: 'var(--color-retro-cyan)' } : undefined}
      >
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-full border ${
              retroMode
                ? 'border-2 border-black !bg-[var(--color-bg-primary)] shadow-[4px_4px_0px_0px_#000000]'
                : theme === 'cyberpunk'
                  ? 'border-cyan-500/50 bg-black/60 shadow-[0_0_12px_rgba(0,255,255,0.2)]'
                  : theme === 'terminal'
                    ? 'border-green-500/40 bg-black'
                    : 'border-[rgba(var(--color-accent-primary-rgb),0.35)] bg-[rgba(var(--color-accent-primary-rgb),0.08)]'
            }`}
            style={retroMode ? { backgroundColor: 'var(--color-bg-primary)' } : undefined}
          >
            <MessageCircleMore className={`h-4 w-4 ${retroMode ? '!text-[var(--color-text-primary)]' : 'text-accent-primary'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <TechLabel text={headerLabel} />
            </div>
            <h3
              className={`mt-1 text-base font-semibold ${retroMode ? 'theme-heading-font uppercase !text-[var(--color-bg-primary)]' : 'text-[var(--color-text-primary)]'}`}
            >
              {formattedHeaderTitle}
            </h3>
            <p className={`mt-1 text-xs ${retroMode ? 'theme-heading-font !text-[var(--color-bg-primary)] opacity-90' : 'text-[var(--color-text-muted)]'}`}>
              {headerSubtitle}
            </p>
          </div>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.16em] ${
            retroMode
              ? 'theme-heading-font border-2 border-black !bg-[var(--color-bg-primary)] !text-[var(--color-text-primary)] shadow-[4px_4px_0px_0px_#000000]'
              : theme === 'terminal'
                ? 'font-mono border border-green-500/35 text-green-400'
                : 'font-mono border border-[rgba(var(--color-accent-primary-rgb),0.25)] bg-[rgba(var(--color-accent-primary-rgb),0.08)] text-accent-primary'
          }`}
          style={retroMode ? { backgroundColor: 'var(--color-bg-primary)' } : undefined}
        >
          {t('activityFeed.common.countBadge', { count: events.length })}
        </span>
      </header>

      <motion.div
        className="custom-scrollbar max-h-[320px] space-y-3 overflow-y-auto pr-2"
        variants={listMotion}
        initial="hidden"
        animate="show"
      >
        {events.map((event) => {
          const relativeTime = formatRelativeTime(event.created_at, i18n.language || 'es')
          const message = getEventMessage(event, feedI18nMode, t)
          const itemTitle = event.item_title?.trim() || t('activityFeed.common.itemGeneric')
          const listName = event.list_name || t('activityFeed.common.fallbackList')
          const actorName = event.actor_name || t('activityFeed.common.actorUnknown')
          const { Icon: ActionIcon, className: actionIconClass } = getActionGlyph(event)
          const retroAction = getRetroActionPresentation(event)
          const poster = event.item_poster_url?.trim()
          const ratingVal =
            event.table_name?.toLowerCase() === 'item_ratings' && event.rating != null
              ? Math.min(5, Math.max(0, Number(event.rating)))
              : null
          const showCommentPreview =
            event.table_name?.toLowerCase() === 'item_comments' &&
            typeof event.comment_text === 'string' &&
            event.comment_text.trim().length > 0

          const initial = actorName.trim().charAt(0).toUpperCase() || '?'
          const avatarUrl = event.avatar_url?.trim()
          const broken = avatarBroken[event.activity_id]
          const darkCard = theme === 'retro-cartoon' && isRetroFeedCardDark(event)
          const retroInk = darkCard ? '!text-[var(--color-bg-primary)]' : '!text-[var(--color-text-primary)]'

          return (
            <motion.article
              key={event.activity_id}
              variants={rowMotion}
              className={`${cardShellClasses(theme)}${theme === 'retro-cartoon' ? ` ${retroInk}` : ''}`}
              style={theme === 'retro-cartoon' ? getRetroFeedCardBackgroundStyle(event) : undefined}
              role="button"
              tabIndex={0}
              onClick={() => void navigateForEvent(event)}
              onKeyDown={(e) => onKeyNavigate(e, event)}
            >
              <div className="flex gap-3">
                <div className="relative h-11 w-11 shrink-0">
                  {!broken && avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt=""
                      className={`h-11 w-11 rounded-full object-cover ${retroMode ? 'border-2 border-black' : 'border border-white/10'}`}
                      onError={() => setAvatarBroken((prev) => ({ ...prev, [event.activity_id]: true }))}
                    />
                  ) : (
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold ${
                        retroMode
                          ? 'border-2 border-black bg-retro-cyan !text-[var(--color-bg-primary)] shadow-[2px_2px_0px_0px_#000000] theme-heading-font font-bold'
                          : theme === 'cyberpunk'
                            ? 'border-cyan-500/50 bg-black/80 text-cyan-300'
                            : theme === 'terminal'
                              ? 'border-green-500/40 bg-black text-green-400'
                              : 'border-[rgba(var(--color-accent-primary-rgb),0.35)] bg-[rgba(var(--color-accent-primary-rgb),0.12)] text-[var(--color-text-primary)]'
                      }`}
                    >
                      {initial}
                    </div>
                  )}
                  <span
                    className={`absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full ${
                      retroMode
                        ? `border-2 border-black shadow-[2px_2px_0px_0px_#000000] ${retroAction.shell}`
                        : 'border border-white/15 bg-[var(--color-bg-primary)]'
                    }`}
                  >
                    <ActionIcon
                      className={`h-3.5 w-3.5 ${retroMode ? retroAction.iconClass : actionIconClass}`}
                      strokeWidth={retroMode ? 2.5 : 2.2}
                    />
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                        retroMode
                          ? 'theme-heading-font border-2 border-black bg-[var(--color-bg-primary)] !text-[var(--color-text-primary)] shadow-[2px_2px_0px_0px_#000000] font-bold'
                          : 'border border-[rgba(var(--color-accent-primary-rgb),0.25)] bg-[rgba(var(--color-accent-primary-rgb),0.08)] text-accent-primary'
                      }`}
                    >
                      {actorName}
                    </span>
                    {event.item_title && (
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                          retroMode
                            ? 'theme-heading-font border-2 border-black bg-retro-yellow !text-[var(--color-text-primary)] shadow-[2px_2px_0px_0px_#000000] font-bold'
                            : 'border border-[rgba(var(--color-accent-secondary-rgb),0.25)] bg-[rgba(var(--color-accent-secondary-rgb),0.08)] text-accent-secondary'
                        }`}
                      >
                        {itemTitle}
                      </span>
                    )}
                    {event.list_name && (
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] ${
                          retroMode
                            ? 'theme-heading-font border-2 border-black bg-retro-pink !text-[var(--color-bg-primary)] shadow-[2px_2px_0px_0px_#000000] font-bold'
                            : 'border border-white/10 bg-white/5 text-[var(--color-text-muted)]'
                        }`}
                      >
                        {listName}
                      </span>
                    )}
                  </div>

                  {ratingVal !== null && (
                    <div className="mt-2 flex items-center gap-0.5" aria-label={`${ratingVal} de 5`}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${
                            i < ratingVal
                              ? retroMode
                                ? darkCard
                                  ? 'fill-[var(--color-bg-primary)] stroke-black stroke-[1.5]'
                                  : 'fill-[var(--color-text-primary)] stroke-black stroke-[1.5]'
                                : 'fill-[color:var(--color-retro-yellow)] stroke-black stroke-[1.75] [paint-order:stroke_fill] text-[color:var(--color-retro-yellow)]'
                              : retroMode
                                ? darkCard
                                  ? '!text-[var(--color-bg-primary)] opacity-35'
                                  : '!text-[var(--color-text-primary)] opacity-40'
                                : 'text-[var(--color-text-muted)] opacity-35'
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  <p
                    className={`mt-2 break-words text-sm leading-relaxed ${
                      retroMode
                        ? `theme-heading-font ${retroInk}`
                        : `text-[var(--color-text-primary)] ${theme === 'terminal' ? 'font-mono text-[13px]' : ''}`
                    }`}
                  >
                    {theme === 'terminal' ? <span className="mr-1 text-green-500/80">&gt;</span> : null}
                    {message}
                  </p>

                  {showCommentPreview && (
                    <p
                      className={`mt-2 line-clamp-2 border-l-2 pl-2 text-xs italic ${
                        retroMode
                          ? darkCard
                            ? 'border-[var(--color-bg-primary)] !text-[var(--color-bg-primary)] opacity-90'
                            : 'border-[var(--color-text-primary)] !text-[var(--color-text-primary)]'
                          : 'border-violet-500/50 text-[var(--color-text-muted)]'
                      } ${theme === 'terminal' ? 'font-mono' : ''}`}
                    >
                      “{event.comment_text!.trim().slice(0, 160)}
                      {event.comment_text!.trim().length > 160 ? '…' : ''}”
                    </p>
                  )}

                  <div
                    className={`mt-3 flex items-center gap-1.5 text-[11px] ${
                      retroMode ? `theme-heading-font ${retroInk} opacity-90` : 'text-[var(--color-text-muted)]'
                    }`}
                  >
                    <Clock3 className={`h-3 w-3 shrink-0 ${retroMode ? retroInk : ''}`} />
                    <span>{relativeTime}</span>
                  </div>
                </div>

                {poster ? (
                  <div className="hidden shrink-0 sm:block">
                    <img
                      src={poster}
                      alt=""
                      className={`h-[60px] w-10 rounded-md object-cover ${
                        retroMode ? 'border-2 border-black shadow-[4px_4px_0px_0px_#000000]' : 'border border-white/10'
                      }`}
                      width={40}
                      height={60}
                    />
                  </div>
                ) : (
                  <div
                    className={`hidden h-[60px] w-10 shrink-0 rounded-md sm:block ${
                      retroMode
                        ? 'border-2 border-dashed border-black bg-[color:var(--color-bg-primary)] shadow-[4px_4px_0px_0px_#000000]'
                        : 'border border-white/10 bg-white/5'
                    }`}
                  />
                )}
              </div>
            </motion.article>
          )
        })}
      </motion.div>

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
