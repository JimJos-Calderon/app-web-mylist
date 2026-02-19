import React from 'react'
import { SORT_OPTIONS } from '@constants/index'

interface FilterPanelProps {
  filters: any
  onFilterChange: (key: string, value: any) => void
  onReset: () => void
  sortOptions: readonly typeof SORT_OPTIONS[number][]
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFilterChange,
  onReset,
  sortOptions,
}) => {
  const getSortOrderLabel = () => {
    if (filters.sortBy === 'date') {
      return filters.sortOrder === 'desc' ? 'Mas recientes' : 'Mas antiguas'
    }

    if (filters.sortBy === 'title') {
      return filters.sortOrder === 'desc' ? 'Titulo Z-A' : 'Titulo A-Z'
    }

    return filters.sortOrder === 'desc' ? 'Mejor calificadas' : 'Peor calificadas'
  }

  return (
    <div className="mb-6 md:mb-8 bg-gradient-to-r from-slate-900/30 to-slate-800/30 border border-slate-700/30 rounded-xl p-4 md:p-6 backdrop-blur-sm">
      <div className="flex flex-col gap-4 md:gap-6">
        {/* Toggle switches */}
        <div className="flex gap-4 md:gap-6">
          <label className="flex items-center gap-2 md:gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.showUnwatched}
              onChange={(e) => onFilterChange('showUnwatched', e.target.checked)}
              className="w-4 h-4 md:w-5 md:h-5 rounded border-2 border-cyan-500 accent-cyan-400"
            />
            <span className="text-xs md:text-sm font-semibold text-slate-300">Pendientes</span>
          </label>

          <label className="flex items-center gap-2 md:gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.showWatched}
              onChange={(e) => onFilterChange('showWatched', e.target.checked)}
              className="w-4 h-4 md:w-5 md:h-5 rounded border-2 border-cyan-500 accent-cyan-400"
            />
            <span className="text-xs md:text-sm font-semibold text-slate-300">Vistas</span>
          </label>
        </div>

        {/* Second row: Sort and Search */}
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
          {/* Sort dropdown */}
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={filters.sortBy}
              onChange={(e) => onFilterChange('sortBy', e.target.value)}
              className="bg-slate-800 border border-slate-600 text-white px-3 md:px-4 py-2 rounded-lg outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all text-xs md:text-sm"
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
              className="px-3 md:px-4 py-2 bg-slate-700/60 hover:bg-slate-600/60 text-slate-200 rounded-lg transition-all text-xs md:text-sm font-semibold whitespace-nowrap"
              aria-label="Invertir orden"
            >
              {getSortOrderLabel()}
            </button>
          </div>

          {/* Search within filtered */}
          <input
            type="text"
            placeholder="Filtrar por título..."
            value={filters.searchQuery}
            onChange={(e) => onFilterChange('searchQuery', e.target.value)}
            className="flex-1 bg-slate-800 border border-slate-600 text-white px-3 md:px-4 py-2 rounded-lg outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all text-xs md:text-sm"
          />

          {/* Reset button */}
          <button
            onClick={onReset}
            className="px-4 md:px-6 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-lg transition-all text-xs md:text-sm font-semibold whitespace-nowrap"
          >
            Limpiar
          </button>
        </div>
      </div>
    </div>
  )
}

export default FilterPanel
