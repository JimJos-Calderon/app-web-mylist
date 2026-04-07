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
              className="ui-search-tech-label absolute left-4 -top-2 z-10"
            />

            <input
              type="text"
              placeholder={placeholder}
              aria-label={ariaLabel}
              className="hud-search-input w-full px-4 py-3 text-sm outline-none transition-all md:px-5 md:py-4 md:text-base"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={onFocus}
            />
            {loading && (
              <div className="absolute right-3 top-3 text-accent-primary md:right-4 md:top-4">
                <Loader2 className="h-4 w-4 animate-spin md:h-5 md:w-5" />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="hud-search-submit px-4 py-3 text-[10px] font-black uppercase transition-all disabled:cursor-not-allowed md:px-7 md:py-4 md:text-xs"
          >
            {loading ? '...' : t('action.search_ok_button')}
          </button>
        </form>

        {showDropdown && suggestions.length > 0 && (
          <HudContainer
            className="absolute z-50 mt-2 w-full hud-search-dropdown"
            contentClassName="hud-search-dropdown-content max-h-[500px] overflow-y-auto"
          >
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.imdbID}
                type="button"
                onClick={() => onSuggestionSelect?.(suggestion)}
                className="hud-search-suggestion flex w-full items-center gap-4 p-3 text-left transition-all"
              >
                <div className="hud-search-suggestion-thumb flex h-14 w-10 flex-shrink-0 overflow-hidden rounded">
                  <OptimizedImage
                    src={suggestion.Poster !== 'N/A' ? suggestion.Poster : undefined}
                    alt={suggestion.Title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <div className="hud-search-suggestion-title text-sm font-black uppercase italic">
                    {suggestion.Title}
                  </div>
                  <div className="hud-search-suggestion-meta mt-1 text-[10px] font-bold">{suggestion.Year}</div>
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
