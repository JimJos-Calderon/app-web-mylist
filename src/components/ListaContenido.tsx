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
  const [currentPage, setCurrentPage] = useState(1)
  const [isMobile, setIsMobile] = useState(false)
  const sugerenciasRef = useRef<HTMLDivElement>(null)

  const ITEMS_PER_PAGE = 9

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

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filters.searchQuery, filters.showWatched, filters.showUnwatched, filters.sortBy, filters.sortOrder])

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
      let compareResult = 0

      switch (filters.sortBy) {
        case 'title':
          compareResult = a.titulo.localeCompare(b.titulo)
          break
        case 'rating':
          compareResult = (a.rating || 0) - (b.rating || 0)
          break
        case 'date':
        default:
          compareResult = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
      }

      return filters.sortOrder === 'desc' ? -compareResult : compareResult
    })

  // Pagination logic
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedItems = filteredItems.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

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

      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <header className="mb-8 md:mb-12">
          <div className="flex items-center gap-3 md:gap-5 mb-2 md:mb-3">
            <span className="text-4xl md:text-6xl drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]">{icono}</span>
            <h2 className="text-4xl md:text-5xl lg:text-7xl font-black italic uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 tracking-tighter">
              {tipo}s
            </h2>
          </div>
          <p className="text-cyan-400 font-black text-[8px] md:text-[10px] uppercase tracking-[0.3em] md:tracking-[0.5em] border-l-2 md:border-l-4 border-pink-500 pl-2 md:pl-4 opacity-90">
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
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {paginatedItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  isOwn={item.user_id === user.id}
                  onDelete={deleteItem}
                  onToggleVisto={toggleVisto}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-8 md:mt-10 flex items-center justify-center gap-1 md:gap-2">
                {/* Previous Button */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`
                    px-2 py-2 md:px-4 md:py-2 rounded-lg font-black text-xs md:text-sm uppercase tracking-wide md:tracking-wider
                    border-2 transition-all duration-300 flex-shrink-0
                    ${currentPage === 1
                      ? 'border-slate-700 text-slate-600 cursor-not-allowed bg-slate-900/20'
                      : 'border-cyan-500/50 text-cyan-400 hover:border-cyan-400 hover:bg-cyan-500/10 hover:shadow-[0_0_15px_rgba(34,211,238,0.5)]'
                    }
                  `}
                >
                  <span className="hidden sm:inline">‹ Anterior</span>
                  <span className="sm:hidden">‹</span>
                </button>

                {/* Page Numbers */}
                <div className="flex gap-1 md:gap-2 overflow-x-auto max-w-[60vw] md:max-w-none scrollbar-none">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // On mobile: show only current page, first, and last
                    // On desktop: show first, last, current, and pages around current
                    const showPageMobile = 
                      page === currentPage ||
                      page === 1 ||
                      page === totalPages

                    const showPageDesktop =
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)

                    const showPage = isMobile ? showPageMobile : showPageDesktop

                    if (!showPage) {
                      // Show ellipsis on desktop only
                      if (!isMobile && (page === currentPage - 2 || page === currentPage + 2)) {
                        return (
                          <span
                            key={page}
                            className="px-1 md:px-2 py-2 text-slate-500 font-black text-xs md:text-sm"
                          >
                            ...
                          </span>
                        )
                      }
                      return null
                    }

                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`
                          px-2 py-2 md:px-4 md:py-2 rounded-lg font-black text-xs md:text-sm uppercase
                          border-2 transition-all duration-300 flex-shrink-0 min-w-[36px] md:min-w-[40px]
                          ${currentPage === page
                            ? 'border-pink-500 bg-gradient-to-br from-pink-500/20 to-purple-500/20 text-pink-400 shadow-[0_0_20px_rgba(236,72,153,0.6)]'
                            : 'border-purple-500/50 text-purple-400 hover:border-purple-400 hover:bg-purple-500/10 hover:shadow-[0_0_15px_rgba(168,85,247,0.5)]'
                          }
                        `}
                      >
                        {page}
                      </button>
                    )
                  })}
                </div>

                {/* Next Button */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`
                    px-2 py-2 md:px-4 md:py-2 rounded-lg font-black text-xs md:text-sm uppercase tracking-wide md:tracking-wider
                    border-2 transition-all duration-300 flex-shrink-0
                    ${currentPage === totalPages
                      ? 'border-slate-700 text-slate-600 cursor-not-allowed bg-slate-900/20'
                      : 'border-cyan-500/50 text-cyan-400 hover:border-cyan-400 hover:bg-cyan-500/10 hover:shadow-[0_0_15px_rgba(34,211,238,0.5)]'
                    }
                  `}
                >
                  <span className="hidden sm:inline">Siguiente ›</span>
                  <span className="sm:hidden">›</span>
                </button>
              </div>
            )}

            {/* Page Info */}
            {totalPages > 1 && (
              <div className="mt-3 md:mt-4 text-center px-4">
                <p className="text-slate-400 text-[10px] md:text-xs uppercase tracking-wider md:tracking-widest font-bold">
                  <span className="hidden sm:inline">Página {currentPage} de {totalPages} • </span>
                  {filteredItems.length} {tipo}s
                  <span className="hidden sm:inline"> en total</span>
                </p>
              </div>
            )}
          </>
        )}

        {/* Stats */}
        {!loading && items.length > 0 && (
          <div className="mt-8 md:mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 text-center">
            <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/20 rounded-lg p-3 md:p-4">
              <div className="text-xl md:text-2xl font-black text-cyan-400">{items.length}</div>
              <div className="text-[10px] md:text-xs text-slate-400 uppercase font-bold">Total</div>
            </div>
            <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-lg p-3 md:p-4">
              <div className="text-xl md:text-2xl font-black text-green-400">
                {items.filter((i) => i.visto).length}
              </div>
              <div className="text-[10px] md:text-xs text-slate-400 uppercase font-bold">Vistas</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-lg p-3 md:p-4">
              <div className="text-xl md:text-2xl font-black text-purple-400">
                {items.filter((i) => !i.visto).length}
              </div>
              <div className="text-[10px] md:text-xs text-slate-400 uppercase font-bold">Pendientes</div>
            </div>
            <div className="bg-gradient-to-br from-pink-500/10 to-pink-500/5 border border-pink-500/20 rounded-lg p-3 md:p-4">
              <div className="text-xl md:text-2xl font-black text-pink-400">
                {items.filter((i) => i.user_id === user.id).length}
              </div>
              <div className="text-[10px] md:text-xs text-slate-400 uppercase font-bold">Propias</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ListaContenido
