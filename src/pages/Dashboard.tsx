import React, { Suspense, lazy, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ErrorBoundary } from 'react-error-boundary'
import { Film, Tv, Plus, ArrowRight, Trash2, LogOut, Shuffle } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/supabaseClient'
import { useAuth } from '@/features/auth'
import { useUserProfile } from '@/features/profile'
import { CreateListDialog, ListSelector, useLists } from '@/features/lists'
import { RandomPickManager } from '@/features/items'
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

  const { lists, currentList, setCurrentList, loading: loadingLists, createList, deleteList, leaveList } = useLists(user?.id)

  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)
  const [isConfirmLeaveOpen, setIsConfirmLeaveOpen] = useState(false)
  const [isRandomPickerOpen, setIsRandomPickerOpen] = useState(false)

  // Fetch all items from the active list for the random picker and Oracle
  const { data: allItems = [] } = useQuery({
    queryKey: ['items', 'all', currentList?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('list_id', currentList?.id)
      if (error) throw error
      return data as ListItem[]
    },
    enabled: !!currentList?.id,
  })

  const displayName = profile?.username || t('navbar.myAccount')
  const hasLists = lists.length > 0
  const hasActiveList = Boolean(currentList)

  const handleToggleVisto = async (id: string, currentState: boolean) => {
    const { error } = await supabase
      .from('items')
      .update({ visto: !currentState })
      .eq('id', id)

    if (error) throw error

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

  const itemDetails = useListItemDetails({
    currentUserId: user?.id || '',
    onToggleVisto: handleToggleVisto,
    onDeleteItem: handleDeleteItem,
    getDeleteConfirmationMessage: (item) => t('modal.delete_title', { title: item.titulo }),
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

  const nextStepTitle = loadingLists
    ? 'Preparando tu contexto'
    : hasActiveList
      ? `Entrar con "${currentList?.name}"`
      : hasLists
        ? 'Elegir lista activa'
        : 'Crear la primera lista'

  const nextStepDescription = loadingLists
    ? 'En cuanto carguen tus listas, podrás seguir el flujo principal.'
    : hasActiveList
      ? 'La forma más rápida de avanzar es entrar a películas o series y decidir desde pendientes.'
      : hasLists
        ? 'Ya tienes listas. Solo falta marcar cuál manda ahora mismo.'
        : 'Primero necesitas una lista para añadir opciones y empezar a decidir juntos.'
  const retroText = (value: string) => (isRetroCartoon ? formatRetroLabel(value) : value)

  const heroTitle = isRetroCartoon
    ? formatRetroLabel('Decide que ver juntos rapido')
    : 'Decide qué ver juntos, rápido.'
  const activeListLabel = isRetroCartoon ? formatRetroLabel('Lista activa') : 'Lista activa'
  const nextStepLabel = isRetroCartoon ? formatRetroLabel('Siguiente paso') : 'Siguiente paso'
  const stateLabel = isRetroCartoon ? formatRetroLabel('Estado') : 'Estado'
  const contextLabel = isRetroCartoon ? formatRetroLabel('Contexto') : 'Contexto'
  const chooseForMeLabel = isRetroCartoon ? formatRetroLabel('Elegir por mi') : 'Elegir por mí'
  const createListLabel = isRetroCartoon ? formatRetroLabel('Crear lista') : 'Crear lista'
  const goMoviesLabel = isRetroCartoon ? formatRetroLabel('Ir a peliculas') : 'Ir a películas'
  const goSeriesLabel = isRetroCartoon ? formatRetroLabel('Ir a series') : 'Ir a series'
  const noListsLabel = isRetroCartoon
    ? 'NO HAY NINGUNA LISTA TODAVIA. CREAR UNA ES EL PRIMER PASO PARA PODER ANADIR Y DECIDIR.'
    : 'No hay ninguna lista todavía. Crear una es el primer paso para poder añadir y decidir.'
  const globalActivityLabel = isRetroCartoon ? formatRetroLabel('Global activity log') : 'GLOBAL_ACTIVITY_LOG'

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 pb-24 md:px-6">
        <section className="space-y-4 pb-8 pt-10 md:pb-10 md:pt-14">
          <p className={`text-[10px] uppercase tracking-[0.25em] text-accent-primary opacity-80 md:text-xs ${isRetroCartoon ? 'theme-heading-font' : 'font-mono'}`}>
            {'>'} DECISION_DASHBOARD
          </p>

          <h1 className={`text-4xl font-black tracking-tighter text-[var(--color-text-primary)] md:text-6xl ${isRetroCartoon ? 'theme-heading-font uppercase' : ''}`}>
            {heroTitle}
          </h1>

          <p className={`max-w-3xl text-sm leading-relaxed text-[var(--color-text-muted)] md:text-lg ${isRetroCartoon ? 'theme-heading-font' : ''}`}>
            {retroText('Bienvenido de nuevo')},{' '}
            <span className={`font-semibold text-[var(--color-text-primary)] ${isRetroCartoon ? 'theme-heading-font uppercase' : ''}`}>
              {isRetroCartoon ? formatRetroLabel(displayName) : displayName}
            </span>.
            {' '}
            {retroText('Aqui solo deberia quedar claro que lista esta activa y por donde seguir.')}
          </p>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="dashboard-main-card rounded-2xl border border-[rgba(var(--color-accent-primary-rgb),0.28)] bg-[var(--color-bg-elevated)] p-6 md:p-8">
            <div className="mb-6">
              <p className={`mb-2 text-[10px] font-bold uppercase tracking-[0.24em] text-accent-primary opacity-85 ${isRetroCartoon ? 'theme-heading-font' : ''}`}>
                {activeListLabel}
              </p>

              <h2 className={`text-2xl font-semibold text-[var(--color-text-primary)] md:text-3xl ${isRetroCartoon ? 'theme-heading-font uppercase' : ''}`}>
                {loadingLists
                  ? (isRetroCartoon ? formatRetroLabel('Cargando listas') : 'Cargando listas...')
                  : currentList?.name
                    ? (isRetroCartoon ? formatRetroLabel(currentList.name) : currentList.name)
                    : (isRetroCartoon ? formatRetroLabel('Sin lista seleccionada') : 'Sin lista seleccionada')}
              </h2>

              <p className={`mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-text-muted)] ${isRetroCartoon ? 'theme-heading-font' : ''}`}>
                {loadingLists
                  ? retroText('Estamos preparando tu contexto.')
                  : hasActiveList
                    ? retroText('Todo lo que hagas al entrar en peliculas o series se aplicara a esta lista.')
                    : hasLists
                      ? retroText('Elige cual quieres usar ahora para que el flujo quede claro.')
                      : retroText('Todavia no tienes listas. Crea una para empezar.')}
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
                      title={t('random_picker.button_tooltip', 'Elegir algo al azar')}
                    >
                      <Shuffle className="h-4 w-4" />
                      <span className="hidden sm:inline">{chooseForMeLabel}</span>
                    </button>

                    {currentList && (
                      <div className="flex items-center gap-1 p-1 rounded-xl border border-[rgba(var(--color-accent-primary-rgb),0.2)] bg-[var(--color-bg-secondary)]">
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

          <div className="dashboard-next-step-card rounded-2xl border border-[rgba(var(--color-accent-primary-rgb),0.18)] bg-[var(--color-bg-elevated)] p-6">
            <p className={`mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-text-muted)] ${isRetroCartoon ? 'theme-heading-font' : ''}`}>
              {nextStepLabel}
            </p>

            <h2 className={`text-2xl font-semibold text-[var(--color-text-primary)] ${isRetroCartoon ? 'theme-heading-font uppercase' : ''}`}>
              {isRetroCartoon ? formatRetroLabel(nextStepTitle) : nextStepTitle}
            </h2>

            <p className={`mt-3 text-sm leading-relaxed text-[var(--color-text-muted)] ${isRetroCartoon ? 'theme-heading-font' : ''}`}>{retroText(nextStepDescription)}</p>

            <div className="mt-6 grid gap-3">
              <div className="rounded-2xl border border-[rgba(var(--color-accent-primary-rgb),0.15)] bg-[var(--color-bg-secondary)] p-4">
                <p className={`mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)] ${isRetroCartoon ? 'theme-heading-font' : ''}`}>
                  {stateLabel}
                </p>
                <p className={`text-lg font-semibold text-[var(--color-text-primary)] ${isRetroCartoon ? 'theme-heading-font uppercase' : ''}`}>
                  {loadingLists
                    ? (isRetroCartoon ? formatRetroLabel('Preparando listas') : 'Preparando listas')
                    : `${lists.length} ${isRetroCartoon ? formatRetroLabel(lists.length === 1 ? 'lista' : 'listas') : lists.length === 1 ? 'lista' : 'listas'}`}
                </p>
              </div>

              <div className="rounded-2xl border border-[rgba(var(--color-accent-primary-rgb),0.15)] bg-[var(--color-bg-secondary)] p-4">
                <p className={`mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)] ${isRetroCartoon ? 'theme-heading-font' : ''}`}>
                  {contextLabel}
                </p>
                <p className={`text-sm font-semibold text-[var(--color-text-primary)] ${isRetroCartoon ? 'theme-heading-font uppercase' : ''}`}>
                  {hasActiveList
                    ? (isRetroCartoon ? formatRetroLabel('Lista activa resuelta') : 'Lista activa resuelta')
                    : (isRetroCartoon ? formatRetroLabel('Falta lista activa') : 'Falta lista activa')}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <FlowCard
            title={isRetroCartoon ? formatRetroLabel('Peliculas') : 'Películas'}
            description={
              hasActiveList
                ? retroText(`Entrar con "${currentList?.name}" para anadir opciones y decidir desde pendientes.`)
                : retroText('Abrir peliculas y continuar el flujo principal.')
            }
            to="/peliculas"
            cta={hasActiveList ? (isRetroCartoon ? 'SEGUIR CON PELICULAS' : 'Seguir con películas') : (isRetroCartoon ? 'ABRIR PELICULAS' : 'Abrir películas')}
            accent="cyan"
            icon={<Film className="h-4 w-4" strokeWidth={2.5} />}
          />

          <FlowCard
            title="Series"
            description={
              hasActiveList
                ? retroText(`Usar "${currentList?.name}" para seguir el mismo flujo en series.`)
                : retroText('Abrir series y continuar el flujo principal.')
            }
            to="/series"
            cta={hasActiveList ? (isRetroCartoon ? 'SEGUIR CON SERIES' : 'Seguir con series') : (isRetroCartoon ? 'ABRIR SERIES' : 'Abrir series')}
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
        closeButtonRef={itemDetails.closeButtonRef}
      />
    </>
  )
}

export default Dashboard

