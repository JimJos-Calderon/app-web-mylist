import React, { useState, useRef, useEffect } from 'react'
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
import { ItemCard, SearchBar, FilterPanel } from '@/features/items'
import { supabase } from '@/supabaseClient'
import { CreateListDialog, InviteDialog } from './ListDialogs'
import ListSelector from './ListSelector'

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

const ListaContenido: React.FC<ListaContenidoProps> = ({
  tipo,
  icono,
  listId,
  lists = [],
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
  const [showSecondaryControls, setShowSecondaryControls] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ListItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isModalAnimating, setIsModalAnimating] = useState(false)
  const [synopsis, setSynopsis] = useState<string | null>(null)
  const [synopsisLoading, setSynopsisLoading] = useState(false)
  const [synopsisError, setSynopsisError] = useState<string | null>(null)
  const [synopsisCache, setSynopsisCache] = useState<Record<string, string>>({})
  const [modalActionLoading, setModalActionLoading] = useState<'toggle' | 'delete' | null>(null)

  const sugerenciasRef = useRef<HTMLDivElement>(null)
  const closeTimeoutRef = useRef<number | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const searchSectionRef = useRef<HTMLDivElement>(null)
  const discoverSectionRef = useRef<HTMLDivElement>(null)

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
    searchSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    const input = searchSectionRef.current?.querySelector('input') as HTMLInputElement | null
    input?.focus()
  }

  const focusDecisionBlock = () => {
    discoverSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleListChange = (list: List) => {
    setCurrentList?.(list)
    requestAnimationFrame(() => {
      focusSearch()
    })
  }

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
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
  }, [
    filters.searchQuery,
    filters.showWatched,
    filters.showUnwatched,
    filters.sortBy,
    filters.sortOrder,
  ])

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

      requestAnimationFrame(() => {
        focusDecisionBlock()
      })
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

      requestAnimationFrame(() => {
        focusDecisionBlock()
      })
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
    setModalActionLoading(null)

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
      setModalActionLoading(null)
      closeTimeoutRef.current = null
      previousFocusRef.current?.focus()
    }, 180)
  }

  const handleToggleFromModal = async () => {
    if (!selectedItem || modalActionLoading) return

    setModalActionLoading('toggle')

    try {
      await toggleVisto(selectedItem.id, selectedItem.visto)

      setSelectedItem((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          visto: !prev.visto,
        }
      })
    } catch (err) {
      console.error('Toggle error:', err)
    } finally {
      setModalActionLoading(null)
    }
  }

  const handleDeleteFromModal = async () => {
    if (!selectedItem || modalActionLoading) return
    if (!confirm(t('modal.delete_title', { title: selectedItem.titulo }))) return

    setModalActionLoading('delete')

    try {
      await deleteItem(selectedItem.id)
      handleCloseDetails()
    } catch (err) {
      console.error('Delete error:', err)
      setModalActionLoading(null)
    }
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

  const searchedAndSortedItems = items
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

  const pendingItems = searchedAndSortedItems.filter((item) => !item.visto)
  const watchedItems = searchedAndSortedItems.filter((item) => item.visto)

  const visiblePendingItems = filters.showUnwatched ? pendingItems : []
  const visibleWatchedItems = filters.showWatched ? watchedItems : []

  const totalVisibleItems = visiblePendingItems.length + visibleWatchedItems.length
  const totalPages = Math.max(1, Math.ceil(visiblePendingItems.length / ITEMS_PER_PAGE))
  const paginatedPendingItems = visiblePendingItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    (currentPage - 1) * ITEMS_PER_PAGE + ITEMS_PER_PAGE
  )

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!user) return null

  return (
    <div className="min-h-screen w-full bg-black text-white">
      <CreateListDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreated={(newList: List) => {
          setShowCreateDialog(false)
          if (setCurrentList) {
            setCurrentList(newList)
          }

          requestAnimationFrame(() => {
            focusSearch()
          })
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

      <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6 md:py-10">
        <header className="mb-6 space-y-2 md:mb-8">
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
            Lista activa clara, añadir rápido y pendientes como bloque principal.
          </p>
        </header>

        <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-950/50 p-4 md:p-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-4">
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">
                  Lista activa
                </p>
                <h2 className="text-xl font-semibold text-white md:text-2xl">
                  {currentList?.name || 'Sin lista seleccionada'}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  {currentList
                    ? 'Todo lo que hagas aquí se aplicará a esta lista.'
                    : 'Elige o crea una lista para empezar.'}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                {lists.length > 0 && setCurrentList && (
                  <div className="min-w-[260px] flex-1">
                    <ListSelector
                      lists={lists}
                      currentList={currentList}
                      onChange={handleListChange}
                      loading={loadingLists}
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setShowCreateDialog(true)}
                  className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-200 transition hover:border-cyan-400 hover:bg-cyan-500/15 hover:text-cyan-100"
                >
                  {t('action.create_list')}
                </button>

                {currentList && (
                  <button
                    type="button"
                    onClick={() => setShowInviteDialog(true)}
                    className="rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
                  >
                    {t('action.invite')}
                  </button>
                )}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-400">
                  Pendientes
                </p>
                <h3 className="text-xl font-semibold text-white">{pendingItems.length}</h3>
                <p className="mt-1 text-xs text-slate-400">Bloque principal para decidir.</p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-3">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                  Vistos
                </p>
                <h3 className="text-xl font-semibold text-white">{watchedItems.length}</h3>
                <p className="mt-1 text-xs text-slate-400">Historial secundario.</p>
              </div>

              <button
                type="button"
                onClick={focusDecisionBlock}
                className="rounded-2xl border border-purple-500/30 bg-purple-500/8 px-4 py-3 text-left transition hover:border-purple-500/50 hover:bg-purple-500/12"
              >
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.22em] text-purple-400">
                  Camino corto
                </p>
                <h3 className="text-sm font-semibold text-white">Ir a pendientes</h3>
                <p className="mt-1 text-xs text-slate-400">Saltar al bloque útil.</p>
              </button>
            </div>
          </div>
        </section>

        {!currentList && (
          <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-950/60 p-6 md:p-8">
            <div className="mx-auto max-w-3xl">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">
                Primer paso
              </p>
              <h3 className="mb-2 text-xl font-semibold text-white">Elige una lista para empezar</h3>
              <p className="mb-6 max-w-2xl text-sm text-slate-400">
                Necesitas una lista activa para añadir títulos, decidir qué ver y seguir el progreso.
              </p>

              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="w-full md:max-w-sm">
                  {lists.length > 0 && setCurrentList ? (
                    <ListSelector
                      lists={lists}
                      currentList={undefined}
                      onChange={handleListChange}
                      loading={loadingLists}
                      label="Elegir lista"
                    />
                  ) : (
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-3 text-sm text-slate-500">
                      {loadingLists ? 'Cargando listas...' : 'Todavía no tienes listas disponibles.'}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowCreateDialog(true)}
                  className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-200 transition hover:border-cyan-400 hover:bg-cyan-500/15 hover:text-cyan-100"
                >
                  {t('action.create_list')}
                </button>
              </div>
            </div>
          </section>
        )}

        {currentList && (
          <>
            {itemsError && <ErrorAlert message={itemsError} onClose={() => {}} />}
            {suggestionsError && <ErrorAlert message={suggestionsError} onClose={() => {}} />}

            <section
              ref={searchSectionRef}
              className="mb-6 rounded-2xl border border-slate-800 bg-slate-950/40 p-4 md:p-5"
            >
              <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">
                    Acción principal
                  </p>
                  <h3 className="text-base font-semibold text-white">Buscar y añadir opciones</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    Añade rápido y vuelve al bloque de pendientes.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={focusDecisionBlock}
                  className="rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
                >
                  Bajar a pendientes
                </button>
              </div>

              <SearchBar
                value={searchInput}
                onChange={setSearchInput}
                onSubmit={handleAddManual}
                placeholder={t(
                  tipo === 'pelicula'
                    ? 'action.search_movie_placeholder'
                    : 'action.search_series_placeholder'
                )}
                loading={suggestionsLoading}
                showDropdown={showSuggestions && suggestions.length > 0}
                suggestions={suggestions}
                onSuggestionSelect={handleAddFromSuggestion}
                ref={sugerenciasRef}
              />
            </section>

            <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-950/35 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                    Secundario
                  </p>
                  <h3 className="text-base font-semibold text-white">Filtros</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    Úsalos solo cuando ayuden a decidir mejor.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSecondaryControls((prev) => !prev)}
                    className="rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
                  >
                    {showSecondaryControls ? 'Ocultar filtros' : 'Mostrar filtros'}
                  </button>

                  <button
                    type="button"
                    onClick={resetFilters}
                    className="rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
                  >
                    Quitar filtros
                  </button>
                </div>
              </div>

              {showSecondaryControls && (
                <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                  <FilterPanel
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onReset={resetFilters}
                    sortOptions={SORT_OPTIONS}
                  />
                </div>
              )}
            </section>

            <section ref={discoverSectionRef} id="discover-section">
              {loading && (
                <div className="py-12 text-center">
                  <div className="inline-flex flex-col items-center gap-4">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
                      {t('loading.items')}...
                    </p>
                  </div>
                </div>
              )}

              {!loading && totalVisibleItems === 0 && (
                <div className="rounded-3xl border border-slate-800 bg-slate-950/35 px-6 py-16 text-center">
                  <h3 className="mb-2 text-xl font-semibold text-white">
                    {filters.searchQuery
                      ? 'No hay resultados para decidir'
                      : tipo === 'pelicula'
                        ? 'Tu lista de películas está vacía'
                        : 'Tu lista de series está vacía'}
                  </h3>

                  <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-400">
                    {filters.searchQuery
                      ? t('item.search_no_results', { type: tipo, query: filters.searchQuery })
                      : tipo === 'pelicula'
                        ? 'Añade la primera película para empezar a decidir juntos desde pendientes.'
                        : 'Añade la primera serie para empezar a decidir juntos desde pendientes.'}
                  </p>

                  <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={focusSearch}
                      className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:border-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-200"
                    >
                      Añadir una opción ahora
                    </button>

                    <button
                      type="button"
                      onClick={resetFilters}
                      className="rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
                    >
                      Limpiar filtros
                    </button>
                  </div>
                </div>
              )}

              {!loading && totalVisibleItems > 0 && (
                <>
                  {filters.showUnwatched && (
                    <section className="mb-8">
                      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-400">
                            Principal
                          </p>
                          <h3 className="text-lg font-semibold text-white">
                            {filters.searchQuery ? 'Pendientes filtrados' : 'Pendientes para decidir'}
                          </h3>
                          <p className="mt-1 text-sm text-slate-400">
                            Este es el bloque principal para decidir qué ver hoy.
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                          <span className="rounded-full border border-cyan-500/20 bg-cyan-500/5 px-3 py-1">
                            {visiblePendingItems.length} pendientes visibles
                          </span>
                          {totalPages > 1 && (
                            <span className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1">
                              Página {currentPage} de {totalPages}
                            </span>
                          )}
                        </div>
                      </div>

                      {visiblePendingItems.length === 0 ? (
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-6 text-center">
                          <h4 className="mb-2 text-base font-semibold text-white">
                            No hay pendientes visibles
                          </h4>
                          <p className="text-sm text-slate-400">
                            Todo está marcado como visto o la búsqueda no devuelve pendientes.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
                          {paginatedPendingItems.map((item) => (
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
                      )}
                    </section>
                  )}

                  {filters.showUnwatched && visiblePendingItems.length > 0 && totalPages > 1 && (
                    <>
                      <div className="mt-8 flex items-center justify-center gap-1 md:mt-10 md:gap-2">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className={`rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-widest transition-all md:px-4 md:text-sm ${
                            currentPage === 1
                              ? 'cursor-not-allowed border-slate-800 bg-slate-950/50 text-slate-600'
                              : 'border-slate-700 bg-slate-900/70 text-slate-200 hover:border-slate-500 hover:text-white'
                          }`}
                        >
                          <span className="hidden sm:inline">{t('pagination.previous')}</span>
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
                                    className="px-1 py-2 text-xs text-slate-500 md:px-2 md:text-sm"
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
                                className={`min-w-[36px] rounded-xl border px-3 py-2 text-xs font-semibold transition-all md:min-w-[40px] md:px-4 md:text-sm ${
                                  currentPage === page
                                    ? 'border-cyan-400 bg-cyan-500/15 text-cyan-200'
                                    : 'border-slate-700 bg-slate-900/70 text-slate-300 hover:border-slate-500 hover:text-white'
                                }`}
                              >
                                {page}
                              </button>
                            )
                          })}
                        </div>

                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className={`rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-widest transition-all md:px-4 md:text-sm ${
                            currentPage === totalPages
                              ? 'cursor-not-allowed border-slate-800 bg-slate-950/50 text-slate-600'
                              : 'border-slate-700 bg-slate-900/70 text-slate-200 hover:border-slate-500 hover:text-white'
                          }`}
                        >
                          <span className="hidden sm:inline">{t('pagination.next')}</span>
                          <span className="sm:hidden">{'>'}</span>
                        </button>
                      </div>

                      <div className="mt-3 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 md:text-xs md:tracking-widest">
                          <span className="hidden sm:inline">
                            {t('pagination.page', { current: currentPage, total: totalPages })} •{' '}
                          </span>
                          {visiblePendingItems.length} por decidir
                        </p>
                      </div>
                    </>
                  )}

                  {filters.showWatched && (
                    <section className={filters.showUnwatched ? 'mt-10' : 'mb-8'}>
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">
                            Historial
                          </p>
                          <h3 className="text-lg font-semibold text-white">Ya vistos</h3>
                        </div>

                        <p className="text-xs text-slate-400">{visibleWatchedItems.length} vistos</p>
                      </div>

                      {visibleWatchedItems.length === 0 ? (
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-6 text-center">
                          <h4 className="mb-2 text-base font-semibold text-white">
                            No hay vistos visibles
                          </h4>
                          <p className="text-sm text-slate-400">
                            Todavía no habéis marcado títulos como vistos o la búsqueda no devuelve resultados.
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 gap-4 opacity-90 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
                            {visibleWatchedItems.slice(0, 6).map((item) => (
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

                          {visibleWatchedItems.length > 6 && (
                            <p className="mt-3 text-sm text-slate-500">
                              Mostrando 6 de {visibleWatchedItems.length} vistos.
                            </p>
                          )}
                        </>
                      )}
                    </section>
                  )}
                </>
              )}
            </section>
          </>
        )}
      </div>

      {isModalOpen && selectedItem && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm transition-opacity duration-200 ${
            isModalAnimating ? 'bg-black/70 opacity-100' : 'bg-black/0 opacity-0'
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
            className={`w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-700/40 bg-slate-950/95 shadow-2xl transition-all duration-200 ${
              isModalAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-800/60 p-5">
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                  Detalle
                </p>
                <h3 className="text-lg font-black uppercase tracking-tight text-white md:text-2xl">
                  {selectedItem.titulo}
                </h3>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-300">
                    {selectedItem.tipo === 'pelicula'
                      ? t('action.movie_type')
                      : t('action.series_type')}
                  </span>
                  <span
                    className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${
                      selectedItem.visto
                        ? 'border-cyan-400/35 bg-cyan-400/10 text-cyan-200'
                        : 'border-amber-400/35 bg-amber-400/10 text-amber-200'
                    }`}
                  >
                    {selectedItem.visto ? t('item.watched') : t('item.not_watched')}
                  </span>
                </div>
              </div>

              <button
                ref={closeButtonRef}
                type="button"
                onClick={handleCloseDetails}
                className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-400 transition hover:border-slate-500 hover:text-white"
                aria-label={t('modal.close')}
              >
                ✕
              </button>
            </div>

            <div className="grid gap-0 md:grid-cols-[320px_minmax(0,1fr)]">
              <div className="border-b border-slate-800/60 bg-slate-950/60 p-5 md:border-b-0 md:border-r">
                {selectedItem.poster_url ? (
                  <div className="flex max-h-[420px] w-full items-center justify-center overflow-hidden rounded-xl bg-slate-900/60">
                    <img
                      src={selectedItem.poster_url}
                      alt={selectedItem.titulo}
                      className="max-h-[420px] w-auto max-w-full object-contain"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="flex h-72 w-full items-center justify-center rounded-xl bg-slate-900 text-slate-500">
                    {t('no_image')}
                  </div>
                )}

                {selectedItem.genero && (
                  <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3">
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                      Género
                    </p>
                    <p className="text-sm text-slate-200">{selectedItem.genero}</p>
                  </div>
                )}
              </div>

              <div className="space-y-5 p-5 md:p-6">
                <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                    Sinopsis
                  </p>
                  {synopsisLoading ? (
                    <p className="text-sm text-slate-400">Cargando sinopsis...</p>
                  ) : synopsisError ? (
                    <p className="text-sm text-rose-300">{synopsisError}</p>
                  ) : synopsis ? (
                    <p className="text-sm leading-relaxed text-slate-300">{synopsis}</p>
                  ) : (
                    <p className="text-sm text-slate-500">No hay sinopsis disponible.</p>
                  )}
                </section>

                <section className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleToggleFromModal}
                    disabled={modalActionLoading !== null}
                    className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      selectedItem.visto
                        ? 'border border-amber-400/35 bg-amber-400/10 text-amber-200 hover:bg-amber-400/15'
                        : 'border border-cyan-400/35 bg-cyan-400/10 text-cyan-200 hover:bg-cyan-400/15'
                    } ${modalActionLoading !== null ? 'cursor-not-allowed opacity-60' : ''}`}
                  >
                    {modalActionLoading === 'toggle'
                      ? 'Guardando...'
                      : selectedItem.visto
                        ? 'Marcar como pendiente'
                        : 'Marcar como visto'}
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteFromModal}
                    disabled={modalActionLoading !== null}
                    className={`rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/15 ${
                      modalActionLoading !== null ? 'cursor-not-allowed opacity-60' : ''
                    }`}
                  >
                    {modalActionLoading === 'delete' ? 'Eliminando...' : t('action.delete')}
                  </button>
                </section>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ListaContenido