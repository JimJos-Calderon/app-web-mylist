import React from 'react'
import { useTranslation } from 'react-i18next'
import { StatsWidget } from '@/features/items'
import { ListItem, useTheme } from '@/features/shared'
import { formatRetroHeading } from '@/features/shared/utils/textUtils'
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
  const isTerminal = theme === 'terminal'
  const isCyberpunk = theme === 'cyberpunk'
  const pageLabel = isRetroCartoon
    ? `PAGINA ${currentPage} DE ${totalPages}`
    : t('pagination.page', { current: currentPage, total: totalPages })

  const emptyStateTitle = searchQuery
    ? t('empty_state.no_results_title', 'Sin resultados')
    : t('empty_state.title', 'Lista vacia')

  const emptyStateSubtitle = searchQuery
    ? t('item.search_no_results', { type: tipo, query: searchQuery })
    : tipo === 'pelicula'
      ? t('empty_state.subtitle_movies', 'Añade algo para empezar')
      : t('empty_state.subtitle_series', 'Añade algo para empezar')

  const addActionLabel = t('empty_state.add_action', 'Añadir una opcion ahora')
  const resetActionLabel = t('empty_state.reset_action', 'Limpiar filtros')

  const emptyContainerClass = isRetroCartoon
    ? 'rounded-xl border-[3px] border-black bg-white px-6 py-12 text-center shadow-[6px_6px_0px_0px_#000000]'
    : isTerminal
      ? 'terminal-panel rounded-none px-6 py-16 text-center'
      : isCyberpunk
        ? 'cyberpunk-surface rounded-xl px-6 py-16 text-center'
        : 'rounded-3xl border border-[rgba(var(--color-accent-primary-rgb),0.2)] bg-[var(--color-bg-elevated)] px-6 py-16 text-center'

  const emptyTitleClass = isRetroCartoon
    ? 'mb-2 text-xl font-semibold text-black theme-heading-font'
    : isTerminal
      ? 'mb-2 text-xl font-semibold text-[var(--color-text-primary)] theme-heading-font'
      : isCyberpunk
        ? 'mb-2 text-xl font-semibold text-[var(--color-text-primary)] theme-heading-font cyberpunk-text-glow'
        : 'mb-2 text-xl font-semibold text-[var(--color-text-primary)]'

  const emptySubtitleClass = isRetroCartoon
    ? 'mx-auto max-w-2xl text-sm leading-relaxed text-black/75 theme-heading-font'
    : isTerminal
      ? 'mx-auto max-w-2xl text-sm leading-relaxed text-[var(--color-text-muted)] theme-body-font'
      : isCyberpunk
        ? 'mx-auto max-w-2xl text-sm leading-relaxed text-[var(--color-text-primary)]/85 theme-body-font'
        : 'mx-auto max-w-2xl text-sm leading-relaxed text-[var(--color-text-muted)]'

  const addButtonClass = isRetroCartoon
    ? 'theme-heading-font rounded-xl border-[3px] border-black bg-white px-3 py-2 text-sm font-bold text-black shadow-[4px_4px_0px_0px_#000000] transition hover:-translate-y-[2px]'
    : isTerminal
      ? 'terminal-button theme-heading-font rounded-none px-4 py-2 text-sm'
      : isCyberpunk
        ? 'cyberpunk-button theme-heading-font rounded-xl px-4 py-2 text-sm'
        : 'rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-[var(--color-text-primary)] transition hover:border-cyan-400 hover:bg-cyan-500/20'

  const resetButtonClass = isRetroCartoon
    ? 'theme-heading-font rounded-xl border-[3px] border-black bg-white px-3 py-2 text-sm font-bold text-black shadow-[4px_4px_0px_0px_#000000] transition hover:-translate-y-[2px]'
    : isTerminal
      ? 'terminal-button theme-heading-font rounded-none px-4 py-2 text-sm'
      : isCyberpunk
        ? 'cyberpunk-button cyberpunk-button--ghost theme-heading-font rounded-xl px-4 py-2 text-sm'
        : 'rounded-xl border border-[rgba(var(--color-accent-primary-rgb),0.25)] bg-[var(--color-bg-secondary)] px-4 py-2 text-sm font-semibold text-[var(--color-text-primary)] transition hover:border-[rgba(var(--color-accent-primary-rgb),0.45)]'

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
        <div className={emptyContainerClass}>

          <h3 className={emptyTitleClass}>
            {formatRetroHeading(emptyStateTitle, theme)}
          </h3>

          <p className={emptySubtitleClass}>
            {isRetroCartoon ? formatRetroHeading(emptyStateSubtitle, theme) : emptyStateSubtitle}
          </p>

          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onFocusSearch}
              className={addButtonClass}
            >
              {formatRetroHeading(addActionLabel, theme)}
            </button>

            <button
              type="button"
              onClick={onResetDiscovery}
              className={resetButtonClass}
            >
              {formatRetroHeading(resetActionLabel, theme)}
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
