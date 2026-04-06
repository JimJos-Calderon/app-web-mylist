import React from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import {
  ItemCommentBox,
  QuickCritiqueModal,
  useItemComments,
  useItemRating,
  useTranslateSynopsis,
} from '@/features/items'
import { ListItem, useTheme } from '@/features/shared'
import { formatRetroHeading } from '@/features/shared/utils/textUtils'

interface ItemDetailsModalProps {
  isOpen: boolean
  isAnimating: boolean
  selectedItem: ListItem | null
  synopsis: string | null
  synopsisLoading: boolean
  synopsisError: string | null
  modalActionLoading: 'toggle' | 'delete' | 'critique' | null
  canDelete: boolean
  promptCommentOnOpen?: boolean
  titlePrefix: string
  closeLabel: string
  noImageLabel: string
  loadingSynopsisLabel: string
  emptySynopsisLabel: string
  movieTypeLabel: string
  seriesTypeLabel: string
  watchedLabel: string
  notWatchedLabel: string
  markWatchedLabel: string
  markUnwatchedLabel: string
  deleteLabel: string
  onClose: () => void
  onToggle: () => void
  onDelete: () => void
  onQuickCritiqueConfirm: (rating: number, liked: boolean, comment: string) => Promise<void>
  isQuickCritiqueSaving: boolean
  onNext?: () => void
  onPrevious?: () => void
  closeButtonRef: React.RefObject<HTMLButtonElement | null>
}

