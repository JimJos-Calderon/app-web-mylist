import React, { Ref } from 'react'
import { OmdbSuggestion } from '@/types'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  placeholder?: string
  loading?: boolean
  showDropdown?: boolean
  suggestions?: OmdbSuggestion[]
  onSuggestionSelect?: (suggestion: OmdbSuggestion) => void
  onFocus?: () => void
  ref?: Ref<HTMLDivElement>
}

const SearchBar = React.forwardRef<HTMLDivElement, SearchBarProps>(
  (
    {
      value,
      onChange,
      onSubmit,
      placeholder = 'Buscar...',
      loading = false,
      showDropdown = false,
      suggestions = [],
      onSuggestionSelect,
      onFocus,
    },
    ref
  ) => {
    return (
      <div className="relative mb-16 max-w-xl" ref={ref}>
        <form onSubmit={onSubmit} className="flex gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={placeholder}
              className="w-full bg-black/70 border-2 border-cyan-500/30 rounded-2xl px-6 py-4 text-white outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(0,255,255,0.2)] transition-all font-bold uppercase tracking-tight"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={onFocus}
            />
            {loading && (
              <div className="absolute right-4 top-4 text-cyan-400">
                <svg className="animate-spin h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-600 px-8 py-4 rounded-2xl font-black text-white shadow-[0_0_20px_rgba(255,0,255,0.4)] transition-all italic uppercase text-xs disabled:cursor-not-allowed"
          >
            {loading ? '...' : 'OK'}
          </button>
        </form>

        {/* Suggestions Dropdown */}
        {showDropdown && suggestions.length > 0 && (
          <div className="absolute w-full mt-2 bg-black/95 border-2 border-pink-500/50 rounded-2xl overflow-hidden z-50 backdrop-blur-xl shadow-lg max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-pink-500/50 scrollbar-track-black/30">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.imdbID}
                type="button"
                onClick={() => onSuggestionSelect?.(suggestion)}
                className="w-full flex items-center gap-4 p-3 hover:bg-pink-500/20 border-b border-white/5 text-left transition-all last:border-b-0"
              >
                <img
                  src={
                    suggestion.Poster !== 'N/A'
                      ? suggestion.Poster
                      : 'https://via.placeholder.com/60x90?text=No+Image'
                  }
                  className="w-10 h-14 object-cover rounded border border-pink-500/30"
                  alt={suggestion.Title}
                  loading="lazy"
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/60x90?text=No+Image'
                  }}
                />
                <div>
                  <div className="text-white font-black text-sm uppercase italic">
                    {suggestion.Title}
                  </div>
                  <div className="text-cyan-400 text-[10px] font-bold mt-1">
                    {suggestion.Year}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }
)

SearchBar.displayName = 'SearchBar'

export default SearchBar
