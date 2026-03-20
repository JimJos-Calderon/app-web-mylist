import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth'
import { useFilters, useItems } from '@/features/items'
import { FilterState, List, ErrorAlert } from '@/features/shared'
import { CreateListDialog, InviteDialog } from './ListDialogs'
import ListActiveHeader from './ListActiveHeader'
import ListSetupEmptyState from './ListSetupEmptyState'
import ListSearchSection from './ListSearchSection'
import ListFiltersSection from './ListFiltersSection'
import ListDiscoverSection from './ListDiscoverSection'
import ItemDetailsModal from './ItemDetailsModal'
import { useListSearchFlow } from '../hooks/useListSearchFlow'
import { useListItemDetails } from '../hooks/useListItemDetails'

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

const ITEMS_PER_PAGE = 9

const ListaContenido: React.FC<ListaContenidoProps> = ({
  tipo,
  icono,
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

  const searchSectionRef = useRef<HTMLDivElement>(null)
  const discoverSectionRef = useRef<HTMLDivElement>(null)

  const { items, loading, error: itemsError, addItem, deleteItem, toggleVisto } = useItems(
    tipo,
    user?.id || '',
    listId
  )

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

  useEffect(() => {
    setCurrentPage(1)
  }, [
    filters.searchQuery,
    filters.showWatched,
    filters.showUnwatched,
    filters.sortBy,
    filters.sortOrder,
  ])

  const searchedAndSortedItems = useMemo(() => {
    return items
      .filter((item) => {
        if (!filters.searchQuery) return true
        return item.titulo.toLowerCase().includes(filters.searchQuery.toLowerCase())
      })
      .sort((a, b) => {
        let compareResult = 0

        switch (filters.sortBy) {
          case 'title':
            compareResult = a.titulo.localeCompare(b.titulo)
            break
          case 'rating':
            compareResult = (a.rating || 0) - (b.rating || 0)
            break
          case 'date':
          default:
            compareResult = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            break
        }

        return filters.sortOrder === 'desc' ? -compareResult : compareResult
      })
  }, [filters.searchQuery, filters.sortBy, filters.sortOrder, items])

  const pendingItems = useMemo(
    () => searchedAndSortedItems.filter((item) => !item.visto),
    [searchedAndSortedItems]
  )
  const watchedItems = useMemo(
    () => searchedAndSortedItems.filter((item) => item.visto),
    [searchedAndSortedItems]
  )
  const visiblePendingItems = filters.showUnwatched ? pendingItems : []
  const visibleWatchedItems = filters.showWatched ? watchedItems : []
  const totalVisibleItems = visiblePendingItems.length + visibleWatchedItems.length
  const totalPages = Math.max(1, Math.ceil(visiblePendingItems.length / ITEMS_PER_PAGE))
  const paginatedPendingItems = useMemo(
    () =>
      visiblePendingItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
    [currentPage, visiblePendingItems]
  )

  const searchFlow = useListSearchFlow({
    tipo,
    listId,
    user: user || { id: '', email: '' },
    onAddItem: addItem,
    onFocusDecisionBlock: focusDecisionBlock,
  })

  const itemDetails = useListItemDetails({
    currentUserId: user?.id || '',
    onToggleVisto: toggleVisto,
    onDeleteItem: deleteItem,
    getDeleteConfirmationMessage: (item) => t('modal.delete_title', { title: item.titulo }),
  })

  if (!user) return null

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-black font-sans">
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

      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-purple-900/10 to-black" />
        <div
          className="absolute bottom-0 left-0 right-0 h-[40%] opacity-10"
          style={{
            backgroundImage:
              'linear-gradient(to right, #ff00ff 1px, transparent 1px), linear-gradient(to bottom, #ff00ff 1px, transparent 1px)',
            backgroundSize: '50px 50px',
            transform: 'perspective(500px) rotateX(60deg)',
            transformOrigin: 'bottom center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-8 md:px-6 md:py-12">
        <header className="mb-6 space-y-2 md:mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-400/80">
            {tipo === 'pelicula' ? 'Películas' : 'Series'}
          </p>

          <div className="flex items-center gap-3">
            <span className="text-3xl md:text-4xl">{icono}</span>
            <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
              {tipo === 'pelicula' ? 'Decidir qué ver' : 'Decidir qué seguir'}
            </h1>
          </div>

          <p className="max-w-2xl text-sm text-slate-400">
            Menos opciones secundarias, más foco en añadir y decidir desde pendientes.
          </p>
        </header>

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
                onFocusDecisionBlock={focusDecisionBlock}
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
    </div>
  )
}

export default ListaContenido