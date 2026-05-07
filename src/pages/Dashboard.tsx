import React, { Suspense, lazy, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ErrorBoundary } from 'react-error-boundary'
import { Film, Tv, Plus, ArrowRight, Trash2, LogOut, Shuffle, Settings } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/supabaseClient'
import { useAuth } from '@/features/auth'
import { useUserProfile } from '@/features/profile'
import { CreateListDialog, ListSelector, ListSettingsModal, useLists } from '@/features/lists'
import { RandomPickManager } from '@/features/items'
import { saveQuickCritique } from '@/features/items/services/quickCritiqueService'
import { setUserItemWatched } from '@/features/items/services/itemUserWatchService'
import { mergeUserWatchIntoItems } from '@/features/items/utils/mergeUserWatchIntoItems'
import { queryKeys } from '@config/queryKeys'
import { SectionErrorFallback, ConfirmDialog, useTheme } from '@/features/shared'
import type { List, ListItem } from '@/features/shared'
import { OracleSection } from '@/features/oracle/components/OracleSection'
import ItemDetailsModal from '@/features/lists/components/ItemDetailsModal'
import { useListItemDetails } from '@/features/lists/hooks/useListItemDetails'

const ActivityFeedPanel = lazy(() => import('@/features/lists/components/ActivityFeed'))

const formatRetroLabel = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()

const ActivityFeedSkeleton: React.FC = () => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const isRetroCartoon = theme === 'retro-cartoon'
  const activityTitle = isRetroCartoon ? formatRetroLabel(t('activity_feed.title')) : t('activity_feed.title')

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center gap-2">
        <div className="h-2 w-2 animate-pulse bg-accent-primary" />
        <h3 className={`text-xs font-bold uppercase tracking-widest text-accent-primary ${isRetroCartoon ? 'theme-heading-font' : 'font-mono'}`}>
          SYS.{activityTitle}
        </h3>
      </div>

      <div className="space-y-3">
        {[1, 2, 3].map((line) => (
          <div
            key={line}
            className="h-10 animate-pulse border border-[rgba(var(--color-accent-primary-rgb),0.1)] bg-[rgba(var(--color-accent-primary-rgb),0.05)]"
            style={{
              clipPath:
                'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
            }}
          />
        ))}
      </div>
    </div>
  )
}

type FlowCardProps = {
  title: string
  description: string
  to: string
  accent: 'cyan' | 'purple'
  cta: string
  icon: React.ReactNode
}

const FlowCard: React.FC<FlowCardProps> = ({ title, description, to, accent, cta, icon }) => {
  const { theme } = useTheme()
  const isRetroCartoon = theme === 'retro-cartoon'
  const isPrimary = accent === 'cyan'
  const toneClasses = isPrimary
    ? 'border-[rgba(var(--color-accent-primary-rgb),0.3)] bg-[rgba(var(--color-accent-primary-rgb),0.06)] hover:border-[rgba(var(--color-accent-primary-rgb),0.55)] hover:bg-[rgba(var(--color-accent-primary-rgb),0.1)]'
    : 'border-[rgba(var(--color-accent-secondary-rgb),0.3)] bg-[rgba(var(--color-accent-secondary-rgb),0.06)] hover:border-[rgba(var(--color-accent-secondary-rgb),0.55)] hover:bg-[rgba(var(--color-accent-secondary-rgb),0.1)]'

  return (
    <Link to={to} className="block">
      <div className={`dashboard-flow-card rounded-2xl border p-5 transition-all duration-200 ${toneClasses}`}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
              {icon}
              <span className={isRetroCartoon ? 'theme-heading-font' : ''}>{isRetroCartoon ? formatRetroLabel(title) : title}</span>
            </div>

            <h3 className={`text-xl font-semibold text-[var(--color-text-primary)] ${isRetroCartoon ? 'theme-heading-font uppercase' : ''}`}>
              {isRetroCartoon ? formatRetroLabel(title) : title}
            </h3>
            <p className={`text-sm leading-relaxed text-[var(--color-text-muted)] ${isRetroCartoon ? 'theme-heading-font' : ''}`}>{description}</p>
          </div>

          <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-[var(--color-text-muted)]" />
        </div>

        <div className={`text-sm font-semibold text-[var(--color-text-primary)] ${isRetroCartoon ? 'theme-heading-font uppercase' : ''}`}>
          {isRetroCartoon ? formatRetroLabel(cta) : cta}
        </div>
      </div>
    </Link>
  )
}

