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
  onFocusDecisionBlock: () => void
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
  onFocusDecisionBlock,
  searchPlaceholder,
}) => {
  return (
    <section className="mb-6 rounded-2xl border border-[rgba(var(--color-accent-primary-rgb),0.18)] bg-[rgba(0,0,0,0.28)] p-4 md:p-5">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">
            Acción principal
          </p>
          <h3 className="text-base font-semibold text-white">Buscar y añadir opciones</h3>
          <p className="mt-1 text-sm text-slate-400">
            Mete candidatos rápido en la lista activa y vuelve a decidir.
          </p>
        </div>

        <button
          type="button"
          onClick={onFocusDecisionBlock}
          className="rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
        >
          Bajar a pendientes
        </button>
      </div>

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