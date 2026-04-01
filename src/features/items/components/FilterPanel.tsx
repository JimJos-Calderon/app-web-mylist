import React from 'react'
import { useTranslation } from 'react-i18next'
import { HudContainer, SORT_OPTIONS, FilterState, TechLabel, useTheme } from '@/features/shared'

interface FilterPanelProps {
  filters: any
  onFilterChange: (key: keyof FilterState, value: any) => void
  onReset: () => void
  sortOptions: readonly typeof SORT_OPTIONS[number][]
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFilterChange,
  onReset,
  sortOptions,
}) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const isRetroCartoon = theme === 'retro-cartoon'

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
    <HudContainer className="mb-6 md:mb-8 hud-filter-panel" contentClassName="p-4 md:p-5">
      <div className="flex flex-col gap-4 md:gap-5">
        <div className="flex items-center justify-between gap-3">
          <TechLabel text="SYS.FILTERS" tone="secondary" blink />
          <button
            onClick={onReset}
            className={`px-4 md:px-5 py-2 hud-filter-reset text-xs md:text-sm font-semibold whitespace-nowrap ${isRetroCartoon ? 'theme-heading-font uppercase' : ''}`}
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
            <span className={`hud-filter-switch-label ${isRetroCartoon ? 'theme-heading-font' : ''}`}>{t('filter.pending')}</span>
          </button>

          <button
            type="button"
            onClick={() => onFilterChange('showWatched', !filters.showWatched)}
            className={`hud-filter-switch ${filters.showWatched ? 'hud-filter-switch--active-secondary' : 'hud-filter-switch--inactive'}`}
            aria-pressed={filters.showWatched}
            aria-label={t('filter.watched')}
          >
            <span className={`hud-filter-switch-dot ${filters.showWatched ? 'hud-filter-switch-dot--active-secondary' : ''}`} />
            <span className={`hud-filter-switch-label ${isRetroCartoon ? 'theme-heading-font' : ''}`}>{t('filter.watched')}</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={filters.sortBy}
              onChange={(e) => onFilterChange('sortBy', e.target.value)}
              aria-label={t('filter.sort_by')}
              className={`hud-filter-field hud-filter-select px-3 md:px-4 py-2 text-xs md:text-sm ${isRetroCartoon ? 'theme-heading-font uppercase' : ''}`}
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
              className={`px-3 md:px-4 py-2 hud-filter-order text-xs md:text-sm font-semibold whitespace-nowrap ${isRetroCartoon ? 'theme-heading-font uppercase' : ''}`}
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
            className={`flex-1 hud-filter-field hud-filter-search px-3 md:px-4 py-2 text-xs md:text-sm ${isRetroCartoon ? 'theme-heading-font' : ''}`}
          />
        </div>
      </div>
    </HudContainer>
  )
}

export default FilterPanel
