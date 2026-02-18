import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '@hooks/useAuth'
import { useItems } from '@hooks/useItems'
import { useSuggestions } from '@hooks/useSuggestions'
import { useFilters } from '@hooks/useFilters'
import { useOmdb } from '@hooks/useOmdb'
import { OmdbSuggestion } from '@/types'
import { validateTitle, sanitizeInput } from '@utils/validation'
import { SORT_OPTIONS } from '@constants/index'
import ItemCard from '@components/ItemCard'
import SearchBar from '@components/SearchBar'
import FilterPanel from '@components/FilterPanel'
import ErrorAlert from '@components/ErrorAlert'

interface ListaContenidoProps {
  tipo: 'pelicula' | 'serie'
  icono: string
}

const ListaContenido: React.FC<ListaContenidoProps> = ({ tipo, icono }) => {
  const { user } = useAuth()
  const [searchInput, setSearchInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const sugerenciasRef = useRef<HTMLDivElement>(null)

  const { items, loading, error: itemsError, addItem, deleteItem, toggleVisto, clearError } = useItems(
    tipo,
    user?.id || ''
  )

  const { suggestions, loading: suggestionsLoading, error: suggestionsError, setSuggestions } = useSuggestions(
    searchInput,
    tipo
  )

  const { getPosterUrl } = useOmdb()
  const { filters, updateFilter, resetFilters } = useFilters()

  // Close suggestions dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        sugerenciasRef.current &&
        !sugerenciasRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Show suggestions when they arrive and input has 3+ chars
  useEffect(() => {
    if (searchInput.length >= 3 && suggestions.length > 0) {
      setShowSuggestions(true)
    } else if (searchInput.length < 3) {
      setShowSuggestions(false)
    }
  }, [suggestions, searchInput])

  const handleAddFromSuggestion = async (suggestion: OmdbSuggestion) => {
    try {
      // Use poster directly from suggestion, avoiding extra API call
      const poster = suggestion.Poster !== 'N/A' ? suggestion.Poster : null

      await addItem({
        titulo: suggestion.Title,
        tipo,
        visto: false,
        user_id: user?.id || '',
        user_email: user?.email || '',
        poster_url: poster,
      })

      setSearchInput('')
      setSuggestions([])
      setShowSuggestions(false)
    } catch (err) {
      console.error('Error adding item:', err)
    }
  }

  const handleAddManual = async (e: React.FormEvent) => {
    e.preventDefault()

    const validation = validateTitle(searchInput)
    if (!validation.valid) {
      alert(validation.message)
      return
    }

    try {
      const poster = await getPosterUrl(searchInput)

      await addItem({
        titulo: sanitizeInput(searchInput),
        tipo,
        visto: false,
        user_id: user?.id || '',
        user_email: user?.email || '',
        poster_url: poster,
      })

      setSearchInput('')
      setSuggestions([])
      setShowSuggestions(false)
    } catch (err) {
      console.error('Error adding item manually:', err)
    }
  }

  // Filter and sort items
  const filteredItems = items
    .filter((item) => {
      if (filters.showWatched && item.visto) return true
      if (filters.showUnwatched && !item.visto) return true
      return false
    })
    .filter((item) => {
      if (!filters.searchQuery) return true
      return item.titulo.toLowerCase().includes(filters.searchQuery.toLowerCase())
    })
    .sort((a, b) => {
      switch (filters.sortBy) {
        case 'title':
          return a.titulo.localeCompare(b.titulo)
        case 'rating':
          return (b.rating || 0) - (a.rating || 0)
        case 'date':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

  if (!user) return null

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden font-sans bg-black">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-purple-900/10 to-black"></div>
        <div
          className="absolute bottom-0 left-0 right-0 h-[40%] opacity-10"
          style={{
            backgroundImage: `linear-gradient(to right, #ff00ff 1px, transparent 1px), linear-gradient(to bottom, #ff00ff 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
            transform: 'perspective(500px) rotateX(60deg)',
            transformOrigin: 'bottom center',
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60"></div>
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-12">
        <header className="mb-12">
          <div className="flex items-center gap-5 mb-3">
            <span className="text-6xl drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]">{icono}</span>
            <h2 className="text-5xl md:text-7xl font-black italic uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 tracking-tighter">
              {tipo}s
            </h2>
          </div>
          <p className="text-cyan-400 font-black text-[10px] uppercase tracking-[0.5em] border-l-4 border-pink-500 pl-4 opacity-90">
            STATION_SYNC // {user?.email?.split('@')[0] || 'user'}
          </p>
        </header>

        {/* Error alerts */}
        {itemsError && (
          <ErrorAlert message={itemsError} onClose={clearError} />
        )}
        {suggestionsError && (
          <ErrorAlert message={suggestionsError} onClose={() => {}} />
        )}

        {/* Search Bar */}
        <SearchBar
          value={searchInput}
          onChange={setSearchInput}
          onSubmit={handleAddManual}
          placeholder={`BUSCAR ${tipo.toUpperCase()}...`}
          loading={suggestionsLoading}
          showDropdown={showSuggestions && suggestions.length > 0}
          suggestions={suggestions}
          onSuggestionSelect={handleAddFromSuggestion}
          ref={sugerenciasRef}
        />

        {/* Filter Panel */}
        <FilterPanel
          filters={filters}
          onFilterChange={updateFilter}
          onReset={resetFilters}
          sortOptions={SORT_OPTIONS}
        />

        {/* Loading state */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full border-4 border-pink-500/20 border-t-pink-500 animate-spin"></div>
              <p className="text-cyan-400 font-black text-sm uppercase tracking-widest">
                Cargando {tipo}s...
              </p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredItems.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🍿</div>
            <h3 className="text-xl font-black text-white mb-2">
              {filters.searchQuery
                ? 'No hay resultados'
                : 'Sin elementos aún'}
            </h3>
            <p className="text-slate-400">
              {filters.searchQuery
                ? `No se encontraron ${tipo}s con "${filters.searchQuery}"`
                : `Agrega tu primer ${tipo} a la lista`}
            </p>
          </div>
        )}

        {/* Grid of items */}
        {!loading && filteredItems.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                isOwn={item.user_id === user.id}
                onDelete={deleteItem}
                onToggleVisto={toggleVisto}
              />
            ))}
          </div>
        )}

        {/* Stats */}
        {!loading && items.length > 0 && (
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/20 rounded-lg p-4">
              <div className="text-2xl font-black text-cyan-400">{items.length}</div>
              <div className="text-xs text-slate-400 uppercase font-bold">Total</div>
            </div>
            <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-lg p-4">
              <div className="text-2xl font-black text-green-400">
                {items.filter((i) => i.visto).length}
              </div>
              <div className="text-xs text-slate-400 uppercase font-bold">Vistas</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-lg p-4">
              <div className="text-2xl font-black text-purple-400">
                {items.filter((i) => !i.visto).length}
              </div>
              <div className="text-xs text-slate-400 uppercase font-bold">Pendientes</div>
            </div>
            <div className="bg-gradient-to-br from-pink-500/10 to-pink-500/5 border border-pink-500/20 rounded-lg p-4">
              <div className="text-2xl font-black text-pink-400">
                {items.filter((i) => i.user_id === user.id).length}
              </div>
              <div className="text-xs text-slate-400 uppercase font-bold">Propias</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ListaContenido
