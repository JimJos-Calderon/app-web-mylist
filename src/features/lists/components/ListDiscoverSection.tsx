import React from 'react'
import { useTranslation } from 'react-i18next'
import { StatsWidget } from '@/features/items'
import { ListItem, useTheme } from '@/features/shared'
import PendingItemsSection from './PendingItemsSection'
import WatchedItemsSection from './WatchedItemsSection'

interface ListDiscoverSectionProps {
  tipo: 'pelicula' | 'serie'
  loading: boolean
  items: ListItem[]
  searchQuery: string
  totalVisibleItems: number
  currentUserId: string
  currentPage: number
  totalPages: number
  isMobile: boolean
  visiblePendingItems: ListItem[]
  paginatedPendingItems: ListItem[]
  visibleWatchedItems: ListItem[]
  paginatedWatchedItems: ListItem[]
  showPendingSection: boolean
  showWatchedSection: boolean
  onFocusSearch: () => void
  onResetDiscovery: () => void
  onDelete: (itemId: string) => Promise<void>
  onToggleVisto: (itemId: string, currentValue: boolean) => Promise<void>
  onOpenDetails: (item: ListItem) => void
  onPageChange: (page: number) => void
}

const ListDiscoverSection: React.FC<ListDiscoverSectionProps> = ({
  tipo,
  loading,
  items,
  searchQuery,
  totalVisibleItems,
  currentUserId,
  currentPage,
  totalPages,
  isMobile,
  visiblePendingItems,
  paginatedPendingItems,
  visibleWatchedItems,
  paginatedWatchedItems,
  showPendingSection,
  showWatchedSection,
  onFocusSearch,
  onResetDiscovery,
  onDelete,
  onToggleVisto,
  onOpenDetails,
  onPageChange,
}) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const isRetroCartoon = theme === 'retro-cartoon'
  const pageLabel = isRetroCartoon
    ? `PAGINA ${currentPage} DE ${totalPages}`
    : t('pagination.page', { current: currentPage, total: totalPages })

  return (
    <section id="discover-section">
      {loading && (
        <div className="py-12 text-center">
          <div className="inline-flex flex-col items-center gap-4">
            <div className="relative inline-flex items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-2 border-[rgba(var(--color-accent-primary-rgb),0.2)] border-t-accent-primary border-r-[var(--color-accent-secondary)]" />
              <div className="absolute inset-0 animate-[spin_3s_linear_infinite_reverse] rounded-full border-2 border-[rgba(var(--color-accent-secondary-rgb),0.1)] border-b-[var(--color-accent-secondary)]" />
            </div>
            <p className="animate-pulse font-mono text-xs font-bold uppercase tracking-[0.2em] text-accent-primary">
              SYS.{t('loading.items')}...
            </p>
          </div>
        </div>
      )}

      {!loading && totalVisibleItems === 0 && (
        <div className="rounded-3xl border border-[rgba(var(--color-accent-primary-rgb),0.2)] bg-[var(--color-bg-elevated)] px-6 py-16 text-center">

          <h3 className="mb-2 text-xl font-semibold text-[var(--color-text-primary)]">
            {searchQuery
              ? 'No hay resultados para decidir'
              : tipo === 'pelicula'
                ? 'Tu lista de películas está vacía'
                : 'Tu lista de series está vacía'}
          </h3>

          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-[var(--color-text-muted)]">
            {searchQuery
              ? t('item.search_no_results', { type: tipo, query: searchQuery })
              : tipo === 'pelicula'
                ? 'Añade la primera película para empezar a decidir juntos desde pendientes.'
                : 'Añade la primera serie para empezar a decidir juntos desde pendientes.'}
          </p>

          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onFocusSearch}
              className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:border-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-200"
            >
              Añadir una opción ahora
            </button>

            <button
              type="button"
              onClick={onResetDiscovery}
              className="rounded-xl border border-[rgba(var(--color-accent-primary-rgb),0.25)] bg-[var(--color-bg-secondary)] px-4 py-2 text-sm font-semibold text-[var(--color-text-primary)] transition hover:border-[rgba(var(--color-accent-primary-rgb),0.45)] hover:text-[var(--color-text-primary)]"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      )}

      {!loading && totalVisibleItems > 0 && (
        <>
          {showPendingSection && (
            <PendingItemsSection
              searchQuery={searchQuery}
              visiblePendingItems={visiblePendingItems}
              paginatedPendingItems={paginatedPendingItems}
              currentPage={currentPage}
              totalPages={totalPages}
              isMobile={isMobile}
              currentUserId={currentUserId}
              onDelete={onDelete}
              onToggleVisto={onToggleVisto}
              onOpenDetails={onOpenDetails}
              onPageChange={onPageChange}
              previousLabel={t('pagination.previous')}
              nextLabel={t('pagination.next')}
              pageLabel={pageLabel}
            />
          )}

          {showWatchedSection && (
            <WatchedItemsSection
              visibleWatchedItems={visibleWatchedItems}
              paginatedWatchedItems={paginatedWatchedItems}
              currentPage={currentPage}
              totalPages={totalPages}
              isMobile={isMobile}
              currentUserId={currentUserId}
              onDelete={onDelete}
              onToggleVisto={onToggleVisto}
              onOpenDetails={onOpenDetails}
              onPageChange={onPageChange}
              hasPendingSection={showPendingSection}
              previousLabel={t('pagination.previous')}
              nextLabel={t('pagination.next')}
              pageLabel={pageLabel}
            />
          )}
        </>
      )}

      {!loading && items.length > 0 && (
        <div className="mt-10 md:mt-12">
          <StatsWidget items={items} userOwnerId={currentUserId} size="large" />
        </div>
      )}
    </section>
  )
}

export default ListDiscoverSection
