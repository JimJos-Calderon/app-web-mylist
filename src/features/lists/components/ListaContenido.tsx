import React, { useState, useRef, useEffect, Suspense, lazy } from 'react'
import { useTranslation } from 'react-i18next'
import { ErrorBoundary } from 'react-error-boundary'
import { useAuth } from '@/features/auth'
import { useItems, useSuggestions, useFilters, useOmdb } from '@/features/items'
import { OmdbSuggestion, ListItem, List, FilterState, validateTitle, sanitizeInput, SORT_OPTIONS, ErrorAlert, SectionErrorFallback } from '@/features/shared'
import { ItemCard, SearchBar, FilterPanel, StatsWidget } from '@/features/items'
import { supabase } from '@/supabaseClient'
import { CreateListDialog, InviteDialog } from './ListDialogs'
import ListSelector from './ListSelector'

// ─── Lazy load heavy component (uses Swiper) ───────────────────────────────
const RingSlider = lazy(() => import('@/features/items/components/RingSlider'))
const ActivityFeedPanel = lazy(() => import('@/features/lists/components/ActivityFeed'))

interface ListaContenidoProps {
  tipo: 'pelicula' | 'serie'
  icono: string
  listId?: string
  lists?: List[]
  currentList?: List
  setCurrentList?: (list: List) => void
  loadingLists?: boolean
}

// ─── RingSlider Loading Fallback ───────────────────────────────────────────
const RingSliderSkeleton: React.FC<{ t: any }> = ({ t }) => (
  <div className="relative z-10 w-full h-screen flex items-center justify-center bg-transparent">
    <div className="text-center space-y-6">
      <div className="inline-flex items-center justify-center relative">
        <div className="w-24 h-24 rounded-full border-2 border-[rgba(var(--color-accent-primary-rgb),0.1)] border-t-accent-primary border-r-[var(--color-accent-secondary)] animate-spin"></div>
        <div className="absolute inset-0 border-2 border-[rgba(var(--color-accent-secondary-rgb),0.1)] border-b-[var(--color-accent-secondary)] rounded-full animate-[spin_3s_linear_infinite_reverse]"></div>
        <div className="absolute inset-2 border border-[rgba(var(--color-accent-primary-rgb),0.2)] rounded-full animate-pulse"></div>
      </div>
      <div className="space-y-2">
        <p className="text-accent-primary font-mono font-bold text-sm uppercase tracking-[0.3em] animate-pulse">
          TARGET: {t('view_modes.loading_3d')}
        </p>
        <p className="text-[var(--color-text-muted)] font-mono text-[10px] uppercase opacity-70 tracking-widest">
          {'>'} ENGINE_WARMUP
        </p>
      </div>
    </div>
  </div>
)

const ActivityFeedSkeleton: React.FC<{ t: any }> = ({ t }) => (
  <div className="border border-[rgba(var(--color-accent-primary-rgb),0.2)] bg-[rgba(0,0,0,0.5)] p-5"
    style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}>
    <div className="flex items-center justify-between gap-3 mb-6">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-accent-primary animate-pulse"></div>
        <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-accent-primary">
          SYS.{t('activity_feed.title')}
        </h3>
      </div>
      <div className="w-24 h-2 bg-[rgba(var(--color-accent-primary-rgb),0.2)] animate-pulse" />
    </div>

    <div className="space-y-3">
      {[1, 2, 3].map((line) => (
        <div key={line}
          className="h-10 bg-[rgba(var(--color-accent-primary-rgb),0.05)] border border-[rgba(var(--color-accent-primary-rgb),0.1)] animate-pulse"
          style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }} />
      ))}
    </div>

    <p className="mt-4 text-[10px] font-mono uppercase tracking-widest text-[var(--color-text-muted)] opacity-70">
      {'>'} {t('activity_feed.loading')}
    </p>
  </div>
)

