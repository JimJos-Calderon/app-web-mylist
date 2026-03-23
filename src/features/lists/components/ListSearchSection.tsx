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
    <section className="relative z-30 mb-8 rounded-[2rem] border border-[rgba(var(--color-accent-primary-rgb),0.5)] bg-slate-950/95 p-5 shadow-2xl shadow-[rgba(var(--color-accent-primary-rgb),0.15)] backdrop-blur-xl md:sticky md:top-6 md:mb-12 md:p-8">
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
    </section>
  )
}

export default ListSearchSection