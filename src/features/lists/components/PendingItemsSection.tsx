import React from 'react'
import { ItemCard } from '@/features/items'
import { ListItem, useTheme } from '@/features/shared'

interface PendingItemsSectionProps {
  searchQuery: string
  visiblePendingItems: ListItem[]
  paginatedPendingItems: ListItem[]
  currentPage: number
  totalPages: number
  isMobile: boolean
  currentUserId: string
  onDelete: (itemId: string) => Promise<void>
  onToggleVisto: (itemId: string, currentValue: boolean) => Promise<void>
  onOpenDetails: (item: ListItem) => void
  onPageChange: (page: number) => void
  previousLabel: string
  nextLabel: string
  pageLabel: string
}

const PendingItemsSection: React.FC<PendingItemsSectionProps> = ({
  searchQuery,
  visiblePendingItems,
  paginatedPendingItems,
  currentPage,
  totalPages,
  isMobile,
  currentUserId,
  onDelete,
  onToggleVisto,
  onOpenDetails,
  onPageChange,
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

  return (
    <>
      <section className="mb-12 mt-10 md:mb-16 md:mt-16">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className={`text-xl font-bold tracking-tight text-[var(--color-text-primary)] md:text-2xl ${isRetroCartoon ? 'theme-heading-font uppercase' : ''}`}>
              {searchQuery ? 'Pendientes filtrados' : 'Para decidir hoy'}
            </h2>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-[var(--color-text-muted)]">
            <span className={`rounded-full border border-cyan-500/20 bg-[rgba(var(--color-accent-primary-rgb),0.08)] px-3 py-1 ${isRetroCartoon ? 'theme-heading-font' : ''}`}>
              {visiblePendingItems.length} pendientes visibles
            </span>
            {totalPages > 1 && (
              <span className={`rounded-full border border-[rgba(var(--color-accent-primary-rgb),0.2)] bg-[var(--color-bg-elevated)] px-3 py-1 ${isRetroCartoon ? 'theme-heading-font' : ''}`}>
                PAGINA {currentPage} DE {totalPages}
              </span>
            )}
          </div>
        </div>

        {visiblePendingItems.length === 0 ? (
          <div className="rounded-2xl border border-[rgba(var(--color-accent-primary-rgb),0.2)] bg-[var(--color-bg-elevated)] p-6 text-center">
            <h4 className="mb-2 text-base font-semibold text-[var(--color-text-primary)]">No hay pendientes visibles</h4>
            <p className="text-sm text-[var(--color-text-muted)]">
              Todo está marcado como visto o la búsqueda no devuelve pendientes.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
            {paginatedPendingItems.map((item) => (
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
      </section>

      {visiblePendingItems.length > 0 && totalPages > 1 && (
        <>
          <div className="mt-8 py-2 overflow-visible flex items-center justify-center gap-1 md:mt-10 md:gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`flex flex-shrink-0 items-center border px-3 py-2 text-xs font-bold uppercase tracking-widest transition-all md:px-4 md:py-2 md:text-sm ${isRetroCartoon ? 'theme-heading-font' : 'font-mono'} ${
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
                        className={`px-1 py-2 text-xs text-[var(--color-text-muted)] opacity-50 md:px-2 md:text-sm ${isRetroCartoon ? 'theme-heading-font' : 'font-mono'}`}
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
                    className={`flex min-w-[36px] flex-shrink-0 items-center justify-center border px-3 py-2 text-xs font-bold uppercase transition-all md:min-w-[40px] md:px-4 md:py-2 md:text-sm ${isRetroCartoon ? 'theme-heading-font' : 'font-mono'} ${
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
              className={`flex flex-shrink-0 items-center border px-3 py-2 text-xs font-bold uppercase tracking-widest transition-all md:px-4 md:py-2 md:text-sm ${isRetroCartoon ? 'theme-heading-font' : 'font-mono'} ${
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
            <p className={`text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] md:text-xs md:tracking-widest ${isRetroCartoon ? 'theme-heading-font' : ''}`}>
              <span className="hidden sm:inline">{pageLabel} • </span>
              {visiblePendingItems.length} por decidir
            </p>
          </div>
        </>
      )}
    </>
  )
}

export default PendingItemsSection
