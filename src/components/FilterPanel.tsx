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
  return (
    <div className="mb-8 bg-gradient-to-r from-slate-900/30 to-slate-800/30 border border-slate-700/30 rounded-xl p-6 backdrop-blur-sm">
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        {/* Toggle switches */}
        <div className="flex gap-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.showUnwatched}
              onChange={(e) => onFilterChange('showUnwatched', e.target.checked)}
              className="w-5 h-5 rounded border-2 border-cyan-500 accent-cyan-400"
            />
            <span className="text-sm font-semibold text-slate-300">Pendientes</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.showWatched}
              onChange={(e) => onFilterChange('showWatched', e.target.checked)}
              className="w-5 h-5 rounded border-2 border-cyan-500 accent-cyan-400"
            />
            <span className="text-sm font-semibold text-slate-300">Vistas</span>
          </label>
        </div>

        {/* Sort dropdown */}
        <select
          value={filters.sortBy}
          onChange={(e) => onFilterChange('sortBy', e.target.value)}
          className="bg-slate-800 border border-slate-600 text-white px-4 py-2 rounded-lg outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Search within filtered */}
        <input
          type="text"
          placeholder="Filtrar por título..."
          value={filters.searchQuery}
          onChange={(e) => onFilterChange('searchQuery', e.target.value)}
          className="flex-1 bg-slate-800 border border-slate-600 text-white px-4 py-2 rounded-lg outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all text-sm"
        />

        {/* Reset button */}
        <button
          onClick={onReset}
          className="px-6 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-lg transition-all text-sm font-semibold"
        >
          Limpiar filtros
        </button>
      </div>
    </div>
  )
}

export default FilterPanel
