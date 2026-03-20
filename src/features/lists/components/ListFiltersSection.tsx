import React from 'react'
import { FilterState, SORT_OPTIONS } from '@/features/shared'
import { FilterPanel } from '@/features/items'

interface ListFiltersSectionProps {
  filters: FilterState
  showSecondaryControls: boolean
  onToggleSecondaryControls: () => void
  onResetFilters: () => void
  onFilterChange: (filterKey: keyof FilterState, value: any) => void
}

const ListFiltersSection: React.FC<ListFiltersSectionProps> = ({
  filters,
  showSecondaryControls,
  onToggleSecondaryControls,
  onResetFilters,
  onFilterChange,
}) => {
  return (
    <section className="mb-6 rounded-2xl border border-slate-800/80 bg-slate-950/35 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
            Controles secundarios
          </p>
          <h3 className="text-base font-semibold text-white">Filtros</h3>
          <p className="mt-1 text-sm text-slate-400">
            Úsalos sólo cuando ayuden a decidir mejor, no como paso principal.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onToggleSecondaryControls}
            className="rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
          >
            {showSecondaryControls ? 'Ocultar filtros' : 'Mostrar filtros'}
          </button>

          <button
            type="button"
            onClick={onResetFilters}
            className="rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
          >
            Quitar filtros
          </button>
        </div>
      </div>

      {showSecondaryControls && (
        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
          <FilterPanel
            filters={filters}
            onFilterChange={onFilterChange}
            onReset={onResetFilters}
            sortOptions={SORT_OPTIONS}
          />
        </div>
      )}
    </section>
  )
}

export default ListFiltersSection