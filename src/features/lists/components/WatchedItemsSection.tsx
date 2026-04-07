import React from 'react'
import { ItemCard } from '@/features/items'
import { ListItem, useTheme } from '@/features/shared'

interface WatchedItemsSectionProps {
  visibleWatchedItems: ListItem[]
  paginatedWatchedItems: ListItem[]
  currentPage: number
  totalPages: number
  isMobile: boolean
  currentUserId: string
  onDelete: (itemId: string) => Promise<void>
  onToggleVisto: (itemId: string, currentValue: boolean) => Promise<void>
  onOpenDetails: (item: ListItem) => void
  onPageChange: (page: number) => void
  hasPendingSection: boolean
  previousLabel: string
  nextLabel: string
  pageLabel: string
}

const WatchedItemsSection: React.FC<WatchedItemsSectionProps> = ({
  visibleWatchedItems,
  paginatedWatchedItems,
  currentPage,
  totalPages,
  isMobile,
  currentUserId,
  onDelete,
  onToggleVisto,
  onOpenDetails,
  onPageChange,
  hasPendingSection,
  previousLabel,
  nextLabel,
  pageLabel,
}) => {
  const { theme } = useTheme()
  const isTerminal = theme === 'terminal'
  const isCyberpunk = theme === 'cyberpunk'
  const plainPaginationLabels = theme === 'retro-cartoon'

  const itemsToShow = hasPendingSection ? visibleWatchedItems.slice(0, 6) : paginatedWatchedItems

  return (
    <>
      <section className={hasPendingSection ? 'mt-10' : 'mb-8'}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--color-text-muted)]">
              Historial
            </p>
            <h3 className="list-section-heading text-lg font-semibold text-[var(--color-text-primary)]">Ya vistos</h3>
            {isCyberpunk && <div className="cyberpunk-separator mt-3" />}
          </div>

          <div className="flex flex-wrap items-center gap-[var(--ui-list-meta-gap)] text-[var(--color-text-muted)]">
            <span
              className={
                isTerminal ? 'theme-heading-font text-[var(--color-accent-primary)]' : 'list-meta-tag-a'
              }
            >
              {visibleWatchedItems.length} vistos
            </span>
            {!hasPendingSection && totalPages > 1 && (
              <span
                className={
                  isTerminal ? 'terminal-panel theme-heading-font rounded-none px-3 py-1' : 'list-meta-tag-b'
                }
              >
                PAGINA {currentPage} DE {totalPages}
              </span>
            )}
          </div>
        </div>

        {visibleWatchedItems.length === 0 ? (
          <div
            className={
              isTerminal ? 'terminal-panel rounded-none p-6 text-center' : 'rounded-2xl border border-[rgba(var(--color-accent-primary-rgb),0.2)] bg-[var(--color-bg-elevated)] p-6 text-center'
            }
          >
            <h4 className={`mb-2 text-base font-semibold text-[var(--color-text-primary)] ${isTerminal ? 'theme-heading-font uppercase' : ''}`}>
              No hay vistos visibles
            </h4>
            <p className={`text-sm text-[var(--color-text-muted)] ${isTerminal ? 'theme-body-font' : ''}`}>
              Todavía no habéis marcado títulos como vistos o la búsqueda no devuelve resultados.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 opacity-90 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
            {itemsToShow.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                isOwn={item.user_id === currentUserId}
                onDelete={onDelete}
                onToggleVisto={onToggleVisto}
                onOpenDetails={onOpenDetails}
              />
            ))}
          </div>
        )}

        {hasPendingSection && visibleWatchedItems.length > 6 && (
          <p className={`mt-3 text-sm text-[var(--color-text-muted)] ${isTerminal ? 'theme-heading-font' : ''}`}>
            Mostrando 6 de {visibleWatchedItems.length} vistos.
          </p>
        )}
      </section>

      {!hasPendingSection && visibleWatchedItems.length > 0 && totalPages > 1 && (
        <>
          <div className="mt-8 flex items-center justify-center gap-1 overflow-visible py-2 md:mt-10 md:gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={
                isTerminal
                  ? `theme-heading-font rounded-none md:px-4 md:py-2 md:text-sm ${currentPage === 1 ? 'terminal-button opacity-50' : 'terminal-button'}`
                  : `list-pagination-btn font-mono md:px-4 md:py-2 md:text-sm`
              }
            >
              <span className="hidden sm:inline">
                {plainPaginationLabels ? previousLabel : `[ ${previousLabel} ]`}
              </span>
              <span className="sm:hidden">{'<'}</span>
            </button>

            <div className="scrollbar-none flex max-w-[60vw] gap-1 overflow-x-auto overflow-y-visible md:max-w-none md:gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                const showPageMobile = page === currentPage || page === 1 || page === totalPages
                const showPageDesktop =
                  page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)
                const showPage = isMobile ? showPageMobile : showPageDesktop

                if (!showPage) {
                  if (!isMobile && (page === currentPage - 2 || page === currentPage + 2)) {
                    return (
                      <span
                        key={page}
                        className="list-pagination-ellipsis px-1 py-2 text-xs text-[var(--color-text-muted)] opacity-50 md:px-2 md:text-sm font-mono"
                      >
                        ...
                      </span>
                    )
                  }
                  return null
                }

                return (
                  <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={
                      isTerminal
                        ? `theme-heading-font rounded-none md:min-w-[40px] md:px-4 md:py-2 md:text-sm ${
                            currentPage === page
                              ? 'terminal-button bg-[var(--color-accent-primary)] text-[var(--color-bg-base)]'
                              : 'terminal-button opacity-80'
                          }`
                        : `list-pagination-page font-mono md:min-w-[40px] md:px-4 md:py-2 md:text-sm ${
                            currentPage === page ? 'list-pagination-page--active' : 'list-pagination-page--idle'
                          }`
                    }
                  >
                    {page}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={
                isTerminal
                  ? `theme-heading-font rounded-none md:px-4 md:py-2 md:text-sm ${
                      currentPage === totalPages ? 'terminal-button opacity-50' : 'terminal-button'
                    }`
                  : `list-pagination-btn font-mono md:px-4 md:py-2 md:text-sm`
              }
            >
              <span className="hidden sm:inline">{plainPaginationLabels ? nextLabel : `[ ${nextLabel} ]`}</span>
              <span className="sm:hidden">{'>'}</span>
            </button>
          </div>

          <div className="mt-3 text-center">
            <p className="list-pagination-footer text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] md:text-xs md:tracking-widest">
              <span className="hidden sm:inline">{pageLabel} • </span>
              {visibleWatchedItems.length} vistos
            </p>
          </div>
        </>
      )}
    </>
  )
}

export default WatchedItemsSection