const Dashboard: React.FC = () => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { user } = useAuth()
  const { profile } = useUserProfile()
  const queryClient = useQueryClient()
  const isRetroCartoon = theme === 'retro-cartoon'
  const [isCreateListOpen, setIsCreateListOpen] = useState(false)

  const {
    lists,
    currentList,
    setCurrentList,
    loading: loadingLists,
    createList,
    deleteList,
    leaveList,
    updateList,
  } = useLists(user?.id)

  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)
  const [isConfirmLeaveOpen, setIsConfirmLeaveOpen] = useState(false)
  const [isRandomPickerOpen, setIsRandomPickerOpen] = useState(false)
  const [isListSettingsOpen, setIsListSettingsOpen] = useState(false)
  const [critiqueToast, setCritiqueToast] = useState<string | null>(null)

  useEffect(() => {
    if (!critiqueToast) return
    const timer = window.setTimeout(() => setCritiqueToast(null), 3200)
    return () => window.clearTimeout(timer)
  }, [critiqueToast])

  // Fetch all items from the active list for the random picker and Oracle
  const { data: allItems = [] } = useQuery({
    queryKey: ['items', 'all', currentList?.id, user?.id],
    queryFn: async () => {
      const uid = user?.id
      if (!uid || !currentList?.id) {
        return []
      }
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('list_id', currentList?.id)
      if (error) throw error
      const rows = (data || []) as ListItem[]
      const ids = rows.map((r) => r.id).filter(Boolean)
      if (ids.length === 0) {
        return mergeUserWatchIntoItems(rows, [])
      }
      const { data: watchRows, error: watchError } = await supabase
        .from('item_user_watch')
        .select('item_id, watched')
        .eq('user_id', uid)
        .in('item_id', ids)
      if (watchError) throw watchError
      return mergeUserWatchIntoItems(rows, watchRows ?? [])
    },
    enabled: !!currentList?.id && !!user?.id,
  })

  const nextQueueItem = React.useMemo(() => {
    if (!currentList?.next_queue_item_id || !allItems.length) return null
    return allItems.find((i) => String(i.id) === String(currentList.next_queue_item_id)) ?? null
  }, [allItems, currentList?.next_queue_item_id])

  const handleUpdateItemDashboard = async (id: string, updates: Partial<ListItem>) => {
    const { error } = await supabase.from('items').update(updates).eq('id', id)
    if (error) throw error
    await queryClient.invalidateQueries({ queryKey: ['items'] })
  }

  const displayName = profile?.username || t('navbar.myAccount')
  const hasLists = lists.length > 0
  const hasActiveList = Boolean(currentList)

  const handleToggleVisto = async (id: string, currentState: boolean) => {
    if (!user?.id) throw new Error(t('dashboard.session_required'))
    await setUserItemWatched(id, user.id, !currentState)
    await queryClient.invalidateQueries({ queryKey: ['items'] })
  }

  const handleDeleteItem = async (id: string) => {
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', id)

    if (error) throw error

    await queryClient.invalidateQueries({ queryKey: ['items'] })
  }

  const handleQuickCritiqueSave = async (
    itemId: string,
    rating: number,
    liked: boolean,
    comment?: string | null
  ) => {
    await saveQuickCritique(itemId, rating, liked, comment)
    await queryClient.invalidateQueries({ queryKey: ['items'] })
    await queryClient.invalidateQueries({ queryKey: ['items', 'all', currentList?.id] })
    if (user?.id) {
      await queryClient.invalidateQueries({ queryKey: ['itemRating', itemId, user.id] })
      await queryClient.invalidateQueries({
        queryKey: queryKeys.itemComments.byItemAndUser(itemId, user.id),
      })
      await queryClient.invalidateQueries({
        queryKey: queryKeys.itemComments.byItem(itemId),
      })
      await queryClient.invalidateQueries({
        queryKey: queryKeys.oracle.allRatingsForUser(user.id),
      })
    }
  }

  const itemDetails = useListItemDetails({
    currentUserId: user?.id || '',
    onToggleVisto: handleToggleVisto,
    onDeleteItem: handleDeleteItem,
    getDeleteConfirmationMessage: (item) => t('modal.delete_title', { title: item.titulo }),
    onQuickCritiqueSave: handleQuickCritiqueSave,
    onQuickCritiqueSuccess: () => {
      const msg =
        theme === 'retro-cartoon'
          ? t('dashboard.critique_toast_retro')
          : theme === 'terminal'
            ? t('dashboard.critique_toast_terminal')
            : theme === 'cyberpunk'
              ? t('dashboard.critique_toast_cyberpunk')
              : t('dashboard.critique_toast_default')
      setCritiqueToast(msg)
    },
  })

  const handleListCreated = (newList: List) => {
    setCurrentList(newList)
    setIsCreateListOpen(false)
  }

  const handleDeleteList = async () => {
    if (!currentList) return
    setIsConfirmDeleteOpen(false)
    await deleteList(currentList.id)
  }

  const handleLeaveList = async () => {
    if (!currentList) return
    setIsConfirmLeaveOpen(false)
    await leaveList(currentList.id)
  }

  if (!user) return null

  const listName = currentList?.name ?? ''
  const nextStepTitle = loadingLists
    ? t('dashboard.next_title_loading')
    : hasActiveList
      ? t('dashboard.next_title_active', { name: listName })
      : hasLists
        ? t('dashboard.next_title_pick')
        : t('dashboard.next_title_create')

  const nextStepDescription = loadingLists
    ? t('dashboard.next_desc_loading')
    : hasActiveList
      ? t('dashboard.next_desc_active')
      : hasLists
        ? t('dashboard.next_desc_pick')
        : t('dashboard.next_desc_no_lists')
  const retroText = (value: string) => (isRetroCartoon ? formatRetroLabel(value) : value)

  const heroTitle = isRetroCartoon ? formatRetroLabel(t('dashboard.hero_title')) : t('dashboard.hero_title')
  const activeListLabel = isRetroCartoon ? formatRetroLabel(t('dashboard.active_list_badge')) : t('dashboard.active_list_badge')
  const nextStepLabel = isRetroCartoon ? formatRetroLabel(t('dashboard.next_step_label')) : t('dashboard.next_step_label')
  const stateLabel = isRetroCartoon ? formatRetroLabel(t('dashboard.state_label')) : t('dashboard.state_label')
  const contextLabel = isRetroCartoon ? formatRetroLabel(t('dashboard.context_label')) : t('dashboard.context_label')
  const chooseForMeLabel = isRetroCartoon ? formatRetroLabel(t('dashboard.choose_random_short')) : t('dashboard.choose_random_short')
  const createListLabel = isRetroCartoon ? formatRetroLabel(t('dashboard.create_list_button')) : t('dashboard.create_list_button')
  const goMoviesLabel = isRetroCartoon ? formatRetroLabel(t('dashboard.go_movies')) : t('dashboard.go_movies')
  const goSeriesLabel = isRetroCartoon ? formatRetroLabel(t('dashboard.go_series')) : t('dashboard.go_series')
  const noListsLabel = isRetroCartoon ? t('dashboard.no_lists_banner_retro') : t('dashboard.no_lists_banner')
  const globalActivityLabel = isRetroCartoon
    ? formatRetroLabel(t('dashboard.global_activity_retro_line'))
    : t('dashboard.global_activity_sys')
  const listsCountLabel = t('dashboard.lists_count', { count: lists.length })

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 pb-24 md:px-6">
        <section className="space-y-4 pb-8 pt-10 md:pb-10 md:pt-14">
          <p className={`text-[10px] uppercase tracking-[0.25em] text-accent-primary opacity-80 md:text-xs ${isRetroCartoon ? 'theme-heading-font' : 'font-mono'}`}>
            {t('dashboard.sys_kicker')}
          </p>

          <h1 className={`text-4xl font-black tracking-tighter text-[var(--color-text-primary)] md:text-6xl ${isRetroCartoon ? 'theme-heading-font uppercase' : ''}`}>
            {heroTitle}
          </h1>

          <p className={`max-w-3xl text-sm leading-relaxed text-[var(--color-text-muted)] md:text-lg ${isRetroCartoon ? 'theme-heading-font' : ''}`}>
            {retroText(t('dashboard.welcome_back'))},{' '}
            <span className={`font-semibold text-[var(--color-text-primary)] ${isRetroCartoon ? 'theme-heading-font uppercase' : ''}`}>
              {isRetroCartoon ? formatRetroLabel(displayName) : displayName}
            </span>
            .{' '}
            {retroText(t('dashboard.intro_line'))}
          </p>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div
            className={`dashboard-main-card rounded-2xl border border-[rgba(var(--color-accent-primary-rgb),0.28)] bg-[var(--color-bg-elevated)] ${isRetroCartoon ? 'overflow-hidden p-0' : 'p-6 md:p-8'}`}
          >
            {isRetroCartoon && (
              <div
                className="!bg-retro-yellow border-b-2 border-black px-6 py-3 md:px-8"
                style={{ backgroundColor: 'var(--color-retro-yellow)' }}
              >
                <p className="theme-heading-font mb-1 text-[10px] font-bold uppercase tracking-[0.24em] !text-black">
                  {activeListLabel}
                </p>
                <h2 className="theme-heading-font text-xl font-semibold uppercase !text-black md:text-2xl">
                  {loadingLists
                    ? formatRetroLabel(t('dashboard.loading_lists_short'))
                    : currentList?.name
                      ? formatRetroLabel(currentList.name)
                      : formatRetroLabel(t('dashboard.no_list_selected'))}
                </h2>
              </div>
            )}
            <div className={isRetroCartoon ? 'p-6 md:p-8' : undefined}>
            <div className="mb-6">
              {!isRetroCartoon ? (
                <>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em] text-accent-primary opacity-85">
                    {activeListLabel}
                  </p>

                  <h2 className={`text-2xl font-semibold text-[var(--color-text-primary)] md:text-3xl ${isRetroCartoon ? 'theme-heading-font uppercase' : ''}`}>
                    {loadingLists
                      ? (isRetroCartoon ? formatRetroLabel(t('dashboard.loading_lists_short')) : t('dashboard.loading_lists'))
                      : currentList?.name
                        ? (isRetroCartoon ? formatRetroLabel(currentList.name) : currentList.name)
                        : (isRetroCartoon ? formatRetroLabel(t('dashboard.no_list_selected')) : t('dashboard.no_list_selected'))}
                  </h2>
                </>
              ) : null}

              <p className={`mt-3 max-w-2xl text-sm leading-relaxed ${isRetroCartoon ? 'theme-heading-font !text-black' : 'text-[var(--color-text-muted)]'}`}>
                {loadingLists
                  ? retroText(t('dashboard.main_hint_loading'))
                  : hasActiveList
                    ? retroText(t('dashboard.main_hint_active'))
                    : hasLists
                      ? retroText(t('dashboard.main_hint_pick'))
                      : retroText(t('dashboard.main_hint_no_lists'))}
              </p>
            </div>

            {hasLists && (
              <div className="mb-5 flex flex-col gap-3">
                {/* Selector de lista principal */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[240px]">
                    <ListSelector
                      lists={lists}
                      currentList={currentList}
                      onChange={setCurrentList}
                      loading={loadingLists}
                      hideLabel
                      hideDescription
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsRandomPickerOpen(true)}
                      disabled={!hasActiveList || loadingLists}
                      className={`flex h-11 items-center justify-center gap-2 rounded-xl border border-[rgba(var(--color-accent-primary-rgb),0.3)] bg-[rgba(var(--color-accent-primary-rgb),0.05)] px-5 text-[11px] font-black uppercase tracking-widest text-[var(--color-accent-primary)] transition hover:bg-[rgba(var(--color-accent-primary-rgb),0.08)] hover:shadow-[0_0_15px_rgba(var(--color-accent-primary-rgb),0.1)] disabled:opacity-50 ${isRetroCartoon ? 'theme-heading-font' : 'font-mono'}`}
                      title={t('dashboard.random_pick_tooltip')}
                    >
                      <Shuffle className="h-4 w-4" />
                      <span className="hidden sm:inline">{chooseForMeLabel}</span>
                    </button>

                    {currentList && (
                      <div className="flex items-center gap-1 p-1 rounded-xl border border-[rgba(var(--color-accent-primary-rgb),0.2)] bg-[var(--color-bg-secondary)]">
                        {currentList.owner_id === user.id && (
                          <button
                            type="button"
                            className="p-2 text-[var(--color-text-muted)] hover:text-accent-primary transition-colors"
                            onClick={() => setIsListSettingsOpen(true)}
                            title={t('dialog.list_settings_title')}
                          >
                            <Settings className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          className="p-2 text-[var(--color-text-muted)] hover:text-red-500 transition-colors"
                          onClick={() => (currentList.owner_id === user.id ? setIsConfirmDeleteOpen(true) : setIsConfirmLeaveOpen(true))}
                          title={currentList.owner_id === user.id ? t('lists.delete') : t('lists.leave')}
                        >
                          {currentList.owner_id === user.id ? <Trash2 className="h-4 w-4" /> : <LogOut className="h-4 w-4" />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {nextQueueItem && currentList && (
              <div className="mb-5 rounded-2xl border border-[rgba(var(--color-accent-secondary-rgb),0.35)] bg-[rgba(var(--color-accent-secondary-rgb),0.06)] p-4">
                <p className={`mb-1 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] ${isRetroCartoon ? 'theme-heading-font' : 'font-mono'}`}>
                  {t('dashboard.next_queue_title')}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => void itemDetails.handleOpenDetails(nextQueueItem)}
                    className={`text-left text-base font-semibold text-[var(--color-text-primary)] underline-offset-2 hover:underline ${isRetroCartoon ? 'theme-heading-font uppercase' : ''}`}
                  >
                    {nextQueueItem.titulo}
                  </button>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {nextQueueItem.tipo === 'pelicula' ? t('movie_type') : t('series_type')}
                  </span>
                  {currentList.owner_id === user.id && (
                    <button
                      type="button"
                      onClick={() => void updateList(currentList.id, { next_queue_item_id: null })}
                      className="rounded-lg border border-[rgba(var(--color-text-muted),0.35)] px-3 py-1 text-xs font-semibold text-[var(--color-text-muted)] hover:border-red-400/50 hover:text-red-300"
                    >
                      {t('dashboard.next_queue_clear')}
                    </button>
                  )}
                </div>
              </div>
            )}

            {!loadingLists && !hasLists && (
              <div className="mb-5 rounded-2xl border border-[rgba(var(--color-accent-primary-rgb),0.2)] bg-[var(--color-bg-secondary)] p-4">
                <p className={`text-sm text-[var(--color-text-muted)] ${isRetroCartoon ? 'theme-heading-font' : ''}`}>
                  {noListsLabel}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={() => setIsCreateListOpen(true)}
                className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold transition ${isRetroCartoon ? 'theme-heading-font uppercase' : ''}`}
                style={{
                  borderColor: 'rgba(var(--color-accent-primary-rgb), 0.25)',
                  background: 'rgba(var(--color-accent-primary-rgb), 0.06)',
                  color: 'var(--color-text-primary)',
                }}
              >
                <Plus className="h-4 w-4" />
                {createListLabel}
              </button>

              <Link
                to="/peliculas"
                className={`inline-flex items-center justify-center rounded-2xl border px-5 py-3 text-sm font-semibold transition ${isRetroCartoon ? 'theme-heading-font uppercase' : ''}`}
                style={{ borderColor: 'rgba(var(--color-accent-primary-rgb),0.4)', background: 'rgba(var(--color-accent-primary-rgb),0.1)', color: 'var(--color-accent-primary)' }}
              >
                {goMoviesLabel}
              </Link>

              <Link
                to="/series"
                className={`inline-flex items-center justify-center rounded-2xl border px-5 py-3 text-sm font-semibold transition ${isRetroCartoon ? 'theme-heading-font uppercase' : ''}`}
                style={{ borderColor: 'rgba(var(--color-accent-secondary-rgb),0.4)', background: 'rgba(var(--color-accent-secondary-rgb),0.1)', color: 'var(--color-accent-secondary)' }}
              >
                {goSeriesLabel}
              </Link>
            </div>
            </div>
          </div>

          <div
            className={`dashboard-next-step-card rounded-2xl border border-[rgba(var(--color-accent-primary-rgb),0.18)] bg-[var(--color-bg-elevated)] ${isRetroCartoon ? 'overflow-hidden p-0' : 'p-6'}`}
          >
            {isRetroCartoon && (
              <div
                className="!bg-retro-cyan border-b-2 border-black px-6 py-3"
                style={{ backgroundColor: 'var(--color-retro-cyan)' }}
              >
                <p className="theme-heading-font mb-1 text-[10px] font-bold uppercase tracking-[0.22em] !text-[var(--color-bg-primary)]">{nextStepLabel}</p>
                <h2 className="theme-heading-font text-xl font-semibold uppercase !text-[var(--color-bg-primary)]">
                  {formatRetroLabel(nextStepTitle)}
                </h2>
              </div>
            )}
            <div className={isRetroCartoon ? 'p-6' : undefined}>
            {!isRetroCartoon && (
              <>
            <p className={`mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-text-muted)] ${isRetroCartoon ? 'theme-heading-font' : ''}`}>
              {nextStepLabel}
            </p>

            <h2 className={`text-2xl font-semibold text-[var(--color-text-primary)] ${isRetroCartoon ? 'theme-heading-font uppercase' : ''}`}>
              {isRetroCartoon ? formatRetroLabel(nextStepTitle) : nextStepTitle}
            </h2>
              </>
            )}

            <p className={`mt-3 text-sm leading-relaxed ${isRetroCartoon ? 'theme-heading-font !text-black' : 'text-[var(--color-text-muted)]'}`}>{retroText(nextStepDescription)}</p>

            <div className="mt-6 grid gap-3">
              <div className="rounded-2xl border border-[rgba(var(--color-accent-primary-rgb),0.15)] bg-[var(--color-bg-secondary)] p-4">
                <p className={`mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)] ${isRetroCartoon ? 'theme-heading-font' : ''}`}>
                  {stateLabel}
                </p>
                <p className={`text-lg font-semibold text-[var(--color-text-primary)] ${isRetroCartoon ? 'theme-heading-font uppercase' : ''}`}>
                  {loadingLists
                    ? (isRetroCartoon ? formatRetroLabel(t('dashboard.preparing_lists_state')) : t('dashboard.preparing_lists_state'))
                    : isRetroCartoon
                      ? formatRetroLabel(listsCountLabel)
                      : listsCountLabel}
                </p>
              </div>

              <div className="rounded-2xl border border-[rgba(var(--color-accent-primary-rgb),0.15)] bg-[var(--color-bg-secondary)] p-4">
                <p className={`mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)] ${isRetroCartoon ? 'theme-heading-font' : ''}`}>
                  {contextLabel}
                </p>
                <p className={`text-sm font-semibold text-[var(--color-text-primary)] ${isRetroCartoon ? 'theme-heading-font uppercase' : ''}`}>
                  {hasActiveList
                    ? (isRetroCartoon ? formatRetroLabel(t('dashboard.context_resolved')) : t('dashboard.context_resolved'))
                    : (isRetroCartoon ? formatRetroLabel(t('dashboard.context_missing')) : t('dashboard.context_missing'))}
                </p>
              </div>
            </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <FlowCard
            title={isRetroCartoon ? formatRetroLabel(t('movies.title')) : t('movies.title')}
            description={
              hasActiveList
                ? retroText(t('dashboard.flow_movies_desc_with_list', { name: listName }))
                : retroText(t('dashboard.flow_movies_desc_default'))
            }
            to="/peliculas"
            cta={
              hasActiveList
                ? isRetroCartoon
                  ? formatRetroLabel(t('dashboard.flow_movies_cta_continue'))
                  : t('dashboard.flow_movies_cta_continue')
                : isRetroCartoon
                  ? formatRetroLabel(t('dashboard.flow_movies_cta_open'))
                  : t('dashboard.flow_movies_cta_open')
            }
            accent="cyan"
            icon={<Film className="h-4 w-4" strokeWidth={2.5} />}
          />

          <FlowCard
            title={isRetroCartoon ? formatRetroLabel(t('series.title')) : t('series.title')}
            description={
              hasActiveList
                ? retroText(t('dashboard.flow_series_desc_with_list', { name: listName }))
                : retroText(t('dashboard.flow_series_desc_default'))
            }
            to="/series"
            cta={
              hasActiveList
                ? isRetroCartoon
                  ? formatRetroLabel(t('dashboard.flow_series_cta_continue'))
                  : t('dashboard.flow_series_cta_continue')
                : isRetroCartoon
                  ? formatRetroLabel(t('dashboard.flow_series_cta_open'))
                  : t('dashboard.flow_series_cta_open')
            }
            accent="purple"
            icon={<Tv className="h-4 w-4" strokeWidth={2.5} />}
          />
        </section>

        {hasActiveList && (
          <section className="mt-8">
            <OracleSection items={allItems} />
          </section>
        )}

        <section className="mt-8 rounded-2xl border border-[rgba(var(--color-accent-primary-rgb),0.18)] bg-[rgba(0,0,0,0.56)] p-5 md:p-6">
          <div className="mb-5">
            <h2 className={`text-sm font-black uppercase tracking-widest text-accent-primary md:text-base ${isRetroCartoon ? 'theme-heading-font' : 'font-mono'}`}>
              SYS.{isRetroCartoon ? formatRetroLabel(t('activity_feed.title')) : t('activity_feed.title')}
            </h2>
            <p className={`mt-1 text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-muted)] opacity-80 md:text-xs ${isRetroCartoon ? 'theme-heading-font' : 'font-mono'}`}>
              {'>'} {globalActivityLabel}
            </p>
          </div>

          <ErrorBoundary FallbackComponent={SectionErrorFallback}>
            <Suspense fallback={<ActivityFeedSkeleton />}>
              <ActivityFeedPanel limit={20} />
            </Suspense>
          </ErrorBoundary>
        </section>
      </div>

      {/* Modales y Diálogos */}
      <CreateListDialog
        open={isCreateListOpen}
        onClose={() => setIsCreateListOpen(false)}
        onCreate={createList}
        onCreated={handleListCreated}
      />

      {currentList && (
        <ListSettingsModal
          open={isListSettingsOpen}
          onClose={() => setIsListSettingsOpen(false)}
          list={currentList}
          userId={user.id}
        />
      )}

      <ConfirmDialog
        isOpen={isConfirmDeleteOpen}
        title={t('confirm_delete_list.title')}
        message={t('confirm_delete_list.description')}
        confirmText={t('confirm_delete_list.confirm')}
        cancelText={t('confirm_delete_list.cancel')}
        onConfirm={handleDeleteList}
        onCancel={() => setIsConfirmDeleteOpen(false)}
      />

      <ConfirmDialog
        isOpen={isConfirmLeaveOpen}
        title={t('confirm_leave_list.title')}
        message={t('confirm_leave_list.description')}
        confirmText={t('confirm_leave_list.confirm')}
        cancelText={t('confirm_leave_list.cancel')}
        onConfirm={handleLeaveList}
        onCancel={() => setIsConfirmLeaveOpen(false)}
      />

      {/* Random Picker feature */}
      <RandomPickManager
        isOpen={isRandomPickerOpen}
        onOpenChange={setIsRandomPickerOpen}
        items={allItems}
        onViewDetails={(item) => {
          void itemDetails.handleOpenDetails(item)
        }}
      />

      <ItemDetailsModal
        isOpen={itemDetails.isModalOpen}
        isAnimating={itemDetails.isModalAnimating}
        selectedItem={itemDetails.selectedItem}
        synopsis={itemDetails.synopsis}
        synopsisLoading={itemDetails.synopsisLoading}
        synopsisError={itemDetails.synopsisError}
        modalActionLoading={itemDetails.modalActionLoading}
        canDelete={itemDetails.canDeleteSelectedItem}
        promptCommentOnOpen={itemDetails.shouldPromptComment}
        titlePrefix={t('details_title')}
        closeLabel={t('modal.close')}
        noImageLabel={t('no_image')}
        loadingSynopsisLabel={t('loading.synopsis')}
        emptySynopsisLabel={t('item.no_synopsis')}
        movieTypeLabel={t('action.movie_type')}
        seriesTypeLabel={t('action.series_type')}
        watchedLabel={t('item.watched')}
        notWatchedLabel={t('item.not_watched')}
        markWatchedLabel={t('item.mark_watched')}
        markUnwatchedLabel={t('item.mark_unwatched')}
        deleteLabel={t('action.delete')}
        onClose={itemDetails.handleCloseDetails}
        onToggle={itemDetails.handleToggleFromModal}
        onDelete={itemDetails.handleDeleteFromModal}
        onQuickCritiqueConfirm={itemDetails.handleConfirmQuickCritique}
        isQuickCritiqueSaving={itemDetails.isQuickCritiqueSaving}
        closeButtonRef={itemDetails.closeButtonRef}
        listMeta={
          currentList
            ? {
                listId: currentList.id,
                ownerId: currentList.owner_id,
                nextQueueItemId: currentList.next_queue_item_id ?? null,
              }
            : null
        }
        currentUserId={user.id}
        onUpdateItem={handleUpdateItemDashboard}
        onSetNextQueue={(itemId) => (currentList ? updateList(currentList.id, { next_queue_item_id: itemId }) : Promise.resolve())}
      />

      {critiqueToast && (
        <div
          className="fixed bottom-6 left-1/2 z-[200] max-w-[min(90vw,24rem)] -translate-x-1/2 border border-[rgba(var(--color-accent-primary-rgb),0.35)] bg-[var(--color-bg-elevated)] px-4 py-3 text-center text-sm font-bold text-[var(--color-text-primary)] shadow-xl theme-heading-font"
          role="status"
        >
          {critiqueToast}
        </div>
      )}
    </>
  )
}

export default Dashboard

