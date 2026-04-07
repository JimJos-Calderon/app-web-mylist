import React from 'react'
import { OmdbSuggestion } from '@/features/shared'
import { SearchBar } from '@/features/items'

interface ListSearchSectionProps {
  searchInput: string
  setSearchInput: (value: string) => void
  onSubmit: (event: React.FormEvent) => void
  suggestionsLoading: boolean
  showSuggestions: boolean
  suggestions: OmdbSuggestion[]
  onSuggestionSelect: (suggestion: OmdbSuggestion) => void
  sugerenciasRef: React.RefObject<HTMLDivElement | null>
  searchPlaceholder: string
}

const ListSearchSection: React.FC<ListSearchSectionProps> = ({
  searchInput,
  setSearchInput,
  onSubmit,
  suggestionsLoading,
  showSuggestions,
  suggestions,
  onSuggestionSelect,
  sugerenciasRef,
  searchPlaceholder,
}) => {
  return (
    <section className="relative z-30 mb-8 md:sticky md:top-6 md:mb-12">
      <div className="list-search-shell mx-auto max-w-2xl p-4 md:p-5">
        <SearchBar
          value={searchInput}
          onChange={setSearchInput}
          onSubmit={onSubmit}
          placeholder={searchPlaceholder}
          loading={suggestionsLoading}
          showDropdown={showSuggestions && suggestions.length > 0}
          suggestions={suggestions}
          onSuggestionSelect={onSuggestionSelect}
          ref={sugerenciasRef}
        />
      </div>
    </section>
  )
}

export default ListSearchSection
