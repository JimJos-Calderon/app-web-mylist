import React from 'react'
import { ItemCard } from '@/features/items'
import { ListItem } from '@/features/shared'

interface WatchedItemsSectionProps {
  visibleWatchedItems: ListItem[]
  currentUserId: string
  onDelete: (itemId: string) => Promise<void>
  onToggleVisto: (itemId: string, currentValue: boolean) => Promise<void>
  onOpenDetails: (item: ListItem) => void
  hasPendingSection: boolean
}

const WatchedItemsSection: React.FC<WatchedItemsSectionProps> = ({
  visibleWatchedItems,
  currentUserId,
  onDelete,
  onToggleVisto,
  onOpenDetails,
  hasPendingSection,
}) => {
  return (
    <section className={hasPendingSection ? 'mt-10' : 'mb-8'}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">
            Historial
          </p>
          <h3 className="text-lg font-semibold text-white">Ya vistos</h3>
        </div>

        <p className="text-xs text-slate-400">{visibleWatchedItems.length} vistos</p>
      </div>

      {visibleWatchedItems.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-6 text-center">
          <h4 className="mb-2 text-base font-semibold text-white">No hay vistos visibles</h4>
          <p className="text-sm text-slate-400">
            Todavía no habéis marcado títulos como vistos o la búsqueda no devuelve resultados.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 opacity-90 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
            {visibleWatchedItems.slice(0, 6).map((item) => (
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

          {visibleWatchedItems.length > 6 && (
            <p className="mt-3 text-sm text-slate-500">
              Mostrando 6 de {visibleWatchedItems.length} vistos.
            </p>
          )}
        </>
      )}
    </section>
  )
}

export default WatchedItemsSection