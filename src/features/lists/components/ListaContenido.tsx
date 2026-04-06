import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth'
import { useFilters, useItems, RandomPickManager } from '@/features/items'
import { FilterState, List, ErrorAlert, useTheme } from '@/features/shared'
import { CreateListDialog, InviteDialog } from './ListDialogs'
import ListActiveHeader from './ListActiveHeader'
import ListSetupEmptyState from './ListSetupEmptyState'
import ListSearchSection from './ListSearchSection'
import ListFiltersSection from './ListFiltersSection'
import ListDiscoverSection from './ListDiscoverSection'
import ItemDetailsModal from './ItemDetailsModal'
import { useListSearchFlow } from '../hooks/useListSearchFlow'
import { useListItemDetails } from '../hooks/useListItemDetails'
import { useListContentView } from '../hooks/useListContentView'

interface ListaContenidoProps {
  tipo: 'pelicula' | 'serie'
  icono: string
  listId?: string
  lists?: List[]
  currentList?: List
  setCurrentList?: (list: List) => void
  loadingLists?: boolean
  createList?: (name: string, description?: string) => Promise<List | null>
}

const ListaContenido: React.FC<ListaContenidoProps> = ({
  tipo,
  listId,
  lists = [],
  currentList,
  setCurrentList,
  loadingLists,
  createList,
}) => {
  const { user } = useAuth()
  const { t } = useTranslation()

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [isMobile, setIsMobile] = useState(false)
  const [showSecondaryControls, setShowSecondaryControls] = useState(false)
  const [isRandomPickerOpen, setIsRandomPickerOpen] = useState(false)

  const searchSectionRef = useRef<HTMLDivElement>(null)
  const discoverSectionRef = useRef<HTMLDivElement>(null)

  const { theme } = useTheme()
  const { items, loading, error: itemsError, addItem, deleteItem, toggleVisto, quickCritiqueAndWatch } =
    useItems(tipo, user?.id || '', listId)

  const [critiqueToast, setCritiqueToast] = useState<string | null>(null)

  const critiqueSuccessCopy = useMemo(() => {
    switch (theme) {
      case 'retro-cartoon':
        return 'ARCHIVO ACTUALIZADO!'
      case 'terminal':
        return '[OK] ARCHIVO_ACTUALIZADO'
      case 'cyberpunk':
        return 'BUFFER SYNC · VISTO + CRITICA OK'
      default:
        return 'Critica guardada'
    }
  }, [theme])

  useEffect(() => {
    if (!critiqueToast) return
    const timer = window.setTimeout(() => setCritiqueToast(null), 3200)
    return () => window.clearTimeout(timer)
  }, [critiqueToast])

  const { filters, updateFilter, resetFilters } = useFilters()

  const focusSearch = () => {
    searchSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    const input = searchSectionRef.current?.querySelector('input') as HTMLInputElement | null
    input?.focus()
  }

  const focusDecisionBlock = () => {
    discoverSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleListChange = (list: List) => {
    setCurrentList?.(list)
    requestAnimationFrame(() => {
      focusSearch()
    })
  }

  const handleFilterChange = (filterKey: keyof FilterState, value: FilterState[keyof FilterState]) => {
    updateFilter(filterKey, value)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const [prevFilters, setPrevFilters] = useState(filters)

  if (
    filters.searchQuery !== prevFilters.searchQuery ||
    filters.showWatched !== prevFilters.showWatched ||
    filters.showUnwatched !== prevFilters.showUnwatched ||
    filters.sortBy !== prevFilters.sortBy ||
    filters.sortOrder !== prevFilters.sortOrder
  ) {
    setPrevFilters(filters)
    setCurrentPage(1)
  }

  const {
    pendingItems,
    watchedItems,
    visiblePendingItems,
    visibleWatchedItems,
    totalVisibleItems,
    totalPages,
    paginatedPendingItems,
    paginatedWatchedItems,
  } = useListContentView({
    items,
    filters,
    currentPage,
  })

  const searchFlow = useListSearchFlow({
    tipo,
    listId,
    user: user || { id: '', email: '' },
    onAddItem: addItem,
  })

  const itemDetails = useListItemDetails({
    currentUserId: user?.id || '',
    onToggleVisto: toggleVisto,
    onDeleteItem: deleteItem,
    getDeleteConfirmationMessage: (item) => t('modal.delete_title', { title: item.titulo }),
    onQuickCritiqueSave: async (itemId, rating, liked, comment) => {
      await quickCritiqueAndWatch({ itemId, rating, liked, comment })
    },
    onQuickCritiqueSuccess: () => setCritiqueToast(critiqueSuccessCopy),
  })

  const allVisibleItems = React.useMemo(() => {
    return [...visiblePendingItems, ...visibleWatchedItems]
  }, [visiblePendingItems, visibleWatchedItems])

  const currentItemIndex = itemDetails.selectedItem
    ? allVisibleItems.findIndex((i) => i.id === itemDetails.selectedItem!.id)
    : -1

  const handleNextItem =
    currentItemIndex >= 0 && currentItemIndex < allVisibleItems.length - 1
      ? () => itemDetails.handleOpenDetails(allVisibleItems[currentItemIndex + 1])
      : undefined

  const handlePrevItem =
    currentItemIndex > 0
      ? () => itemDetails.handleOpenDetails(allVisibleItems[currentItemIndex - 1])
      : undefined

  if (!user) return null

  return (
    <div className="list-content-shell relative min-h-screen w-full overflow-x-hidden bg-[var(--color-bg-primary)] font-sans">
      <CreateListDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreated={(newList: List) => {
          setShowCreateDialog(false)
          if (setCurrentList) {
            setCurrentList(newList)
          }

          requestAnimationFrame(() => {
            focusSearch()
          })
        }}
        onCreate={createList}
      />

      {currentList && (
        <InviteDialog
          open={showInviteDialog}
          onClose={() => setShowInviteDialog(false)}
          list={currentList}
        />
      )}

      <RandomPickManager
        isOpen={isRandomPickerOpen}
        onOpenChange={setIsRandomPickerOpen}
        items={items}
        onViewDetails={itemDetails.handleOpenDetails}
      />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-8 md:px-6 md:py-12">

        <ListActiveHeader
          currentList={currentList}
          lists={lists}
          setCurrentList={setCurrentList}
          loadingLists={loadingLists}
          pendingCount={pendingItems.length}
          watchedCount={watchedItems.length}
          onCreateList={() => setShowCreateDialog(true)}
          onInvite={() => setShowInviteDialog(true)}
          onListChange={handleListChange}
          onFocusDecisionBlock={focusDecisionBlock}
          createListLabel={t('action.create_list')}
          inviteLabel={t('action.invite')}
          onRandomPick={() => setIsRandomPickerOpen(true)}
        />

        {!currentList && (
          <ListSetupEmptyState
            lists={lists}
            loadingLists={loadingLists}
            setCurrentList={setCurrentList}
            onListChange={handleListChange}
            onCreateList={() => setShowCreateDialog(true)}
            createListLabel={t('action.create_list')}
          />
        )}

        {currentList && (
          <>
            {itemsError && <ErrorAlert message={itemsError} onClose={() => {}} />}
            {searchFlow.suggestionsError && (
              <ErrorAlert message={searchFlow.suggestionsError} onClose={() => {}} />
            )}

            <div ref={searchSectionRef}>
              <ListSearchSection
                searchInput={searchFlow.searchInput}
                setSearchInput={searchFlow.setSearchInput}
                onSubmit={searchFlow.handleAddManual}
                suggestionsLoading={searchFlow.suggestionsLoading}
                showSuggestions={searchFlow.showSuggestions}
                suggestions={searchFlow.suggestions}
                onSuggestionSelect={searchFlow.handleAddFromSuggestion}
                sugerenciasRef={searchFlow.sugerenciasRef}
                searchPlaceholder={t(
                  tipo === 'pelicula'
                    ? 'action.search_movie_placeholder'
                    : 'action.search_series_placeholder'
                )}
              />
            </div>

            <ListFiltersSection
              filters={filters}
              showSecondaryControls={showSecondaryControls}
              onToggleSecondaryControls={() => setShowSecondaryControls((prev) => !prev)}
              onResetFilters={resetFilters}
              onFilterChange={handleFilterChange}
            />

            <div ref={discoverSectionRef}>
              <ListDiscoverSection
                tipo={tipo}
                loading={loading}
                items={items}
                searchQuery={filters.searchQuery}
                totalVisibleItems={totalVisibleItems}
                currentUserId={user.id}
                currentPage={currentPage}
                totalPages={totalPages}
                isMobile={isMobile}
                visiblePendingItems={visiblePendingItems}
                paginatedPendingItems={paginatedPendingItems}
                visibleWatchedItems={visibleWatchedItems}
                paginatedWatchedItems={paginatedWatchedItems}
                showPendingSection={filters.showUnwatched}
                showWatchedSection={filters.showWatched}
                onFocusSearch={focusSearch}
                onResetDiscovery={() => {
                  resetFilters()
                  searchFlow.resetSearchUi()
                }}
                onDelete={deleteItem}
                onToggleVisto={toggleVisto}
                onOpenDetails={itemDetails.handleOpenDetails}
                onPageChange={handlePageChange}
              />
            </div>
          </>
        )}
      </div>

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
        onNext={handleNextItem}
        onPrevious={handlePrevItem}
        closeButtonRef={itemDetails.closeButtonRef}
      />

      {critiqueToast && (
        <div
          className="fixed bottom-6 left-1/2 z-[200] max-w-[min(90vw,24rem)] -translate-x-1/2 px-4 py-3 text-center text-sm font-bold shadow-xl border border-[rgba(var(--color-accent-primary-rgb),0.35)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] theme-heading-font"
          role="status"
        >
          {critiqueToast}
        </div>
      )}
    </div>
  )
}

export default ListaContenido
