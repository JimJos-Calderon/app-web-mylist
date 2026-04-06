import { useEffect, useRef, useState, type RefObject } from 'react'
import { resolveItemSynopsis } from '@/features/items/services/itemSynopsisService'
import { ListItem } from '@/features/shared'

interface UseListItemDetailsParams {
  currentUserId: string
  onToggleVisto: (id: string, currentState: boolean) => Promise<void>
  onDeleteItem: (id: string) => Promise<void>
  getDeleteConfirmationMessage: (item: ListItem) => string
  /** Si se define, sustituye la regla por defecto (solo el dueño del ítem puede borrar). */
  canDeleteItem?: (item: ListItem) => boolean
  onQuickCritiqueSave: (
    itemId: string,
    rating: number,
    liked: boolean,
    comment?: string | null
  ) => Promise<void>
  onQuickCritiqueSuccess?: () => void
}

interface OpenDetailsOptions {
  promptComment?: boolean
}

interface UseListItemDetailsReturn {
  selectedItem: ListItem | null
  isModalOpen: boolean
  isModalAnimating: boolean
  synopsis: string | null
  synopsisLoading: boolean
  synopsisError: string | null
  modalActionLoading: 'toggle' | 'delete' | 'critique' | null
  canDeleteSelectedItem: boolean
  shouldPromptComment: boolean
  closeButtonRef: RefObject<HTMLButtonElement | null>
  handleOpenDetails: (item: ListItem, options?: OpenDetailsOptions) => Promise<void>
  handleCloseDetails: () => void
  handleToggleFromModal: () => Promise<void>
  handleDeleteFromModal: () => Promise<void>
  handleConfirmQuickCritique: (rating: number, liked: boolean, comment: string) => Promise<void>
  isQuickCritiqueSaving: boolean
}

export const useListItemDetails = ({
  currentUserId,
  onToggleVisto,
  onDeleteItem,
  getDeleteConfirmationMessage,
  canDeleteItem,
  onQuickCritiqueSave,
  onQuickCritiqueSuccess,
}: UseListItemDetailsParams): UseListItemDetailsReturn => {
  const [selectedItem, setSelectedItem] = useState<ListItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isModalAnimating, setIsModalAnimating] = useState(false)
  const [synopsis, setSynopsis] = useState<string | null>(null)
  const [synopsisLoading, setSynopsisLoading] = useState(false)
  const [synopsisError, setSynopsisError] = useState<string | null>(null)
  const [synopsisCache, setSynopsisCache] = useState<Record<string, string>>({})
  const [modalActionLoading, setModalActionLoading] = useState<'toggle' | 'delete' | 'critique' | null>(
    null,
  )
  const [shouldPromptComment, setShouldPromptComment] = useState(false)

  const closeTimeoutRef = useRef<number | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

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

  const handleOpenDetails = async (item: ListItem, options?: OpenDetailsOptions) => {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }

    previousFocusRef.current = document.activeElement as HTMLElement | null
    setSelectedItem(item)
    setIsModalOpen(true)
    setIsModalAnimating(false)
    setModalActionLoading(null)
    setSynopsisError(null)
    setShouldPromptComment(Boolean(options?.promptComment) && !item.visto)

    requestAnimationFrame(() => {
      setIsModalAnimating(true)
      closeButtonRef.current?.focus()
    })

    if (synopsisCache[item.id]) {
      setSynopsis(synopsisCache[item.id])
      setSynopsisLoading(false)
      return
    }

    setSynopsis(null)
    setSynopsisLoading(true)

    try {
      const plot = await resolveItemSynopsis(item)
      setSynopsis(plot)

      if (plot) {
        setSynopsisCache((previousCache) => ({
          ...previousCache,
          [item.id]: plot,
        }))
      }
    } catch (error) {
      setSynopsisError('No se pudo cargar la sinopsis')
      console.error('Synopsis error:', error)
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
      setShouldPromptComment(false)
      closeTimeoutRef.current = null
      previousFocusRef.current?.focus()
    }, 180)
  }

  const handleToggleFromModal = async () => {
    if (!selectedItem || modalActionLoading) return

    setModalActionLoading('toggle')

    try {
      await onToggleVisto(selectedItem.id, selectedItem.visto)
      setSelectedItem((previousItem) =>
        previousItem ? { ...previousItem, visto: !previousItem.visto } : previousItem
      )
    } catch (error) {
      console.error('Toggle error:', error)
    } finally {
      setModalActionLoading(null)
    }
  }

  const handleConfirmQuickCritique = async (rating: number, liked: boolean, comment: string) => {
    if (!selectedItem || modalActionLoading) return

    setModalActionLoading('critique')

    try {
      await onQuickCritiqueSave(selectedItem.id, rating, liked, comment)
      onQuickCritiqueSuccess?.()
      setSelectedItem((previousItem) =>
        previousItem ? { ...previousItem, visto: true } : previousItem
      )
    } catch (error) {
      console.error('Quick critique error:', error)
      alert(
        error instanceof Error
          ? error.message
          : 'No se pudo guardar la critica. Revisa permisos o vuelve a intentar.',
      )
    } finally {
      setModalActionLoading(null)
    }
  }

  const handleDeleteFromModal = async () => {
    if (!selectedItem || modalActionLoading) return
    if (!confirm(getDeleteConfirmationMessage(selectedItem))) return

    setModalActionLoading('delete')

    try {
      await onDeleteItem(selectedItem.id)
      handleCloseDetails()
    } catch (error) {
      console.error('Delete error:', error)
      setModalActionLoading(null)
    }
  }

  const canDeleteSelectedItem = Boolean(
    selectedItem &&
      (canDeleteItem ? canDeleteItem(selectedItem) : selectedItem.user_id === currentUserId),
  )

  return {
    selectedItem,
    isModalOpen,
    isModalAnimating,
    synopsis,
    synopsisLoading,
    synopsisError,
    modalActionLoading,
    canDeleteSelectedItem,
    shouldPromptComment,
    closeButtonRef,
    handleOpenDetails,
    handleCloseDetails,
    handleToggleFromModal,
    handleDeleteFromModal,
    handleConfirmQuickCritique,
    isQuickCritiqueSaving: modalActionLoading === 'critique',
  }
}