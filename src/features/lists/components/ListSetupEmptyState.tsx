import React from 'react'
import { List } from '@/features/shared'
import ListSelector from './ListSelector'

interface ListSetupEmptyStateProps {
  lists: List[]
  loadingLists?: boolean
  setCurrentList?: (list: List) => void
  onListChange: (list: List) => void
  onCreateList: () => void
  createListLabel: string
}

const ListSetupEmptyState: React.FC<ListSetupEmptyStateProps> = ({
  lists,
  loadingLists,
  setCurrentList,
  onListChange,
  onCreateList,
  createListLabel,
}) => {
  return (
    <section className="mb-8 rounded-2xl border border-[rgba(var(--color-accent-primary-rgb),0.2)] bg-[var(--color-bg-elevated)] p-6 md:p-8">
      <div className="mx-auto max-w-3xl">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--color-text-muted)]">
          Primer paso
        </p>
        <h3 className="mb-2 text-xl font-semibold text-[var(--color-text-primary)]">Elige una lista para empezar</h3>
        <p className="mb-6 max-w-2xl text-sm text-[var(--color-text-muted)]">
          Necesitas una lista activa para añadir títulos, decidir qué ver y seguir el progreso.
        </p>

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="w-full md:max-w-sm">
            {lists.length > 0 && setCurrentList ? (
              <ListSelector
                lists={lists}
                currentList={undefined}
                onChange={onListChange}
                loading={loadingLists}
                label="Elegir lista"
              />
            ) : (
              <div className="rounded-2xl border border-[rgba(var(--color-accent-primary-rgb),0.2)] bg-[var(--color-bg-secondary)] px-4 py-3 text-sm text-[var(--color-text-muted)]">
                {loadingLists ? 'Cargando listas...' : 'Todavía no tienes listas disponibles.'}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onCreateList}
            className="flex items-center justify-center gap-2 border border-[rgba(var(--color-accent-primary-rgb),0.5)] bg-[rgba(var(--color-accent-primary-rgb),0.1)] px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-[#0ff] transition-all hover:border-[#0ff] hover:bg-[rgba(var(--color-accent-primary-rgb),0.2)] hover:shadow-[0_0_15px_rgba(var(--color-accent-primary-rgb),0.4)]"
            style={{
              clipPath:
                'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
            }}
          >
            <span className="opacity-70">+</span> [ {createListLabel} ]
          </button>
        </div>
      </div>
    </section>
  )
}

export default ListSetupEmptyState
