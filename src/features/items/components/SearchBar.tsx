import React, { Ref } from 'react'
import { useTranslation } from 'react-i18next'
import { HudContainer, OmdbSuggestion, OptimizedImage, TechLabel } from '@/features/shared'
import { Loader2 } from 'lucide-react'

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
    const { t } = useTranslation()
    const ariaLabel = React.useMemo(() => t('placeholders.search_aria_label'), [t])
    
    return (
      <div className="relative" ref={ref}>
        <form onSubmit={onSubmit} className="flex gap-2 md:gap-3">
          <div className="relative flex-1">
            <TechLabel
              text="INPUT.QUERY"
              tone="primary"
              blink
              className="absolute left-4 -top-2 z-10"
            />

            <input
              type="text"
              placeholder={placeholder}
              aria-label={ariaLabel}
              className="w-full hud-search-input px-4 md:px-5 py-3 md:py-4 text-sm md:text-base outline-none transition-all font-mono tracking-wide"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={onFocus}
            />
            {loading && (
              <div className="absolute right-3 md:right-4 top-3 md:top-4 text-accent-primary">
                <Loader2 className="animate-spin h-4 w-4 md:h-5 md:w-5" />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="hud-search-submit px-4 md:px-7 py-3 md:py-4 font-black transition-all uppercase text-[10px] md:text-xs disabled:cursor-not-allowed"
          >
            {loading ? '...' : t('action.search_ok_button')}
          </button>
        </form>

        {/* Suggestions Dropdown */}
        {showDropdown && suggestions.length > 0 && (
          <HudContainer
            className="absolute w-full mt-2 z-50 hud-search-dropdown"
            contentClassName="max-h-[500px] overflow-y-auto hud-search-dropdown-content"
          >
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.imdbID}
                type="button"
                onClick={() => onSuggestionSelect?.(suggestion)}
                className="w-full flex items-center gap-4 p-3 hud-search-suggestion text-left transition-all"
              >
                <div className="w-10 h-14 flex-shrink-0 rounded hud-search-suggestion-thumb overflow-hidden">
                  <OptimizedImage
                    src={suggestion.Poster !== 'N/A' ? suggestion.Poster : undefined}
                    alt={suggestion.Title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="hud-search-suggestion-title font-black text-sm uppercase italic">
                    {suggestion.Title}
                  </div>
                  <div className="hud-search-suggestion-meta text-[10px] font-bold mt-1">
                    {suggestion.Year}
                  </div>
                </div>
              </button>
            ))}
          </HudContainer>
        )}
      </div>
    )
  }
)

SearchBar.displayName = 'SearchBar'

export default SearchBar