// Removed duplicate definition below
const ListaContenido: React.FC<ListaContenidoProps> = ({ tipo, icono, listId, lists, currentList, setCurrentList, loadingLists }) => {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showActivityFeed, setShowActivityFeed] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth >= 640
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [isMobile, setIsMobile] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'ring'>('grid' as 'grid' | 'ring')
  const handleSetViewMode = (mode: 'grid' | 'ring') => setViewMode(mode)
  const [selectedItem, setSelectedItem] = useState<ListItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isModalAnimating, setIsModalAnimating] = useState(false)
  const [synopsis, setSynopsis] = useState<string | null>(null)
  const [synopsisLoading, setSynopsisLoading] = useState(false)
  const [synopsisError, setSynopsisError] = useState<string | null>(null)
  const [synopsisCache, setSynopsisCache] = useState<Record<string, string>>({})
  const sugerenciasRef = useRef<HTMLDivElement>(null)
  const closeTimeoutRef = useRef<number | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  const ITEMS_PER_PAGE = 9

  const { items, loading, error: itemsError, addItem, deleteItem, toggleVisto, clearError } = useItems(
    tipo,
    user?.id || '',
    listId
  )

  const { suggestions, loading: suggestionsLoading, error: suggestionsError, setSuggestions } = useSuggestions(
    searchInput,
    tipo
  )

  const { fetchPlot } = useOmdb()

  const { filters, updateFilter, resetFilters } = useFilters()
  const resolvedListId = currentList?.id ?? listId

  // Handler para cambios en los filtros
  const handleFilterChange = (filterKey: keyof FilterState, value: any) => {
    updateFilter(filterKey, value)
  }

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

  // Función helper para obtener datos de OMDB directamente
  const fetchOmdbData = async (title: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('search-omdb', {
        body: {
          query: title,
          type: tipo === 'pelicula' ? 'movie' : 'series',
          page: 1,
        },
      })

      if (error) {
        console.warn('OMDB invoke error:', error.message)
        return { Genre: undefined, Poster: undefined }
      }

      const omdbData = data as { Search?: Array<{ Genre?: string; Poster?: string }> }
      const result = omdbData.Search?.[0]
      const omdbResult = {
        Genre:
          result?.Genre && result.Genre !== 'N/A'
            ? result.Genre
            : undefined,
        Poster: result?.Poster !== 'N/A' ? result.Poster : undefined,
      }
      return omdbResult
    } catch (err) {
      console.error('Error fetching OMDB data:', err)
      return { Genre: undefined, Poster: undefined }
    }
  }

  const handleAddFromSuggestion = async (suggestion: OmdbSuggestion) => {
    try {
      // Use poster directly from suggestion
      const poster = suggestion.Poster !== 'N/A' ? suggestion.Poster : null

      // Obtener género de OMDB usando la sugerencia
      const omdbData = await fetchOmdbData(suggestion.Title)

      const itemData = {
        titulo: suggestion.Title,
        tipo,
        visto: false,
        user_id: user?.id || '',
        user_email: user?.email || '',
        poster_url: poster,
        genero: omdbData.Genre || undefined,
        list_id: listId || '',
      }
      await addItem(itemData)

      setSearchInput('')
      setSuggestions([])
      setShowSuggestions(false)
    } catch (err) {
      const details = err && typeof err === 'object' ? JSON.stringify(err) : String(err)
      console.error('Error adding item:', details, err)
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
      // Obtener género y poster de OMDB
      const omdbData = await fetchOmdbData(searchInput)

      const itemData = {
        titulo: sanitizeInput(searchInput),
        tipo,
        visto: false,
        user_id: user?.id || '',
        user_email: user?.email || '',
        poster_url: omdbData.Poster || null,
        genero: omdbData.Genre || undefined,
        list_id: listId || '',
      }
      await addItem(itemData)

      setSearchInput('')
      setSuggestions([])
      setShowSuggestions(false)
    } catch (err) {
      const details = err && typeof err === 'object' ? JSON.stringify(err) : String(err)
      console.error('Error adding item manually:', details, err)
    }
  }

  const handleOpenDetails = async (item: ListItem) => {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }

    previousFocusRef.current = document.activeElement as HTMLElement | null
    setSelectedItem(item)
    setIsModalOpen(true)
    setIsModalAnimating(false)
    requestAnimationFrame(() => {
      setIsModalAnimating(true)
      closeButtonRef.current?.focus()
    })
    setSynopsisError(null)

    if (synopsisCache[item.id]) {
      setSynopsis(synopsisCache[item.id])
      return
    }

    setSynopsis(null)
    setSynopsisLoading(true)

    try {
      const plot = await fetchPlot(item.titulo)
      setSynopsis(plot)
      if (plot) {
        setSynopsisCache((prev) => ({
          ...prev,
          [item.id]: plot,
        }))
      }
    } catch (err) {
      setSynopsisError('No se pudo cargar la sinopsis')
      console.error('Synopsis error:', err)
    } finally {
      setSynopsisLoading(false)
    }
  }

  const handleCloseDetails = () => {
    setIsModalAnimating(false)
    closeTimeoutRef.current = window.setTimeout(() => {
      setIsModalOpen(false)
      setSelectedItem(null)
      setSynopsis(null)
      setSynopsisError(null)
      closeTimeoutRef.current = null
      previousFocusRef.current?.focus()
    }, 180)
  }

  useEffect(() => {
    if (!isModalOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isModalOpen])

  useEffect(() => {
    if (!selectedItem) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleCloseDetails()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedItem])

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current)
      }
    }
  }, [])

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
      {/* HUD Header for List Control */}
      <div className="relative z-10 mb-6 flex flex-wrap items-center justify-between gap-4 bg-[rgba(0,0,0,0.5)] border border-[rgba(var(--color-accent-primary-rgb),0.3)] px-5 py-3 shadow-[0_0_20px_rgba(var(--color-accent-primary-rgb),0.05)] border-l-4 border-l-accent-primary"
        style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}>

        <div className="flex items-center gap-4">
          {lists && currentList && setCurrentList && (
            <ListSelector
              lists={lists}
              currentList={currentList}
              onChange={setCurrentList}
              loading={loadingLists}
            />
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            className="px-4 py-2 bg-[rgba(var(--color-accent-primary-rgb),0.1)] border border-[rgba(var(--color-accent-primary-rgb),0.5)] text-[#0ff] hover:bg-[rgba(var(--color-accent-primary-rgb),0.2)] hover:border-[#0ff] hover:shadow-[0_0_15px_rgba(var(--color-accent-primary-rgb),0.4)] transition-all font-mono text-[10px] uppercase font-bold tracking-widest flex items-center gap-2"
            style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
            onClick={() => setShowCreateDialog(true)}
          >
            <span className="opacity-70">+</span> [ {t('action.create_list')} ]
          </button>

          {currentList && (
            <button
              className="px-4 py-2 bg-[rgba(var(--color-accent-secondary-rgb),0.1)] border border-[rgba(var(--color-accent-secondary-rgb),0.5)] text-accent-secondary hover:bg-[rgba(var(--color-accent-secondary-rgb),0.2)] hover:border-[var(--color-accent-secondary)] hover:shadow-[0_0_15px_rgba(var(--color-accent-secondary-rgb),0.4)] transition-all font-mono text-[10px] uppercase font-bold tracking-widest flex items-center gap-2"
              style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
              onClick={() => setShowInviteDialog(true)}
            >
              <span className="opacity-70">{'>'}</span> [ {t('action.invite')} ]
            </button>
          )}
        </div>
      </div>
      {/* Diálogos modales */}
      <CreateListDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreated={(newList: List) => {
          setShowCreateDialog(false)
          if (setCurrentList) setCurrentList(newList)
        }}
      />
      {currentList && (
        <InviteDialog
          open={showInviteDialog}
          onClose={() => setShowInviteDialog(false)}
          list={currentList}
        />
      )}
      <div className="fixed inset-0 z-0 pointer-events-none">
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

      {/* Ring view - Full Screen */}
      {!loading && filteredItems.length > 0 && viewMode === 'ring' && (
        <Suspense fallback={<RingSliderSkeleton t={t} />}>
          <div className="relative z-10 w-full">
            <RingSlider
              items={filteredItems}
              allItems={items}
              onOpenDetails={handleOpenDetails}
              userOwnerId={user?.id}
              onViewModeChange={handleSetViewMode}
            />
          </div>
        </Suspense>
      )}

      {/* Grid/Slider/Normal views */}
      {viewMode !== 'ring' && (
        <>
          <div className="relative z-10 w-full max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12">
            <header className="mb-8 md:mb-12">
              <div className="flex items-center gap-3 md:gap-5 mb-2 md:mb-3">
                <span className="text-4xl md:text-6xl drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]">{icono}</span>
                <h2 className="text-4xl md:text-5xl lg:text-7xl font-black italic uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 tracking-tighter">
                  {tipo === 'pelicula' ? t('movies.title') : t('series.title')}
                </h2>
              </div>
              <p className="text-cyan-400 font-black text-[8px] md:text-[10px] uppercase tracking-[0.3em] md:tracking-[0.5em] border-l-2 md:border-l-4 border-pink-500 pl-2 md:pl-4 opacity-90">
                {t('movies.subtitle')}
              </p>
            </header>

            {/* Error alerts */}
            {itemsError && (
              <ErrorAlert message={itemsError} onClose={clearError} />
            )}
            {suggestionsError && (
              <ErrorAlert message={suggestionsError} onClose={() => { }} />
            )}

            {/* Search Bar */}
            <SearchBar
              value={searchInput}
              onChange={setSearchInput}
              onSubmit={handleAddManual}
              placeholder={t(tipo === 'pelicula' ? 'action.search_movie_placeholder' : 'action.search_series_placeholder')}
              loading={suggestionsLoading}
              showDropdown={showSuggestions && suggestions.length > 0}
              suggestions={suggestions}
              onSuggestionSelect={handleAddFromSuggestion}
              ref={sugerenciasRef}
            />

            {/* Filter Panel */}
            <FilterPanel
              filters={filters}
              onFilterChange={handleFilterChange}
              onReset={resetFilters}
              sortOptions={SORT_OPTIONS}
            />

            {resolvedListId && (
              <section className="mb-6 border border-[rgba(var(--color-accent-primary-rgb),0.3)] bg-[rgba(0,0,0,0.4)] p-4 md:p-5 shadow-[0_0_20px_rgba(var(--color-accent-primary-rgb),0.05)] border-l-4 border-l-accent-primary"
                style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-sm md:text-base font-black uppercase tracking-widest text-accent-primary font-mono flex items-center gap-2">
                      SYS.{t('activity_feed.title')}
                    </h3>
                    <p className="text-[10px] md:text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)] font-mono opacity-80">
                      {'>'} {t('activity_feed.subtitle')}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowActivityFeed((prev) => !prev)}
                    className="px-4 py-2 bg-[rgba(var(--color-accent-primary-rgb),0.1)] border border-[rgba(var(--color-accent-primary-rgb),0.5)] text-accent-primary hover:bg-[rgba(var(--color-accent-primary-rgb),0.2)] hover:border-[rgba(var(--color-accent-primary-rgb),1)] hover:shadow-[0_0_15px_rgba(var(--color-accent-primary-rgb),0.4)] transition-all font-mono text-[10px] uppercase font-bold tracking-widest flex items-center gap-2"
                    style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
                    aria-expanded={showActivityFeed}
                  >
                    <span className="opacity-70">{showActivityFeed ? '-' : '+'}</span> [ {showActivityFeed ? t('activity_feed.collapse') : t('activity_feed.expand')} ]
                  </button>
                </div>

                {showActivityFeed && (
                  <div className="mt-5 border-t border-[rgba(var(--color-accent-primary-rgb),0.2)] pt-5">
                    <ErrorBoundary FallbackComponent={SectionErrorFallback}>
                      <Suspense fallback={<ActivityFeedSkeleton t={t} />}>
                        <ActivityFeedPanel listId={resolvedListId} limit={20} />
                      </Suspense>
                    </ErrorBoundary>
                  </div>
                )}
              </section>
            )}

            <div className="mb-6 flex justify-end gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 border font-mono text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'grid'
                  ? 'border-accent-primary bg-[rgba(var(--color-accent-primary-rgb),0.15)] text-accent-primary shadow-[0_0_15px_rgba(var(--color-accent-primary-rgb),0.3)]'
                  : 'border-[rgba(var(--color-accent-primary-rgb),0.3)] bg-[rgba(0,0,0,0.5)] text-[var(--color-text-muted)] hover:border-accent-primary hover:text-accent-primary'
                  }`}
                style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
              >
                [ {t('action.grid_view')} ]
              </button>
              <button
                type="button"
                onClick={() => setViewMode('ring')}
                className={`px-4 py-2 border font-mono text-[10px] font-bold uppercase tracking-widest transition-all ${(viewMode as 'grid' | 'ring') === 'ring'
                  ? 'border-accent-primary bg-[rgba(var(--color-accent-primary-rgb),0.15)] text-accent-primary shadow-[0_0_15px_rgba(var(--color-accent-primary-rgb),0.3)]'
                  : 'border-[rgba(var(--color-accent-primary-rgb),0.3)] bg-[rgba(0,0,0,0.5)] text-[var(--color-text-muted)] hover:border-accent-primary hover:text-accent-primary'
                  }`}
                style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
              >
                [ {t('action.ring_view')} ]
              </button>
            </div>

            {/* Loading state */}
            {loading && (
              <div className="text-center py-12">
                <div className="inline-flex flex-col items-center gap-4">
                  <div className="inline-flex items-center justify-center relative">
                    <div className="w-12 h-12 rounded-full border-2 border-[rgba(var(--color-accent-primary-rgb),0.2)] border-t-accent-primary border-r-[var(--color-accent-secondary)] animate-spin"></div>
                    <div className="absolute inset-0 border-2 border-[rgba(var(--color-accent-secondary-rgb),0.1)] border-b-[var(--color-accent-secondary)] rounded-full animate-[spin_3s_linear_infinite_reverse]"></div>
                  </div>
                  <p className="text-accent-primary font-mono font-bold text-xs uppercase tracking-[0.2em] animate-pulse">
                    SYS.{t('loading.items')}...
                  </p>
                </div>
              </div>
            )}

            {/* Empty state */}
            {!loading && filteredItems.length === 0 && (
              <div className="text-center py-20 flex flex-col items-center">
                <div className="w-16 h-16 bg-[rgba(var(--color-accent-primary-rgb),0.05)] border border-[rgba(var(--color-accent-primary-rgb),0.2)] mb-6 flex items-center justify-center text-2xl font-mono text-accent-primary"
                  style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                  SYS
                </div>
                <h3 className="text-lg font-black font-mono text-accent-primary uppercase tracking-widest mb-2">
                  {'>'} {filters.searchQuery
                    ? t('item.no_results')
                    : t('item.add_first', { type: tipo })}
                </h3>
                <p className="text-[var(--color-text-muted)] font-mono text-xs uppercase opacity-70 tracking-widest">
                  {filters.searchQuery
                    ? t('item.search_no_results', { type: tipo, query: filters.searchQuery })
                    : t('item.add_first', { type: tipo })}
                </p>
              </div>
            )}

            {/* Grid of items */}
            {!loading && filteredItems.length > 0 && viewMode === 'grid' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {paginatedItems.map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      isOwn={item.user_id === user.id}
                      onDelete={deleteItem}
                      onToggleVisto={toggleVisto}
                      onOpenDetails={handleOpenDetails}
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
                    px-3 py-2 md:px-4 md:py-2 font-mono text-xs md:text-sm uppercase font-bold tracking-widest
                    border transition-all flex-shrink-0 flex items-center
                    ${currentPage === 1
                          ? 'border-[rgba(var(--color-accent-primary-rgb),0.2)] text-[var(--color-text-muted)] opacity-50 cursor-not-allowed bg-[rgba(0,0,0,0.5)]'
                          : 'border-[rgba(var(--color-accent-primary-rgb),0.5)] text-accent-primary hover:border-accent-primary hover:bg-[rgba(var(--color-accent-primary-rgb),0.1)] hover:shadow-[0_0_15px_rgba(var(--color-accent-primary-rgb),0.3)] bg-[rgba(0,0,0,0.5)]'
                        }
                  `}
                      style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
                    >
                      <span className="hidden sm:inline">[ {t('pagination.previous')} ]</span>
                      <span className="sm:hidden">{'<'}</span>
                    </button>

                    {/* Page Numbers */}
                    <div className="flex gap-1 md:gap-2 overflow-x-auto max-w-[60vw] md:max-w-none scrollbar-none">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        const showPageMobile = page === currentPage || page === 1 || page === totalPages
                        const showPageDesktop = page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)
                        const showPage = isMobile ? showPageMobile : showPageDesktop

                        if (!showPage) {
                          if (!isMobile && (page === currentPage - 2 || page === currentPage + 2)) {
                            return (
                              <span key={page} className="px-1 md:px-2 py-2 text-[var(--color-text-muted)] font-mono text-xs md:text-sm opacity-50">
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
                          px-3 py-2 md:px-4 md:py-2 font-mono text-xs md:text-sm uppercase font-bold
                          border transition-all flex-shrink-0 min-w-[36px] md:min-w-[40px] flex items-center justify-center
                          ${currentPage === page
                                ? 'border-accent-primary bg-[rgba(var(--color-accent-primary-rgb),0.15)] text-accent-primary shadow-[0_0_15px_rgba(var(--color-accent-primary-rgb),0.3)]'
                                : 'border-[rgba(var(--color-accent-primary-rgb),0.3)] text-[var(--color-text-muted)] hover:border-[rgba(var(--color-accent-primary-rgb),0.8)] hover:bg-[rgba(var(--color-accent-primary-rgb),0.1)] hover:text-accent-primary bg-[rgba(0,0,0,0.5)]'
                              }
                        `}
                            style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
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
                    px-3 py-2 md:px-4 md:py-2 font-mono text-xs md:text-sm uppercase font-bold tracking-widest
                    border transition-all flex-shrink-0 flex items-center
                    ${currentPage === totalPages
                          ? 'border-[rgba(var(--color-accent-primary-rgb),0.2)] text-[var(--color-text-muted)] opacity-50 cursor-not-allowed bg-[rgba(0,0,0,0.5)]'
                          : 'border-[rgba(var(--color-accent-primary-rgb),0.5)] text-accent-primary hover:border-accent-primary hover:bg-[rgba(var(--color-accent-primary-rgb),0.1)] hover:shadow-[0_0_15px_rgba(var(--color-accent-primary-rgb),0.3)] bg-[rgba(0,0,0,0.5)]'
                        }
                  `}
                      style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
                    >
                      <span className="hidden sm:inline">[ {t('pagination.next')} ]</span>
                      <span className="sm:hidden">{'>'}</span>
                    </button>
                  </div>
                )}

                {/* Page Info */}
                {totalPages > 1 && (
                  <div className="mt-3 md:mt-4 text-center px-4">
                    <p className="text-slate-400 text-[10px] md:text-xs uppercase tracking-wider md:tracking-widest font-bold">
                      <span className="hidden sm:inline">{t('pagination.page', { current: currentPage, total: totalPages })} • </span>
                      {filteredItems.length} {t(tipo === 'pelicula' ? 'movie_plural' : 'series_plural')}
                      <span className="hidden sm:inline"> {t('stats.in_total')}</span>
                    </p>
                  </div>
                )}

              </>
            )}

            {/* Stats */}
            {!loading && items.length > 0 && viewMode === 'grid' && (
              <div className="mt-8 md:mt-12">
                <StatsWidget items={items} userOwnerId={user.id} size="large" />
              </div>
            )}
          </div>
        </>
      )}

      {isModalOpen && selectedItem && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm transition-opacity duration-200 ${isModalAnimating ? 'bg-black/70 opacity-100' : 'bg-black/0 opacity-0'
            }`}
          role="dialog"
          aria-modal="true"
          aria-label={`${t('details_title')} ${selectedItem.titulo}`}
          onClick={handleCloseDetails}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.stopPropagation()
              handleCloseDetails()
            }
          }}
        >
          <div
            className={`w-full max-w-2xl rounded-2xl border border-slate-700/40 bg-slate-950/95 shadow-2xl overflow-hidden transition-all duration-200 ${isModalAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
              }`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 p-5 border-b border-slate-800/60">
              <div>
                <h3 className="text-lg md:text-xl font-black uppercase text-white tracking-tight">
                  {selectedItem.titulo}
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedItem.tipo === 'pelicula' ? t('action.movie_type') : t('action.series_type')}
                </p>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={handleCloseDetails}
                className="text-slate-400 hover:text-white transition"
                aria-label={t('modal.close')}
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4 p-5">
              <div className="w-full">
                {selectedItem.poster_url ? (
                  <div className="w-full max-h-80 rounded-xl bg-slate-900/60 flex items-center justify-center overflow-hidden">
                    <img
                      src={selectedItem.poster_url}
                      alt={selectedItem.titulo}
                      className="h-80 w-auto max-w-full object-contain"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="h-48 w-full rounded-xl bg-slate-900 flex items-center justify-center text-slate-500">
                    {t('no_image')}
                  </div>
                )}
              </div>

              <div className="text-sm text-slate-200 leading-relaxed">
                {synopsisLoading && <p className="text-slate-400">{t('loading.synopsis')}</p>}
                {synopsisError && <p className="text-red-400">{synopsisError}</p>}
                {!synopsisLoading && !synopsisError && (
                  <p>{synopsis || t('item.no_synopsis')}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-800/60">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await toggleVisto(selectedItem.id, selectedItem.visto)
                      handleCloseDetails()
                    } catch (err) {
                      console.error('Toggle error:', err)
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 hover:border-cyan-400 text-cyan-300 hover:text-cyan-200 rounded-lg transition-all text-sm font-semibold uppercase tracking-wide"
                >
                  {selectedItem.visto ? t('item.watched') : t('item.not_watched')}
                </button>

                {selectedItem.user_id === user?.id && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!confirm(t('modal.delete_title', { title: selectedItem.titulo }))) return
                      try {
                        await deleteItem(selectedItem.id)
                        handleCloseDetails()
                      } catch (err) {
                        console.error('Delete error:', err)
                      }
                    }}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 hover:border-red-400 text-red-300 hover:text-red-200 rounded-lg transition-all text-sm font-semibold uppercase tracking-wide"
                  >
                    🗑️ {t('action.delete')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ListaContenido
