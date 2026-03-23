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
    <section className="mb-8">
      <div className="flex justify-end gap-6 px-2">
        {showSecondaryControls && (
          <button
            type="button"
            onClick={onResetFilters}
            className="text-sm font-medium text-slate-500 transition hover:text-slate-300"
          >
            Quitar filtros
          </button>
        )}
        <button
          type="button"
          onClick={onToggleSecondaryControls}
          className="text-sm font-medium text-slate-500 transition hover:text-slate-300"
        >
          {showSecondaryControls ? 'Ocultar filtros' : 'Filtros'}
        </button>
      </div>

      {showSecondaryControls && (
        <div className="mt-4 rounded-2xl border border-slate-800/50 bg-slate-950/30 p-4">
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