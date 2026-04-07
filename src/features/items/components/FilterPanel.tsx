import React from 'react'
import { useTranslation } from 'react-i18next'
import { SORT_OPTIONS, FilterState, TechLabel } from '@/features/shared'

interface FilterPanelProps {
  filters: any
  onFilterChange: (key: keyof FilterState, value: any) => void
  onReset: () => void
  sortOptions: readonly (typeof SORT_OPTIONS)[number][]
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFilterChange,
  onReset,
  sortOptions,
}) => {
  const { t } = useTranslation()

  const getSortOrderLabel = () => {
    if (filters.sortBy === 'date') {
      return filters.sortOrder === 'desc' ? t('sort_order.most_recent') : t('sort_order.oldest')
    }

    if (filters.sortBy === 'title') {
      return filters.sortOrder === 'desc' ? t('sort_order.title_desc') : t('sort_order.title_asc')
    }

    return filters.sortOrder === 'desc' ? t('sort_order.best_rated') : t('sort_order.worst_rated')
  }

  return (
    <div className="flex flex-col gap-4 md:gap-5">
      <div className="flex items-center justify-between gap-3">
        <TechLabel text="SYS.FILTERS" tone="secondary" blink />
        <button
          onClick={onReset}
          className="hud-filter-reset px-4 py-2 text-xs font-semibold whitespace-nowrap md:px-5 md:text-sm"
        >
          {t('filter.reset')}
        </button>
      </div>

      <div className="flex flex-wrap gap-3 md:gap-4">
        <button
          type="button"
          onClick={() => onFilterChange('showUnwatched', !filters.showUnwatched)}
          className={`hud-filter-switch ${filters.showUnwatched ? 'hud-filter-switch--active-primary' : 'hud-filter-switch--inactive'}`}
          aria-pressed={filters.showUnwatched}
          aria-label={t('filter.pending')}
        >
          <span className={`hud-filter-switch-dot ${filters.showUnwatched ? 'hud-filter-switch-dot--active-primary' : ''}`} />
          <span className="hud-filter-switch-label">{t('filter.pending')}</span>
        </button>

        <button
          type="button"
          onClick={() => onFilterChange('showWatched', !filters.showWatched)}
          className={`hud-filter-switch ${filters.showWatched ? 'hud-filter-switch--active-secondary' : 'hud-filter-switch--inactive'}`}
          aria-pressed={filters.showWatched}
          aria-label={t('filter.watched')}
        >
          <span className={`hud-filter-switch-dot ${filters.showWatched ? 'hud-filter-switch-dot--active-secondary' : ''}`} />
          <span className="hud-filter-switch-label">{t('filter.watched')}</span>
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row md:gap-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            value={filters.sortBy}
            onChange={(e) => onFilterChange('sortBy', e.target.value)}
            aria-label={t('filter.sort_by')}
            className="hud-filter-field hud-filter-select px-3 py-2 text-xs md:px-4 md:text-sm"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() =>
              onFilterChange(
                'sortOrder',
                filters.sortOrder === 'desc' ? 'asc' : 'desc'
              )
            }
            className="hud-filter-order px-3 py-2 text-xs font-semibold whitespace-nowrap md:px-4 md:text-sm"
            aria-label={t('filter.sort_order_toggle')}
          >
            {getSortOrderLabel()}
          </button>
        </div>

        <input
          type="text"
          placeholder={t('filter.search_placeholder')}
          aria-label={t('filter.search_label')}
          value={filters.searchQuery}
          onChange={(e) => onFilterChange('searchQuery', e.target.value)}
          className="hud-filter-field hud-filter-search flex-1 px-3 py-2 text-xs md:px-4 md:text-sm"
        />
      </div>
    </div>
  )
}

export default FilterPanel
