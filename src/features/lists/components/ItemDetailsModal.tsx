import React from 'react'
import { ListItem } from '@/features/shared'

interface ItemDetailsModalProps {
  isOpen: boolean
  isAnimating: boolean
  selectedItem: ListItem | null
  synopsis: string | null
  synopsisLoading: boolean
  synopsisError: string | null
  modalActionLoading: 'toggle' | 'delete' | null
  canDelete: boolean
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
  closeButtonRef,
}) => {
  if (!isOpen || !selectedItem) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm transition-opacity duration-200 ${
        isAnimating ? 'bg-black/70 opacity-100' : 'bg-black/0 opacity-0'
      }`}
      role="dialog"
      aria-modal="true"
      aria-label={`${titlePrefix} ${selectedItem.titulo}`}
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation()
          onClose()
        }
      }}
    >
      <div
        className={`w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-700/40 bg-slate-950/95 shadow-2xl transition-all duration-200 ${
          isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
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
                {selectedItem.tipo === 'pelicula' ? movieTypeLabel : seriesTypeLabel}
              </span>
              <span
                className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${
                  selectedItem.visto
                    ? 'border-cyan-400/35 bg-cyan-400/10 text-cyan-200'
                    : 'border-amber-400/35 bg-amber-400/10 text-amber-200'
                }`}
              >
                {selectedItem.visto ? watchedLabel : notWatchedLabel}
              </span>
            </div>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-400 transition hover:border-slate-500 hover:text-white"
            aria-label={closeLabel}
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
                {noImageLabel}
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

          <div className="flex flex-col p-5">
            <div className="mb-5 rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-purple-300">
                Acción principal
              </p>
              <h4 className="mb-3 text-base font-semibold text-white">
                {selectedItem.visto ? 'Ya está marcado como visto' : 'Márcalo cuando lo hayáis visto'}
              </h4>

              <button
                type="button"
                onClick={onToggle}
                disabled={modalActionLoading !== null}
                className={`flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold uppercase tracking-[0.14em] transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                  selectedItem.visto
                    ? 'border-cyan-400/40 bg-cyan-400/12 text-cyan-200 hover:border-cyan-300 hover:bg-cyan-400/18'
                    : 'border-purple-400/40 bg-purple-400/12 text-purple-200 hover:border-purple-300 hover:bg-purple-400/18'
                }`}
              >
                <span>
                  {modalActionLoading === 'toggle'
                    ? 'Actualizando...'
                    : selectedItem.visto
                      ? markUnwatchedLabel
                      : markWatchedLabel}
                </span>
              </button>
            </div>

            <div className="flex-1 rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                Sinopsis
              </p>

              <div className="text-sm leading-relaxed text-slate-200">
                {synopsisLoading && <p className="text-slate-400">{loadingSynopsisLabel}</p>}
                {synopsisError && <p className="text-red-400">{synopsisError}</p>}
                {!synopsisLoading && !synopsisError && <p>{synopsis || emptySynopsisLabel}</p>}
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
              >
                Cerrar
              </button>

              {canDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={modalActionLoading !== null}
                  className="rounded-xl border border-red-500/40 bg-red-500/12 px-4 py-3 text-sm font-semibold text-red-300 transition hover:border-red-400 hover:bg-red-500/18 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {modalActionLoading === 'delete' ? 'Borrando...' : `🗑️ ${deleteLabel}`}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ItemDetailsModal