import React, { useState, useRef, useEffect, Suspense, lazy } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth'
import { useItems, useSuggestions, useFilters, useOmdb } from '@/features/items'
import {
  OmdbSuggestion,
  ListItem,
  List,
  FilterState,
  validateTitle,
  sanitizeInput,
  SORT_OPTIONS,
  ErrorAlert,
} from '@/features/shared'
import { ItemCard, SearchBar, FilterPanel, StatsWidget } from '@/features/items'
import { supabase } from '@/supabaseClient'
import { CreateListDialog, InviteDialog } from './ListDialogs'
import ListSelector from './ListSelector'

// ─── Lazy load heavy component (uses Swiper) ───────────────────────────────
const RingSlider = lazy(() => import('@/features/items/components/RingSlider'))

interface ListaContenidoProps {
  tipo: 'pelicula' | 'serie'
  icono: string
  listId?: string
  lists?: List[]
  currentList?: List
  setCurrentList?: (list: List) => void
  loadingLists?: boolean
  createList?: (name: string, description?: string) => Promise<List | null>
}

// ─── RingSlider Loading Fallback ───────────────────────────────────────────
const RingSliderSkeleton: React.FC<{ t: any }> = ({ t }) => (
  <div className="relative z-10 flex h-screen w-full items-center justify-center bg-transparent">
    <div className="space-y-6 text-center">
      <div className="relative inline-flex items-center justify-center">
        <div className="h-24 w-24 animate-spin rounded-full border-2 border-[rgba(var(--color-accent-primary-rgb),0.1)] border-t-accent-primary border-r-[var(--color-accent-secondary)]"></div>
        <div className="absolute inset-0 animate-[spin_3s_linear_infinite_reverse] rounded-full border-2 border-[rgba(var(--color-accent-secondary-rgb),0.1)] border-b-[var(--color-accent-secondary)]"></div>
        <div className="absolute inset-2 animate-pulse rounded-full border border-[rgba(var(--color-accent-primary-rgb),0.2)]"></div>
      </div>
      <div className="space-y-2">
        <p className="font-mono text-sm font-bold uppercase tracking-[0.3em] text-accent-primary animate-pulse">
          TARGET: {t('view_modes.loading_3d')}
        </p>
        <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] opacity-70">
          {'>'} ENGINE_WARMUP
        </p>
      </div>
    </div>
  </div>
)