const ItemDetailsModal: React.FC<ItemDetailsModalProps> = ({
  isOpen,
  isAnimating,
  selectedItem,
  synopsis,
  synopsisLoading,
  synopsisError,
  modalActionLoading,
  canDelete,
  promptCommentOnOpen = false,
  titlePrefix,
  closeLabel,
  noImageLabel,
  loadingSynopsisLabel,
  emptySynopsisLabel,
  movieTypeLabel,
  seriesTypeLabel,
  watchedLabel,
  notWatchedLabel,
  markWatchedLabel,
  markUnwatchedLabel,
  deleteLabel,
  onClose,
  onToggle,
  onDelete,
  onQuickCritiqueConfirm,
  isQuickCritiqueSaving,
  onNext,
  onPrevious,
  closeButtonRef,
}) => {
  const { i18n } = useTranslation()
  const { theme } = useTheme()
  const isRetroCartoon = theme === 'retro-cartoon'
  const isCyberpunk = theme === 'cyberpunk'
  const isTerminal = theme === 'terminal'
  const [showQuickCritique, setShowQuickCritique] = React.useState(false)
  const quickCritiqueAutoOpenedRef = React.useRef(false)
  const { deleteComment, comment: existingCommentRow } = useItemComments(selectedItem?.id)
  const { rating: existingItemRating } = useItemRating(selectedItem?.id ?? '')
  const selectedItemId = selectedItem?.id
  const isSelectedItemWatched = Boolean(selectedItem?.visto)
  const activeLanguage = i18n.resolvedLanguage || i18n.language
  const {
    data: translatedSynopsis,
    isLoading: isTranslatingSynopsis,
    isError: hasSynopsisTranslationError,
  } = useTranslateSynopsis({
    itemId: selectedItemId,
    targetLanguage: activeLanguage,
    originalText: synopsis,
  })

  const retroFloatingButton =
    'border-[3px] border-black bg-[var(--color-bg-primary)] text-black shadow-[4px_4px_0px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none'

  React.useEffect(() => {
    if (!isOpen || !selectedItem) {
      quickCritiqueAutoOpenedRef.current = false
      setShowQuickCritique(false)
      return
    }
    if (promptCommentOnOpen && !selectedItem.visto && !quickCritiqueAutoOpenedRef.current) {
      setShowQuickCritique(true)
      quickCritiqueAutoOpenedRef.current = true
    }
  }, [isOpen, selectedItemId, promptCommentOnOpen, selectedItem?.visto])

  const handleRequestClose = () => {
    if (isQuickCritiqueSaving) return
    if (showQuickCritique) {
      setShowQuickCritique(false)
      return
    }
    onClose()
  }

  const handleToggleClick = async () => {
    if (modalActionLoading !== null) return

    if (!selectedItem.visto) {
      setShowQuickCritique(true)
      return
    }

    await deleteComment().catch(() => {
      // If there is no comment or deletion fails, we still allow unwatching.
    })
    await onToggle()
  }

  const handleQuickCritiqueConfirm = async (rating: number, liked: boolean, comment: string) => {
    await onQuickCritiqueConfirm(rating, liked, comment)
    setShowQuickCritique(false)
  }

  if (!isOpen || !selectedItem) return null
  if (typeof document === 'undefined') return null

  const displaySynopsis =
    activeLanguage?.toLowerCase().startsWith('en') || hasSynopsisTranslationError
      ? synopsis
      : translatedSynopsis || synopsis
  const displayTitle = formatRetroHeading(selectedItem.titulo, theme)

  return (
    <>
      {createPortal(
        <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`${titlePrefix} ${selectedItem.titulo}`}
      onClick={handleRequestClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation()
          handleRequestClose()
        } else if (e.key === 'ArrowRight' && onNext) {
          e.stopPropagation()
          onNext()
        } else if (e.key === 'ArrowLeft' && onPrevious) {
          e.stopPropagation()
          onPrevious()
        }
      }}
    >
      <div
        className={`${isRetroCartoon ? 'retro-fx ' : ''}w-full max-w-4xl max-h-[90vh] overflow-y-auto border bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] transition-all duration-200 ${
          isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        } ${
          isRetroCartoon
            ? 'rounded-xl border-[4px] border-black shadow-[10px_10px_0px_0px_#000000]'
            : isTerminal
              ? 'terminal-surface rounded-md'
              : isCyberpunk
                ? 'cyberpunk-surface'
              : 'rounded-2xl border-[rgba(var(--color-accent-primary-rgb),0.25)] shadow-2xl'
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[rgba(var(--color-accent-primary-rgb),0.2)] p-5">
          <div>
            <h3 className="theme-heading-font text-xl md:text-2xl font-black tracking-wide uppercase text-[var(--color-text-primary)]">
              {displayTitle}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="theme-heading-font rounded-full border border-[rgba(var(--color-accent-primary-rgb),0.4)] bg-transparent px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-text-primary)]">
                {selectedItem.tipo === 'pelicula' ? movieTypeLabel : seriesTypeLabel}
              </span>
              <span
                className={`theme-heading-font rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${
                  isRetroCartoon
                    ? 'border-black bg-transparent text-black'
                    : selectedItem.visto
                      ? 'border-[rgba(var(--color-accent-primary-rgb),0.45)] bg-transparent text-[var(--color-accent-primary)]'
                      : 'border-[rgba(var(--color-accent-secondary-rgb),0.45)] bg-transparent text-[var(--color-accent-secondary)]'
                }`}
              >
                {selectedItem.visto ? watchedLabel : notWatchedLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onPrevious && (
              <button
                type="button"
                onClick={onPrevious}
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${
                  isRetroCartoon
                    ? retroFloatingButton
                    : isTerminal
                      ? 'terminal-button theme-heading-font rounded-md'
                      : isCyberpunk
                        ? 'cyberpunk-button cyberpunk-button--ghost theme-heading-font'
                      : 'border border-[rgba(var(--color-accent-primary-rgb),0.3)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] hover:border-[rgba(var(--color-accent-primary-rgb),0.5)]'
                }`}
                aria-label="Anterior"
              >
                {'<'}
              </button>
            )}
            {onNext && (
              <button
                type="button"
                onClick={onNext}
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${
                  isRetroCartoon
                    ? retroFloatingButton
                    : isTerminal
                      ? 'terminal-button theme-heading-font rounded-md'
                      : isCyberpunk
                        ? 'cyberpunk-button cyberpunk-button--ghost theme-heading-font'
                      : 'border border-[rgba(var(--color-accent-primary-rgb),0.3)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] hover:border-[rgba(var(--color-accent-primary-rgb),0.5)]'
                }`}
                aria-label="Siguiente"
              >
                {'>'}
              </button>
            )}
            <div className="mx-1 h-6 w-px bg-[rgba(var(--color-accent-primary-rgb),0.25)]"></div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={handleRequestClose}
              className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${
                isRetroCartoon
                  ? retroFloatingButton
                  : isTerminal
                    ? 'terminal-button theme-heading-font rounded-md'
                    : isCyberpunk
                      ? 'cyberpunk-button cyberpunk-button--ghost theme-heading-font'
                    : 'border border-[rgba(var(--color-accent-primary-rgb),0.3)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] hover:border-[rgba(var(--color-accent-primary-rgb),0.5)]'
              }`}
              aria-label={closeLabel}
              disabled={isQuickCritiqueSaving}
            >
              X
            </button>
          </div>
        </div>

        <div className="grid gap-0 md:grid-cols-[320px_minmax(0,1fr)]">
          <div className="border-b border-[rgba(var(--color-accent-primary-rgb),0.2)] bg-[var(--color-bg-primary)] p-5 md:border-b-0 md:border-r">
            {selectedItem.poster_url ? (
              <div className="flex max-h-[420px] w-full items-center justify-center overflow-hidden rounded-xl bg-[var(--color-bg-secondary)]">
                <img
                  src={selectedItem.poster_url}
                  alt={selectedItem.titulo}
                  className="max-h-[420px] w-auto max-w-full object-contain"
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="flex h-72 w-full items-center justify-center rounded-xl bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)]">
                {noImageLabel}
              </div>
            )}

            {selectedItem.genero && (
              <div className="mt-4 rounded-xl border border-[rgba(var(--color-accent-primary-rgb),0.2)] bg-[var(--color-bg-secondary)] px-4 py-3">
                <p className="theme-heading-font mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                  Genero
                </p>
                <p className="theme-heading-font text-[11px] font-bold uppercase text-[var(--color-text-primary)]">{selectedItem.genero}</p>
              </div>
            )}
          </div>

          <div className="flex flex-col p-5">
            <div className="mb-8 flex-1">
              <p className="theme-heading-font mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                Sinopsis
              </p>
              <div className={`text-sm md:text-base leading-relaxed text-[var(--color-text-primary)] ${isRetroCartoon ? 'theme-heading-font' : ''}`}>
                {synopsisLoading && <p className={isRetroCartoon ? 'theme-heading-font text-[var(--color-text-muted)]' : 'text-[var(--color-text-muted)]'}>{loadingSynopsisLabel}</p>}
                {synopsisError && <p className={isRetroCartoon ? 'theme-heading-font text-[var(--color-accent-secondary)]' : 'text-[var(--color-accent-secondary)]'}>{synopsisError}</p>}
                {!synopsisLoading && !synopsisError && isTranslatingSynopsis && (
                  <div className={`flex items-center gap-2 ${isRetroCartoon ? 'theme-heading-font text-[var(--color-text-muted)]' : 'text-[var(--color-text-muted)]'}`}>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
                    <span>Traduciendo sinopsis...</span>
                  </div>
                )}
                {!synopsisLoading && !synopsisError && !isTranslatingSynopsis && (
                  <p className={isRetroCartoon ? 'theme-heading-font' : ''}>
                    {displaySynopsis || emptySynopsisLabel}
                  </p>
                )}
              </div>
            </div>

            {selectedItem.visto && (
              <div className="mb-6">
                <ItemCommentBox
                  itemId={selectedItem.id}
                  itemContext={{
                    title: selectedItem.titulo,
                    type: selectedItem.tipo,
                    genre: selectedItem.genero,
                    synopsis,
                  }}
                />
              </div>
            )}

            <div className="mb-6">
              <button
                type="button"
                onClick={handleToggleClick}
                disabled={modalActionLoading !== null || showQuickCritique}
                className={`theme-heading-font flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm md:text-base font-bold uppercase tracking-[0.14em] transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                  isRetroCartoon
                    ? 'border-[3px] border-black bg-[var(--color-bg-primary)] text-black shadow-[5px_5px_0px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[4px_4px_0px_0px_#000000] active:translate-x-[5px] active:translate-y-[5px] active:shadow-none'
                    : isTerminal
                      ? selectedItem.visto
                        ? 'terminal-button theme-heading-font rounded-md'
                        : 'terminal-button terminal-button--danger theme-heading-font rounded-md'
                    : isCyberpunk
                      ? 'cyberpunk-button theme-heading-font'
                    : selectedItem.visto
                      ? 'border-[rgba(var(--color-accent-primary-rgb),0.45)] bg-[rgba(var(--color-accent-primary-rgb),0.12)] text-[var(--color-accent-primary)] hover:border-[rgba(var(--color-accent-primary-rgb),0.65)] hover:bg-[rgba(var(--color-accent-primary-rgb),0.18)] shadow-lg'
                      : 'border-[rgba(var(--color-accent-secondary-rgb),0.45)] bg-[rgba(var(--color-accent-secondary-rgb),0.12)] text-[var(--color-accent-secondary)] hover:border-[rgba(var(--color-accent-secondary-rgb),0.65)] hover:bg-[rgba(var(--color-accent-secondary-rgb),0.18)] shadow-lg'
                }`}
              >
                <span>
                  {modalActionLoading === 'toggle'
                    ? 'Actualizando...'
                    : showQuickCritique
                      ? isRetroCartoon
                        ? 'CIERRA LA CRITICA O COMPLETA'
                        : 'Completa la crítica rápida o ciérrala'
                      : selectedItem.visto
                        ? markUnwatchedLabel
                        : markWatchedLabel}
                </span>
              </button>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={handleRequestClose}
                className={`theme-heading-font rounded-xl border px-4 py-3 text-sm font-bold transition ${
                  isRetroCartoon
                    ? retroFloatingButton
                    : isTerminal
                      ? 'terminal-button rounded-md'
                      : isCyberpunk
                        ? 'cyberpunk-button cyberpunk-button--ghost theme-heading-font'
                      : 'border-[rgba(var(--color-accent-primary-rgb),0.3)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] hover:border-[rgba(var(--color-accent-primary-rgb),0.5)]'
                }`}
                disabled={isQuickCritiqueSaving}
              >
                Cerrar
              </button>

              {canDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={modalActionLoading !== null}
                  className={`theme-heading-font rounded-xl border px-4 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    isRetroCartoon
                      ? retroFloatingButton
                      : isTerminal
                        ? 'terminal-button terminal-button--danger rounded-md'
                        : isCyberpunk
                          ? 'cyberpunk-button cyberpunk-button--danger theme-heading-font'
                        : 'border-red-500/40 bg-red-500/12 text-red-300 hover:border-red-400 hover:bg-red-500/18 hover:text-red-200'
                  }`}
                >
                  {modalActionLoading === 'delete' ? 'Borrando...' : `DELETE ${deleteLabel}`}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
        document.body,
      )}
      <QuickCritiqueModal
        isOpen={showQuickCritique}
        itemTitle={String(displayTitle)}
        initialStars={existingItemRating?.rating ?? null}
        initialReaction={
          existingItemRating?.liked === true
            ? 'like'
            : existingItemRating?.liked === false
              ? 'dislike'
              : null
        }
        initialComment={existingCommentRow?.content ?? ''}
        enhanceContext={{
          title: selectedItem.titulo,
          type: selectedItem.tipo,
          genre: selectedItem.genero ?? null,
          synopsis: displaySynopsis?.trim() ? displaySynopsis : null,
        }}
        saving={isQuickCritiqueSaving}
        onCancel={() => setShowQuickCritique(false)}
        onConfirm={handleQuickCritiqueConfirm}
      />
    </>
  )
}

export default ItemDetailsModal
