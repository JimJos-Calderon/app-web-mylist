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
  const isRetroCartoon = theme === 'retro-cartoon'

  const retroPageButtonBase =
    'relative z-10 m-1 hover:z-20 bg-white text-black border-[3px] border-black shadow-[3px_3px_0px_0px_#000000] rounded-md font-bold hover:-translate-y-[2px] hover:shadow-[5px_5px_0px_0px_#000000] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all'
  const retroPageButtonDisabled = 'relative z-10 m-1 bg-white text-black border-[3px] border-black rounded-md font-bold opacity-50 cursor-not-allowed'
  const retroPageButtonActive =
    'relative z-10 m-1 hover:z-20 bg-black text-white border-[3px] border-black shadow-[3px_3px_0px_0px_#000000] rounded-md font-bold transition-all'

  const itemsToShow = hasPendingSection ? visibleWatchedItems.slice(0, 6) : paginatedWatchedItems

  return (
    <>
      <section className={hasPendingSection ? 'mt-10' : 'mb-8'}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--color-text-muted)]">
              Historial
            </p>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Ya vistos</h3>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-muted)]">
            <span>{visibleWatchedItems.length} vistos</span>
            {!hasPendingSection && totalPages > 1 && (
              <span className="rounded-full border border-[rgba(var(--color-accent-primary-rgb),0.2)] bg-[var(--color-bg-elevated)] px-3 py-1">
                Página {currentPage} de {totalPages}
              </span>
            )}
          </div>
        </div>

        {visibleWatchedItems.length === 0 ? (
          <div className="rounded-2xl border border-[rgba(var(--color-accent-primary-rgb),0.2)] bg-[var(--color-bg-elevated)] p-6 text-center">
            <h4 className="mb-2 text-base font-semibold text-[var(--color-text-primary)]">No hay vistos visibles</h4>
            <p className="text-sm text-[var(--color-text-muted)]">
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
          <p className="mt-3 text-sm text-[var(--color-text-muted)]">
            Mostrando 6 de {visibleWatchedItems.length} vistos.
          </p>
        )}
      </section>

      {!hasPendingSection && visibleWatchedItems.length > 0 && totalPages > 1 && (
        <>
          <div className="mt-8 py-2 overflow-visible flex items-center justify-center gap-1 md:mt-10 md:gap-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`flex flex-shrink-0 items-center border px-3 py-2 font-mono text-xs font-bold uppercase tracking-widest transition-all md:px-4 md:py-2 md:text-sm ${
              isRetroCartoon
                ? currentPage === 1
                  ? retroPageButtonDisabled
                  : retroPageButtonBase
                : currentPage === 1
                  ? 'cursor-not-allowed border-[rgba(var(--color-accent-primary-rgb),0.2)] bg-[rgba(0,0,0,0.5)] text-[var(--color-text-muted)] opacity-50'
                  : 'border-[rgba(var(--color-accent-primary-rgb),0.5)] bg-[rgba(0,0,0,0.5)] text-accent-primary hover:border-accent-primary hover:bg-[rgba(var(--color-accent-primary-rgb),0.1)] hover:shadow-[0_0_15px_rgba(var(--color-accent-primary-rgb),0.3)]'
            }`}
            style={{
              clipPath:
                isRetroCartoon ? 'none' : 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
            }}
          >
            <span className="hidden sm:inline">[ {previousLabel} ]</span>
            <span className="sm:hidden">{'<'}</span>
          </button>

          <div className="scrollbar-none flex max-w-[60vw] gap-1 overflow-x-auto overflow-y-visible md:max-w-none md:gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              const showPageMobile = page === currentPage || page === 1 || page === totalPages
              const showPageDesktop =
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              const showPage = isMobile ? showPageMobile : showPageDesktop

              if (!showPage) {
                if (!isMobile && (page === currentPage - 2 || page === currentPage + 2)) {
                  return (
                    <span
                      key={page}
                      className="px-1 py-2 font-mono text-xs text-[var(--color-text-muted)] opacity-50 md:px-2 md:text-sm"
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
                  className={`flex min-w-[36px] flex-shrink-0 items-center justify-center border px-3 py-2 font-mono text-xs font-bold uppercase transition-all md:min-w-[40px] md:px-4 md:py-2 md:text-sm ${
                    isRetroCartoon
                      ? currentPage === page
                        ? retroPageButtonActive
                        : retroPageButtonBase
                      : currentPage === page
                        ? 'border-accent-primary bg-[rgba(var(--color-accent-primary-rgb),0.15)] text-accent-primary shadow-[0_0_15px_rgba(var(--color-accent-primary-rgb),0.3)]'
                        : 'border-[rgba(var(--color-accent-primary-rgb),0.3)] bg-[rgba(0,0,0,0.5)] text-[var(--color-text-muted)] hover:border-[rgba(var(--color-accent-primary-rgb),0.8)] hover:bg-[rgba(var(--color-accent-primary-rgb),0.1)] hover:text-accent-primary'
                  }`}
                  style={{
                    clipPath:
                      isRetroCartoon ? 'none' : 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
                  }}
                >
                  {page}
                </button>
              )
            })}
          </div>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`flex flex-shrink-0 items-center border px-3 py-2 font-mono text-xs font-bold uppercase tracking-widest transition-all md:px-4 md:py-2 md:text-sm ${
              isRetroCartoon
                ? currentPage === totalPages
                  ? retroPageButtonDisabled
                  : retroPageButtonBase
                : currentPage === totalPages
                  ? 'cursor-not-allowed border-[rgba(var(--color-accent-primary-rgb),0.2)] bg-[rgba(0,0,0,0.5)] text-[var(--color-text-muted)] opacity-50'
                  : 'border-[rgba(var(--color-accent-primary-rgb),0.5)] bg-[rgba(0,0,0,0.5)] text-accent-primary hover:border-accent-primary hover:bg-[rgba(var(--color-accent-primary-rgb),0.1)] hover:shadow-[0_0_15px_rgba(var(--color-accent-primary-rgb),0.3)]'
            }`}
            style={{
              clipPath:
                isRetroCartoon ? 'none' : 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
            }}
          >
            <span className="hidden sm:inline">[ {nextLabel} ]</span>
            <span className="sm:hidden">{'>'}</span>
          </button>
        </div>

        <div className="mt-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] md:text-xs md:tracking-widest">
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
