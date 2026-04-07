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
    <section className="list-filters-section mb-8">
      <div
        className={`list-filters-shell ${showSecondaryControls ? 'list-filters-shell--open' : ''}`}
      >
        <div className="list-filters-toolbar flex justify-end gap-6">
          {showSecondaryControls && (
            <button type="button" onClick={onResetFilters} className="ui-action-link">
              Quitar filtros
            </button>
          )}
          <button type="button" onClick={onToggleSecondaryControls} className="ui-action-link">
            {showSecondaryControls ? 'Ocultar filtros' : 'Filtros'}
          </button>
        </div>

        {showSecondaryControls && (
          <div className="list-filters-panel">
            <FilterPanel
              filters={filters}
              onFilterChange={onFilterChange}
              onReset={onResetFilters}
              sortOptions={SORT_OPTIONS}
            />
          </div>
        )}
      </div>
    </section>
  )
}

export default ListFiltersSection
