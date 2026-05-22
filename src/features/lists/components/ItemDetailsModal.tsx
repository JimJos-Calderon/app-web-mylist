import React from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import {
  ItemCommentBox,
  ItemWatchProvidersSection,
  QuickCritiqueModal,
  useItemComments,
  useItemRating,
  useTranslateSynopsis,
} from '@/features/items'
import {
  ItemGroupWatchBadge,
  ListItem,
  RetroMeepModalFrame,
  type RetroMeepModalFrameHandle,
  useReducedMotion,
  useTheme,
} from '@/features/shared'
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
  /** Metadatos de lista para “siguiente en cola” (solo dueño). */
  listMeta?: { listId: string; ownerId: string; nextQueueItemId: string | null } | null
  currentUserId?: string | null
  onUpdateItem?: (id: string, updates: Partial<ListItem>) => Promise<void>
  onSetNextQueue?: (itemId: string | null) => Promise<void>
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
  listMeta = null,
  currentUserId = null,
  onUpdateItem,
  onSetNextQueue,
}) => {
  const { t, i18n } = useTranslation()
  const { theme } = useTheme()
  const isRetroCartoon = theme === 'retro-cartoon'
  const isCyberpunk = theme === 'cyberpunk'
  const isTerminal = theme === 'terminal'
  const reducedMotion = useReducedMotion()
  const meep = isRetroCartoon && !reducedMotion
  const frameRef = React.useRef<RetroMeepModalFrameHandle>(null)
  const [showQuickCritique, setShowQuickCritique] = React.useState(false)
  const [tagsDraft, setTagsDraft] = React.useState('')
  const [tagsSaving, setTagsSaving] = React.useState(false)
  const [queueSaving, setQueueSaving] = React.useState(false)
  const quickCritiqueAutoOpenedRef = React.useRef(false)
  const { deleteComment, comment: existingCommentRow } = useItemComments(selectedItem?.id)
  const { rating: existingItemRating } = useItemRating(selectedItem?.id ?? '')
  const selectedItemId = selectedItem?.id
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

  React.useEffect(() => {
    if (!isOpen || !selectedItemId) {
      quickCritiqueAutoOpenedRef.current = false
      setShowQuickCritique(false)
      return
    }
    if (promptCommentOnOpen && selectedItem && !selectedItem.visto && !quickCritiqueAutoOpenedRef.current) {
      setShowQuickCritique(true)
      quickCritiqueAutoOpenedRef.current = true
    }
  }, [isOpen, selectedItemId, promptCommentOnOpen, selectedItem])

  React.useEffect(() => {
    if (!selectedItem) {
      setTagsDraft('')
      return
    }
    setTagsDraft((selectedItem.tags ?? []).join(', '))
  }, [selectedItem?.id, selectedItem?.tags, selectedItem])

  const handleSaveTags = async () => {
    if (!selectedItem || !onUpdateItem) return
    const tags = tagsDraft
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
    const unique = [...new Set(tags)]
    setTagsSaving(true)
    try {
      await onUpdateItem(selectedItem.id, { tags: unique })
    } finally {
      setTagsSaving(false)
    }
  }

  const handleSetNextQueue = async (itemId: string | null) => {
    if (!onSetNextQueue) return
    setQueueSaving(true)
    try {
      await onSetNextQueue(itemId)
    } finally {
      setQueueSaving(false)
    }
  }

  const handleBeforeCloseModal = React.useCallback(() => {
    if (isQuickCritiqueSaving) return false
    if (showQuickCritique) {
      setShowQuickCritique(false)
      return false
    }
    return true
  }, [isQuickCritiqueSaving, showQuickCritique])

  const handleRequestClose = React.useCallback(() => {
    frameRef.current?.tryBeginClose()
  }, [])

  const handleToggleClick = async () => {
    if (!selectedItem || modalActionLoading !== null) return

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

  const panelMotionClass = meep
    ? ''
    : `transition-all duration-200 ${isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`

  const panelShellClass = `item-details-modal ${isRetroCartoon ? 'retro-fx ' : ''}w-full max-w-4xl max-h-[90vh] overflow-y-auto text-[var(--color-text-primary)] ${panelMotionClass} ${
    isRetroCartoon
      ? ''
      : 'border bg-[var(--color-bg-secondary)] ' +
        (isTerminal
          ? 'terminal-surface rounded-md'
          : isCyberpunk
            ? 'cyberpunk-surface'
            : 'rounded-2xl border-[rgba(var(--color-accent-primary-rgb),0.25)] shadow-2xl')
  }`

  return (
    <>
      {createPortal(
        <RetroMeepModalFrame
          ref={frameRef}
          meep={meep}
          variant="stacked"
          onRequestClose={onClose}
          onBeforeClose={handleBeforeCloseModal}
          rootClassName={
            meep
              ? 'fixed inset-0 z-[100] overflow-hidden'
              : 'fixed inset-0 z-[100] flex items-center justify-center p-4'
          }
          stackedFillClassName={meep ? undefined : 'bg-black/60 backdrop-blur-sm'}
          panelClassName={panelShellClass}
          role="dialog"
          aria-modal="true"
          aria-label={`${titlePrefix} ${selectedItem.titulo}`}
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
          className={`flex items-start justify-between gap-4 ${
            isRetroCartoon
              ? 'item-details-modal__header'
              : 'border-b border-[rgba(var(--color-accent-primary-rgb),0.2)] p-5'
          }`}
        >
          <div>
            <h3
              className={`theme-heading-font text-xl md:text-2xl font-black tracking-wide uppercase text-[var(--color-text-primary)] ${
                isRetroCartoon ? 'item-details-modal__title' : ''
              }`}
            >
              {displayTitle}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={
                  isRetroCartoon
                    ? 'item-details-modal__tag item-details-modal__tag--type'
                    : 'theme-heading-font rounded-full border border-[rgba(var(--color-accent-primary-rgb),0.4)] bg-transparent px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-text-primary)]'
                }
              >
                {selectedItem.tipo === 'pelicula' ? movieTypeLabel : seriesTypeLabel}
              </span>
              <span
                className={
                  isRetroCartoon
                    ? `item-details-modal__tag ${selectedItem.visto ? 'item-details-modal__tag--watched' : 'item-details-modal__tag--unwatched'}`
                    : `theme-heading-font rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${
                        selectedItem.visto
                          ? 'border-[rgba(var(--color-accent-primary-rgb),0.45)] bg-transparent text-[var(--color-accent-primary)]'
                          : 'border-[rgba(var(--color-accent-secondary-rgb),0.45)] bg-transparent text-[var(--color-accent-secondary)]'
                      }`
                }
              >
                {selectedItem.visto ? watchedLabel : notWatchedLabel}
              </span>
            </div>
            {selectedItem.watch_group && selectedItem.watch_group.total > 1 && (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <p
                  className={
                    isRetroCartoon
                      ? 'theme-heading-font text-[10px] font-black uppercase tracking-[0.14em] text-[var(--color-text-muted)]'
                      : 'font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-text-muted)]'
                  }
                >
                  {t('item.watch_group_caption')}
                </p>
                <ItemGroupWatchBadge
                  watched={selectedItem.watch_group.watched}
                  total={selectedItem.watch_group.total}
                  ratioLabel={t('item.watch_group_ratio', {
                    watched: selectedItem.watch_group.watched,
                    total: selectedItem.watch_group.total,
                  })}
                  title={t('item.watch_group_title', {
                    watched: selectedItem.watch_group.watched,
                    total: selectedItem.watch_group.total,
                  })}
                  density="comfortable"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onPrevious && (
              <button
                type="button"
                onClick={onPrevious}
                className={
                  isRetroCartoon
                    ? 'item-details-modal__nav-btn item-details-modal__nav-btn--prev'
                    : `flex h-9 w-9 items-center justify-center rounded-lg transition ${
                        isTerminal
                          ? 'terminal-button theme-heading-font rounded-md'
                          : isCyberpunk
                            ? 'cyberpunk-button cyberpunk-button--ghost theme-heading-font'
                            : 'border border-[rgba(var(--color-accent-primary-rgb),0.3)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] hover:border-[rgba(var(--color-accent-primary-rgb),0.5)]'
                      }`
                }
                aria-label="Anterior"
              >
                {'<'}
              </button>
            )}
            {onNext && (
              <button
                type="button"
                onClick={onNext}
                className={
                  isRetroCartoon
                    ? 'item-details-modal__nav-btn item-details-modal__nav-btn--next'
                    : `flex h-9 w-9 items-center justify-center rounded-lg transition ${
                        isTerminal
                          ? 'terminal-button theme-heading-font rounded-md'
                          : isCyberpunk
                            ? 'cyberpunk-button cyberpunk-button--ghost theme-heading-font'
                            : 'border border-[rgba(var(--color-accent-primary-rgb),0.3)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] hover:border-[rgba(var(--color-accent-primary-rgb),0.5)]'
                      }`
                }
                aria-label="Siguiente"
              >
                {'>'}
              </button>
            )}
            <div
              className={
                isRetroCartoon
                  ? 'item-details-modal__nav-divider mx-1'
                  : 'mx-1 h-6 w-px bg-[rgba(var(--color-accent-primary-rgb),0.25)]'
              }
            />
            <button
              ref={closeButtonRef}
              type="button"
              onClick={handleRequestClose}
              className={
                isRetroCartoon
                  ? 'item-details-modal__nav-btn item-details-modal__nav-btn--close'
                  : `flex h-9 w-9 items-center justify-center rounded-lg transition ${
                      isTerminal
                        ? 'terminal-button theme-heading-font rounded-md'
                        : isCyberpunk
                          ? 'cyberpunk-button cyberpunk-button--ghost theme-heading-font'
                          : 'border border-[rgba(var(--color-accent-primary-rgb),0.3)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] hover:border-[rgba(var(--color-accent-primary-rgb),0.5)]'
                    }`
              }
              aria-label={closeLabel}
              disabled={isQuickCritiqueSaving}
            >
              X
            </button>
          </div>
        </div>

        <div className="grid gap-0 md:grid-cols-[320px_minmax(0,1fr)]">
          <div
            className={
              isRetroCartoon
                ? 'item-details-modal__media-col p-5'
                : 'border-b border-[rgba(var(--color-accent-primary-rgb),0.2)] bg-[var(--color-bg-primary)] p-5 md:border-b-0 md:border-r'
            }
          >
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
              <div
                className={
                  isRetroCartoon
                    ? 'item-details-modal__genre-panel mt-4 px-4 py-3'
                    : 'mt-4 rounded-xl border border-[rgba(var(--color-accent-primary-rgb),0.2)] bg-[var(--color-bg-secondary)] px-4 py-3'
                }
              >
                <p
                  className={
                    isRetroCartoon
                      ? 'item-details-modal__section-label mb-1'
                      : 'theme-heading-font mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-text-muted)]'
                  }
                >
                  Genero
                </p>
                <p className="theme-heading-font text-[11px] font-bold uppercase text-[var(--color-text-primary)]">
                  {selectedItem.genero}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col p-5">
            <div className="mb-4 flex-1">
              <p
                className={
                  isRetroCartoon
                    ? 'item-details-modal__section-label mb-3'
                    : 'theme-heading-font mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-text-muted)]'
                }
              >
                Sinopsis
              </p>
              <div
                className={`text-sm md:text-base leading-relaxed text-[var(--color-text-primary)] ${
                  isRetroCartoon ? 'item-details-modal__synopsis' : ''
                }`}
              >
                {synopsisLoading && (
                  <p className={isRetroCartoon ? 'theme-body-font text-[var(--color-text-muted)]' : 'text-[var(--color-text-muted)]'}>
                    {loadingSynopsisLabel}
                  </p>
                )}
                {synopsisError && (
                  <p className={isRetroCartoon ? 'theme-body-font text-[var(--color-accent-secondary)]' : 'text-[var(--color-accent-secondary)]'}>
                    {synopsisError}
                  </p>
                )}
                {!synopsisLoading && !synopsisError && isTranslatingSynopsis && (
                  <div
                    className={`flex items-center gap-2 ${
                      isRetroCartoon ? 'theme-body-font text-[var(--color-text-muted)]' : 'text-[var(--color-text-muted)]'
                    }`}
                  >
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
                    <span>Traduciendo sinopsis...</span>
                  </div>
                )}
                {!synopsisLoading && !synopsisError && !isTranslatingSynopsis && (
                  <p className={isRetroCartoon ? 'theme-body-font' : ''}>{displaySynopsis || emptySynopsisLabel}</p>
                )}
              </div>
            </div>

            <ItemWatchProvidersSection
              item={selectedItem}
              isOpen={isOpen}
              uiLanguage={activeLanguage}
              isRetroCartoon={isRetroCartoon}
            />

            {onUpdateItem && selectedItem && (
              <div className="mb-4 rounded-xl border border-[rgba(var(--color-accent-primary-rgb),0.2)] bg-[var(--color-bg-secondary)] p-4">
                <p
                  className={
                    isRetroCartoon
                      ? 'item-details-modal__section-label mb-2'
                      : 'theme-heading-font mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-text-muted)]'
                  }
                >
                  {t('item.tags_label')}
                </p>
                <input
                  type="text"
                  value={tagsDraft}
                  onChange={(e) => setTagsDraft(e.target.value)}
                  className="mb-2 w-full rounded-lg border border-[rgba(var(--color-accent-primary-rgb),0.25)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-[var(--color-text-primary)]"
                  placeholder={t('item.tags_placeholder')}
                />
                <button
                  type="button"
                  disabled={tagsSaving || modalActionLoading !== null}
                  onClick={() => void handleSaveTags()}
                  className={
                    isRetroCartoon
                      ? 'theme-heading-font rounded-md border-2 border-black bg-white px-3 py-1.5 text-xs font-black uppercase shadow-[3px_3px_0_#000] disabled:opacity-50'
                      : 'rounded-lg border border-[rgba(var(--color-accent-primary-rgb),0.35)] bg-[var(--color-bg-elevated)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-primary)] disabled:opacity-50'
                  }
                >
                  {tagsSaving ? t('item.tags_saving') : t('item.tags_save')}
                </button>
              </div>
            )}

            {onSetNextQueue && listMeta && currentUserId && listMeta.ownerId === currentUserId && selectedItem && (
              <div className="mb-4">
                {listMeta.nextQueueItemId === selectedItem.id ? (
                  <button
                    type="button"
                    disabled={queueSaving || modalActionLoading !== null}
                    onClick={() => void handleSetNextQueue(null)}
                    className={
                      isRetroCartoon
                        ? 'theme-heading-font rounded-md border-2 border-black bg-[var(--color-retro-pink)] px-3 py-1.5 text-xs font-black uppercase text-white shadow-[3px_3px_0_#000] disabled:opacity-50'
                        : 'rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-200 disabled:opacity-50'
                    }
                  >
                    {queueSaving ? t('item.next_queue_saving') : t('item.next_queue_clear')}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={queueSaving || modalActionLoading !== null}
                    onClick={() => void handleSetNextQueue(selectedItem.id)}
                    className={
                      isRetroCartoon
                        ? 'theme-heading-font rounded-md border-2 border-black bg-[var(--color-retro-cyan)] px-3 py-1.5 text-xs font-black uppercase text-black shadow-[3px_3px_0_#000] disabled:opacity-50'
                        : 'rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-200 disabled:opacity-50'
                    }
                  >
                    {queueSaving ? t('item.next_queue_saving') : t('item.next_queue_set')}
                  </button>
                )}
              </div>
            )}

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
                className={
                  isRetroCartoon
                    ? `ui-card-action-btn ui-card-action-btn--lg ${selectedItem.visto ? 'ui-card-action-btn--alt' : ''} disabled:cursor-not-allowed`
                    : `theme-heading-font flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm md:text-base font-bold uppercase tracking-[0.14em] transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                        isTerminal
                          ? selectedItem.visto
                            ? 'terminal-button theme-heading-font rounded-md'
                            : 'terminal-button terminal-button--danger theme-heading-font rounded-md'
                          : isCyberpunk
                            ? 'cyberpunk-button theme-heading-font'
                            : selectedItem.visto
                              ? 'border-[rgba(var(--color-accent-primary-rgb),0.45)] bg-[rgba(var(--color-accent-primary-rgb),0.12)] text-[var(--color-accent-primary)] hover:border-[rgba(var(--color-accent-primary-rgb),0.65)] hover:bg-[rgba(var(--color-accent-primary-rgb),0.18)] shadow-lg'
                              : 'border-[rgba(var(--color-accent-secondary-rgb),0.45)] bg-[rgba(var(--color-accent-secondary-rgb),0.12)] text-[var(--color-accent-secondary)] hover:border-[rgba(var(--color-accent-secondary-rgb),0.65)] hover:bg-[rgba(var(--color-accent-secondary-rgb),0.18)] shadow-lg'
                      }`
                }
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
                className={
                  isRetroCartoon
                    ? 'ui-card-action-btn ui-card-action-btn--lg item-details-modal__close-btn w-full sm:w-auto'
                    : `theme-heading-font rounded-xl border px-4 py-3 text-sm font-bold transition ${
                        isTerminal
                          ? 'terminal-button rounded-md'
                          : isCyberpunk
                            ? 'cyberpunk-button cyberpunk-button--ghost theme-heading-font'
                            : 'border-[rgba(var(--color-accent-primary-rgb),0.3)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] hover:border-[rgba(var(--color-accent-primary-rgb),0.5)]'
                      }`
                }
                disabled={isQuickCritiqueSaving}
              >
                Cerrar
              </button>

              {canDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={modalActionLoading !== null}
                  className={
                    isRetroCartoon
                      ? 'item-details-modal__destructive-btn disabled:cursor-not-allowed'
                      : `theme-heading-font rounded-xl border px-4 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                          isTerminal
                            ? 'terminal-button terminal-button--danger rounded-md'
                            : isCyberpunk
                              ? 'cyberpunk-button cyberpunk-button--danger theme-heading-font'
                              : 'border-red-500/40 bg-red-500/12 text-red-300 hover:border-red-400 hover:bg-red-500/18 hover:text-red-200'
                        }`
                  }
                >
                  {modalActionLoading === 'delete' ? 'Borrando...' : `DELETE ${deleteLabel}`}
                </button>
              )}
            </div>
          </div>
        </div>
    </RetroMeepModalFrame>,
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