const ListaContenido: React.FC<ListaContenidoProps> = ({
  tipo,
  icono,
  listId,
  lists,
  currentList,
  setCurrentList,
  loadingLists,
  createList,
}) => {
  const { user } = useAuth()
  const { t } = useTranslation()

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [isMobile, setIsMobile] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'ring'>('grid')
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
  const searchSectionRef = useRef<HTMLDivElement>(null)

  const ITEMS_PER_PAGE = 9

  const { items, loading, error: itemsError, addItem, deleteItem, toggleVisto } = useItems(
    tipo,
    user?.id || '',
    listId
  )

  const {
    suggestions,
    loading: suggestionsLoading,
    error: suggestionsError,
    setSuggestions,
  } = useSuggestions(searchInput, tipo)

  const { fetchPlot } = useOmdb()
  const { filters, updateFilter, resetFilters } = useFilters()

  const handleFilterChange = (filterKey: keyof FilterState, value: any) => {
    updateFilter(filterKey, value)
  }

  const focusSearch = () => {
    const input = document.getElementById('list-search-input') as HTMLInputElement | null
    input?.focus()
    searchSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sugerenciasRef.current && !sugerenciasRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (searchInput.length >= 3 && suggestions.length > 0) {
      setShowSuggestions(true)
    } else if (searchInput.length < 3) {
      setShowSuggestions(false)
    }
  }, [suggestions, searchInput])

  useEffect(() => {
    setCurrentPage(1)
  }, [filters.searchQuery, filters.showWatched, filters.showUnwatched, filters.sortBy, filters.sortOrder])

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

      return {
        Genre: result?.Genre && result.Genre !== 'N/A' ? result.Genre : undefined,
        Poster: result?.Poster !== 'N/A' ? result.Poster : undefined,
      }
    } catch (err) {
      console.error('Error fetching OMDB data:', err)
      return { Genre: undefined, Poster: undefined }
    }
  }

  const handleAddFromSuggestion = async (suggestion: OmdbSuggestion) => {
    try {
      const poster = suggestion.Poster !== 'N/A' ? suggestion.Poster : null
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
    <div className="relative min-h-screen w-full overflow-x-hidden bg-black font-sans">
      <CreateListDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreated={(newList: List) => {
          setShowCreateDialog(false)
          if (setCurrentList) {
            setCurrentList(newList)
          }
        }}
        onCreate={createList}
      />

      {currentList && (
        <InviteDialog
          open={showInviteDialog}
          onClose={() => setShowInviteDialog(false)}
          list={currentList}
        />
      )}

      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-purple-900/10 to-black"></div>
        <div
          className="absolute bottom-0 left-0 right-0 h-[40%] opacity-10"
          style={{
            backgroundImage:
              'linear-gradient(to right, #ff00ff 1px, transparent 1px), linear-gradient(to bottom, #ff00ff 1px, transparent 1px)',
            backgroundSize: '50px 50px',
            transform: 'perspective(500px) rotateX(60deg)',
            transformOrigin: 'bottom center',
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60"></div>
      </div>

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

      {viewMode !== 'ring' && (
        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-8 md:px-6 md:py-12">
          <header className="mb-8 space-y-3 md:mb-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-400/80">
              {tipo === 'pelicula' ? 'Películas' : 'Series'}
            </p>

            <div className="flex items-center gap-3">
              <span className="text-3xl md:text-4xl">{icono}</span>
              <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
                {tipo === 'pelicula' ? 'Decidir qué ver' : 'Decidir qué seguir'}
              </h1>
            </div>

            <p className="max-w-2xl text-sm text-slate-400">
              Elige una lista, añade opciones y marca el progreso sin perder tiempo.
            </p>
          </header>

          <section
            className="mb-8 rounded-2xl border border-[rgba(var(--color-accent-primary-rgb),0.25)] bg-[rgba(0,0,0,0.45)] p-4 shadow-[0_0_20px_rgba(var(--color-accent-primary-rgb),0.05)] md:p-5"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">
                  Lista activa
                </p>
                <h2 className="text-xl font-bold text-white md:text-2xl">
                  {currentList?.name || 'Sin lista seleccionada'}
                </h2>
                <p className="text-sm text-slate-400">
                  Elige la lista con la que quieres decidir qué ver hoy.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                {lists && currentList && setCurrentList && (
                  <div className="min-w-[220px]">
                    <ListSelector
                      lists={lists}
                      currentList={currentList}
                      onChange={(list) => {
                        setCurrentList?.(list)
                      }}
                      loading={loadingLists}
                    />
                  </div>
                )}

                <button
                  className="flex items-center gap-2 border border-[rgba(var(--color-accent-primary-rgb),0.5)] bg-[rgba(var(--color-accent-primary-rgb),0.1)] px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-[#0ff] transition-all hover:border-[#0ff] hover:bg-[rgba(var(--color-accent-primary-rgb),0.2)] hover:shadow-[0_0_15px_rgba(var(--color-accent-primary-rgb),0.4)]"
                  style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
                  onClick={() => setShowCreateDialog(true)}
                >
                  <span className="opacity-70">+</span> [ {t('action.create_list')} ]
                </button>

                {currentList && (
                  <button
                    className="flex items-center gap-2 border border-[rgba(var(--color-accent-secondary-rgb),0.5)] bg-[rgba(var(--color-accent-secondary-rgb),0.1)] px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-accent-secondary transition-all hover:border-[var(--color-accent-secondary)] hover:bg-[rgba(var(--color-accent-secondary-rgb),0.2)] hover:shadow-[0_0_15px_rgba(var(--color-accent-secondary-rgb),0.4)]"
                    style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
                    onClick={() => setShowInviteDialog(true)}
                  >
                    <span className="opacity-70">{'>'}</span> [ {t('action.invite')} ]
                  </button>
                )}
              </div>
            </div>
          </section>

          {!currentList && (
            <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-950/60 p-8 text-center">
              <h3 className="mb-2 text-lg font-semibold text-white">Elige una lista para empezar</h3>
              <p className="mx-auto max-w-xl text-sm text-slate-400">
                Necesitas una lista activa para añadir títulos, decidir qué ver y seguir el progreso.
              </p>
            </section>
          )}

          {currentList && (
            <>
              {itemsError && <ErrorAlert message={itemsError} onClose={() => { }} />}
              {suggestionsError && <ErrorAlert message={suggestionsError} onClose={() => { }} />}

              <section className="mb-6 grid gap-3 md:grid-cols-2">
                <button
                  type="button"
                  onClick={focusSearch}
                  className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-left transition hover:border-cyan-500/40 hover:bg-slate-900"
                >
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-cyan-400">
                    Acción principal
                  </p>
                  <h3 className="text-sm font-semibold text-white">Buscar y añadir</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    Añade opciones rápido a la lista activa.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => resetFilters()}
                  className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-left transition hover:border-purple-500/40 hover:bg-slate-900"
                >
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-purple-400">
                    Limpieza
                  </p>
                  <h3 className="text-sm font-semibold text-white">Quitar filtros</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    Recupera la vista completa si has filtrado demasiado.
                  </p>
                </button>
              </section>

              <section
                ref={searchSectionRef}
                className="mb-6 rounded-2xl border border-[rgba(var(--color-accent-primary-rgb),0.18)] bg-[rgba(0,0,0,0.28)] p-4"
              >
                <div className="mb-4">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">
                    Añadir opciones
                  </p>
                  <h3 className="text-base font-semibold text-white">
                    Busca algo para esta lista
                  </h3>
                </div>

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
                  id="list-search-input"
                />
              </section>

              <section className="mb-6 rounded-2xl border border-slate-800/80 bg-slate-950/35 p-4">
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                      Ajustes
                    </p>
                    <h3 className="text-base font-semibold text-white">Filtrar y ordenar</h3>
                  </div>

                  <div className="flex flex-wrap gap-2">
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
                      className={`px-4 py-2 border font-mono text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'ring'
                        ? 'border-pink-500/70 bg-pink-500/10 text-pink-300'
                        : 'border-slate-700 bg-[rgba(0,0,0,0.35)] text-slate-400 hover:border-pink-500/40 hover:text-pink-300'
                        }`}
                      style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
                    >
                      [ {t('action.ring_view')} EXP ]
                    </button>
                  </div>
                </div>

                <FilterPanel
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onReset={resetFilters}
                  sortOptions={SORT_OPTIONS}
                />
              </section>

              <section id="discover-section">
                {loading && (
                  <div className="py-12 text-center">
                    <div className="inline-flex flex-col items-center gap-4">
                      <div className="relative inline-flex items-center justify-center">
                        <div className="h-12 w-12 animate-spin rounded-full border-2 border-[rgba(var(--color-accent-primary-rgb),0.2)] border-t-accent-primary border-r-[var(--color-accent-secondary)]"></div>
                        <div className="absolute inset-0 animate-[spin_3s_linear_infinite_reverse] rounded-full border-2 border-[rgba(var(--color-accent-secondary-rgb),0.1)] border-b-[var(--color-accent-secondary)]"></div>
                      </div>
                      <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-accent-primary animate-pulse">
                        SYS.{t('loading.items')}...
                      </p>
                    </div>
                  </div>
                )}

                {!loading && filteredItems.length === 0 && (
                  <div className="flex flex-col items-center py-20 text-center">
                    <div
                      className="mb-6 flex h-16 w-16 items-center justify-center border border-[rgba(var(--color-accent-primary-rgb),0.2)] bg-[rgba(var(--color-accent-primary-rgb),0.05)] text-2xl font-mono text-accent-primary"
                      style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                    >
                      SYS
                    </div>
                    <h3 className="mb-2 font-mono text-lg font-black uppercase tracking-widest text-accent-primary">
                      {'>'}{' '}
                      {filters.searchQuery
                        ? t('item.no_results')
                        : t('item.add_first', { type: tipo })}
                    </h3>
                    <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-text-muted)] opacity-70">
                      {filters.searchQuery
                        ? t('item.search_no_results', { type: tipo, query: filters.searchQuery })
                        : t('item.add_first', { type: tipo })}
                    </p>
                  </div>
                )}

                {!loading && filteredItems.length > 0 && viewMode === 'grid' && (
                  <>
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">
                          Lista actual
                        </p>
                        <h3 className="text-lg font-semibold text-white">
                          {filters.searchQuery ? 'Resultados filtrados' : 'Opciones para decidir'}
                        </h3>
                      </div>

                      <p className="text-xs text-slate-400">
                        {filteredItems.length} {t(tipo === 'pelicula' ? 'movie_plural' : 'series_plural')}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-6">
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

                    {totalPages > 1 && (
                      <div className="mt-8 flex items-center justify-center gap-1 md:mt-10 md:gap-2">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className={`flex flex-shrink-0 items-center px-3 py-2 font-mono text-xs font-bold uppercase tracking-widest border transition-all md:px-4 md:py-2 md:text-sm ${currentPage === 1
                            ? 'border-[rgba(var(--color-accent-primary-rgb),0.2)] text-[var(--color-text-muted)] opacity-50 cursor-not-allowed bg-[rgba(0,0,0,0.5)]'
                            : 'border-[rgba(var(--color-accent-primary-rgb),0.5)] text-accent-primary hover:border-accent-primary hover:bg-[rgba(var(--color-accent-primary-rgb),0.1)] hover:shadow-[0_0_15px_rgba(var(--color-accent-primary-rgb),0.3)] bg-[rgba(0,0,0,0.5)]'
                            }`}
                          style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
                        >
                          <span className="hidden sm:inline">[ {t('pagination.previous')} ]</span>
                          <span className="sm:hidden">{'<'}</span>
                        </button>

                        <div className="scrollbar-none flex max-w-[60vw] gap-1 overflow-x-auto md:max-w-none md:gap-2">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                            const showPageMobile = page === currentPage || page === 1 || page === totalPages
                            const showPageDesktop =
                              page === 1 ||
                              page === totalPages ||
                              (page >= currentPage - 1 && page <= currentPage + 1)
                            const showPage = isMobile ? showPageMobile : showPageDesktop

                            if (!showPage) {
                              if (!isMobile && (page === currentPage - 2 || page === currentPage + 2)) {
                                return (
                                  <span
                                    key={page}
                                    className="px-1 py-2 font-mono text-xs text-[var(--color-text-muted)] opacity-50 md:px-2 md:text-sm"
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
                                className={`flex min-w-[36px] flex-shrink-0 items-center justify-center px-3 py-2 font-mono text-xs font-bold uppercase border transition-all md:min-w-[40px] md:px-4 md:py-2 md:text-sm ${currentPage === page
                                  ? 'border-accent-primary bg-[rgba(var(--color-accent-primary-rgb),0.15)] text-accent-primary shadow-[0_0_15px_rgba(var(--color-accent-primary-rgb),0.3)]'
                                  : 'border-[rgba(var(--color-accent-primary-rgb),0.3)] text-[var(--color-text-muted)] hover:border-[rgba(var(--color-accent-primary-rgb),0.8)] hover:bg-[rgba(var(--color-accent-primary-rgb),0.1)] hover:text-accent-primary bg-[rgba(0,0,0,0.5)]'
                                  }`}
                                style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
                              >
                                {page}
                              </button>
                            )
                          })}
                        </div>

                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className={`flex flex-shrink-0 items-center px-3 py-2 font-mono text-xs font-bold uppercase tracking-widest border transition-all md:px-4 md:py-2 md:text-sm ${currentPage === totalPages
                            ? 'border-[rgba(var(--color-accent-primary-rgb),0.2)] text-[var(--color-text-muted)] opacity-50 cursor-not-allowed bg-[rgba(0,0,0,0.5)]'
                            : 'border-[rgba(var(--color-accent-primary-rgb),0.5)] text-accent-primary hover:border-accent-primary hover:bg-[rgba(var(--color-accent-primary-rgb),0.1)] hover:shadow-[0_0_15px_rgba(var(--color-accent-primary-rgb),0.3)] bg-[rgba(0,0,0,0.5)]'
                            }`}
                          style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
                        >
                          <span className="hidden sm:inline">[ {t('pagination.next')} ]</span>
                          <span className="sm:hidden">{'>'}</span>
                        </button>
                      </div>
                    )}

                    {totalPages > 1 && (
                      <div className="mt-3 px-4 text-center md:mt-4">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 md:text-xs md:tracking-widest">
                          <span className="hidden sm:inline">
                            {t('pagination.page', { current: currentPage, total: totalPages })} •{' '}
                          </span>
                          {filteredItems.length} {t(tipo === 'pelicula' ? 'movie_plural' : 'series_plural')}
                          <span className="hidden sm:inline"> {t('stats.in_total')}</span>
                        </p>
                      </div>
                    )}
                  </>
                )}

                {!loading && items.length > 0 && viewMode === 'grid' && (
                  <div className="mt-8 md:mt-12">
                    <StatsWidget items={items} userOwnerId={user.id} size="large" />
                  </div>
                )}
              </section>
            </>
          )}
        </div>
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
            className={`w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-700/40 bg-slate-950/95 shadow-2xl transition-all duration-200 ${isModalAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
              }`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-800/60 p-5">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight text-white md:text-xl">
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
                className="text-slate-400 transition hover:text-white"
                aria-label={t('modal.close')}
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4 p-5">
              <div className="w-full">
                {selectedItem.poster_url ? (
                  <div className="flex max-h-80 w-full items-center justify-center overflow-hidden rounded-xl bg-slate-900/60">
                    <img
                      src={selectedItem.poster_url}
                      alt={selectedItem.titulo}
                      className="h-80 w-auto max-w-full object-contain"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="flex h-48 w-full items-center justify-center rounded-xl bg-slate-900 text-slate-500">
                    {t('no_image')}
                  </div>
                )}
              </div>

              <div className="text-sm leading-relaxed text-slate-200">
                {synopsisLoading && <p className="text-slate-400">{t('loading.synopsis')}</p>}
                {synopsisError && <p className="text-red-400">{synopsisError}</p>}
                {!synopsisLoading && !synopsisError && <p>{synopsis || t('item.no_synopsis')}</p>}
              </div>

              <div className="flex gap-3 border-t border-slate-800/60 pt-4">
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
                  className="flex-1 rounded-lg border border-cyan-500/50 bg-cyan-500/20 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-cyan-300 transition-all hover:border-cyan-400 hover:bg-cyan-500/30 hover:text-cyan-200"
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
                    className="rounded-lg border border-red-500/50 bg-red-500/20 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-red-300 transition-all hover:border-red-400 hover:bg-red-500/30 hover:text-red-200"
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