import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FilterState, useTheme } from '@/features/shared'
import { formatRetroHeading } from '@/features/shared/utils/textUtils'
import { FilterPanel } from '@/features/items'

interface ListFiltersSectionProps {
  filters: FilterState
  showSecondaryControls: boolean
  onToggleSecondaryControls: () => void
  onResetFilters: () => void
  onFilterChange: (filterKey: keyof FilterState, value: FilterState[keyof FilterState]) => void
  tagOptions?: string[]
}

const ListFiltersSection: React.FC<ListFiltersSectionProps> = ({
  filters,
  showSecondaryControls,
  onToggleSecondaryControls,
  onResetFilters,
  onFilterChange,
  tagOptions = [],
}) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const retroText = (value: string) => formatRetroHeading(value, theme)

  const sortOptions = useMemo(
    () =>
      [
        { value: 'date' as const, label: retroText(t('filter.sort_date')) },
        { value: 'title' as const, label: retroText(t('filter.sort_title')) },
        { value: 'rating' as const, label: retroText(t('filter.sort_rating')) },
        { value: 'manual' as const, label: retroText(t('filter.sort_manual')) },
      ],
    [retroText, t],
  )

  return (
    <section className="list-filters-section mb-8">
      <div
        className={`list-filters-shell ${showSecondaryControls ? 'list-filters-shell--open' : ''}`}
      >
        <div className="list-filters-toolbar flex justify-end gap-6">
          {showSecondaryControls && (
            <button type="button" onClick={onResetFilters} className="ui-action-link">
              {retroText('Quitar filtros')}
            </button>
          )}
          <button type="button" onClick={onToggleSecondaryControls} className="ui-action-link">
            {showSecondaryControls ? retroText('Ocultar filtros') : retroText('Filtros')}
          </button>
        </div>

        {showSecondaryControls && (
          <div className="list-filters-panel">
            <FilterPanel
              filters={filters}
              onFilterChange={onFilterChange}
              onReset={onResetFilters}
              sortOptions={sortOptions}
              tagOptions={tagOptions}
            />
          </div>
        )}
      </div>
    </section>
  )
}

export default ListFiltersSection
