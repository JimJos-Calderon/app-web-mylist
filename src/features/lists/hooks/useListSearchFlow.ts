import { useEffect, useRef, useState, type FormEvent, type RefObject } from 'react'
import { useSuggestions } from '@/features/items'
import {
  ListItem,
  OmdbSuggestion,
  User,
  sanitizeInput,
  validateTitle,
} from '@/features/shared'
import { supabase } from '@/supabaseClient'

interface UseListSearchFlowParams {
  tipo: 'pelicula' | 'serie'
  listId?: string
  user: User
  onAddItem: (item: Omit<ListItem, 'id' | 'created_at'>) => Promise<void>
}

interface UseListSearchFlowReturn {
  searchInput: string
  setSearchInput: (value: string) => void
  showSuggestions: boolean
  suggestions: OmdbSuggestion[]
  suggestionsLoading: boolean
  suggestionsError: string | null
  sugerenciasRef: RefObject<HTMLDivElement | null>
  handleAddManual: (event: FormEvent) => Promise<void>
  handleAddFromSuggestion: (suggestion: OmdbSuggestion) => Promise<void>
  resetSearchUi: () => void
}

export const useListSearchFlow = ({
  tipo,
  listId,
  user,
  onAddItem,
}: UseListSearchFlowParams): UseListSearchFlowReturn => {
  const [searchInput, setSearchInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const sugerenciasRef = useRef<HTMLDivElement>(null)

  const {
    suggestions,
    loading: suggestionsLoading,
    error: suggestionsError,
    setSuggestions,
  } = useSuggestions(searchInput, tipo)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sugerenciasRef.current && !sugerenciasRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (searchInput.length >= 3 && suggestions.length > 0) {
      setShowSuggestions(true)
      return
    }

    if (searchInput.length < 3) {
      setShowSuggestions(false)
    }
  }, [searchInput, suggestions])

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
    } catch (error) {
      console.error('Error fetching OMDB data:', error)
      return { Genre: undefined, Poster: undefined }
    }
  }

  const resetSearchUi = () => {
    setSearchInput('')
    setSuggestions([])
    setShowSuggestions(false)
  }

  const handleAddFromSuggestion = async (suggestion: OmdbSuggestion) => {
    try {
      const poster = suggestion.Poster !== 'N/A' ? suggestion.Poster : null
      const omdbData = await fetchOmdbData(suggestion.Title)

      await onAddItem({
        titulo: suggestion.Title,
        tipo,
        visto: false,
        user_id: user.id,
        user_email: user.email || '',
        poster_url: poster,
        genero: omdbData.Genre || undefined,
        list_id: listId || '',
      })

      resetSearchUi()
    } catch (error) {
      const details = error && typeof error === 'object' ? JSON.stringify(error) : String(error)
      console.error('Error adding item:', details, error)
    }
  }

  const handleAddManual = async (event: FormEvent) => {
    event.preventDefault()

    const validation = validateTitle(searchInput)
    if (!validation.valid) {
      alert(validation.message)
      return
    }

    try {
      const omdbData = await fetchOmdbData(searchInput)

      await onAddItem({
        titulo: sanitizeInput(searchInput),
        tipo,
        visto: false,
        user_id: user.id,
        user_email: user.email || '',
        poster_url: omdbData.Poster || null,
        genero: omdbData.Genre || undefined,
        list_id: listId || '',
      })

      resetSearchUi()
    } catch (error) {
      const details = error && typeof error === 'object' ? JSON.stringify(error) : String(error)
      console.error('Error adding item manually:', details, error)
    }
  }

  return {
    searchInput,
    setSearchInput,
    showSuggestions,
    suggestions,
    suggestionsLoading,
    suggestionsError,
    sugerenciasRef,
    handleAddManual,
    handleAddFromSuggestion,
    resetSearchUi,
  }
}