import { useEffect, useRef, useState, type RefObject } from 'react'
import { useOmdb } from '@/features/items'
import { ListItem } from '@/features/shared'

interface UseListItemDetailsParams {
  currentUserId: string
  onToggleVisto: (id: string, currentState: boolean) => Promise<void>
  onDeleteItem: (id: string) => Promise<void>
  getDeleteConfirmationMessage: (item: ListItem) => string
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
  modalActionLoading: 'toggle' | 'delete' | null
  canDeleteSelectedItem: boolean
  shouldPromptComment: boolean
  closeButtonRef: RefObject<HTMLButtonElement | null>
  handleOpenDetails: (item: ListItem, options?: OpenDetailsOptions) => Promise<void>
  handleCloseDetails: () => void
  handleToggleFromModal: () => Promise<void>
  handleDeleteFromModal: () => Promise<void>
}

export const useListItemDetails = ({
  currentUserId,
  onToggleVisto,
  onDeleteItem,
  getDeleteConfirmationMessage,
}: UseListItemDetailsParams): UseListItemDetailsReturn => {
  const { fetchPlot } = useOmdb()

  const [selectedItem, setSelectedItem] = useState<ListItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isModalAnimating, setIsModalAnimating] = useState(false)
  const [synopsis, setSynopsis] = useState<string | null>(null)
  const [synopsisLoading, setSynopsisLoading] = useState(false)
  const [synopsisError, setSynopsisError] = useState<string | null>(null)
  const [synopsisCache, setSynopsisCache] = useState<Record<string, string>>({})
  const [modalActionLoading, setModalActionLoading] = useState<'toggle' | 'delete' | null>(null)
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
      const plot = await fetchPlot(item.titulo)
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

  return {
    selectedItem,
    isModalOpen,
    isModalAnimating,
    synopsis,
    synopsisLoading,
    synopsisError,
    modalActionLoading,
    canDeleteSelectedItem: selectedItem?.user_id === currentUserId,
    shouldPromptComment,
    closeButtonRef,
    handleOpenDetails,
    handleCloseDetails,
    handleToggleFromModal,
    handleDeleteFromModal,
  }
}