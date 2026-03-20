import React from 'react'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff, Trash2, Loader2, Film } from 'lucide-react'
import { ConfirmDialog, HudContainer, ListItem, OptimizedImage, TechLabel } from '@/features/shared'
import { useUsername } from '@/features/profile'
import RatingWidget from './RatingWidget'

interface ItemCardProps {
  item: ListItem
  isOwn: boolean
  onDelete: (id: string) => Promise<void>
  onToggleVisto: (id: string, currentState: boolean) => Promise<void>
  onOpenDetails: (item: ListItem) => void
  disableVistoEffect?: boolean
}

const ItemCard: React.FC<ItemCardProps> = ({
  item,
  isOwn,
  onDelete,
  onToggleVisto,
  onOpenDetails,
  disableVistoEffect = false,
}) => {
  const { t } = useTranslation()
  const [deleting, setDeleting] = React.useState(false)
  const [togglingWatched, setTogglingWatched] = React.useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false)
  const { username } = useUsername(item.user_id)

  const handleDelete = async () => {
    setDeleting(true)
    setShowConfirmDialog(false)

    try {
      await onDelete(item.id)
    } catch (err) {
      console.error('Delete error:', err)
    } finally {
      setDeleting(false)
    }
  }

  const handleToggle = async () => {
    if (togglingWatched) return

    setTogglingWatched(true)

    try {
      await onToggleVisto(item.id, item.visto)
    } catch (err) {
      console.error('Toggle error:', err)
    } finally {
      setTogglingWatched(false)
    }
  }

  const isRated = (item.rating ?? 0) > 0
  const statusLabel = isRated ? 'STATUS: RATED' : 'STATUS: PENDING'
  const ownerLabel = isOwn ? t('own_item') : username || item.user_email?.split('@')[0] || 'Usuario'
  const progressLabel = item.visto ? t('item.watched') : t('item.not_watched')
  const progressActionLabel = item.visto ? t('item.mark_unwatched') : t('item.mark_watched')

  return (
    <>
      <HudContainer
        role="article"
        className={`group flex h-full flex-col transition-all duration-500 ${
          item.visto && !disableVistoEffect
            ? 'opacity-55'
            : isOwn
              ? 'hud-item-card--owner'
              : 'hud-item-card--shared'
        }`}
        contentClassName="relative flex h-full flex-col"
      >
        <button
          type="button"
          onClick={() => onOpenDetails(item)}
          className="block text-left focus:outline-none"
          aria-label={`${t('details_title')} ${item.titulo}`}
        >
          <div className="relative aspect-[2/3] w-full overflow-hidden">
            <TechLabel
              text={statusLabel}
              tone={isRated ? 'secondary' : 'primary'}
              blink={!isRated}
              className="absolute left-3 top-3 z-10"
            />

            <div className="absolute right-3 top-3 z-10">
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${
                  item.visto
                    ? 'border-cyan-400/40 bg-cyan-400/15 text-cyan-200'
                    : 'border-slate-400/30 bg-black/40 text-slate-200'
                }`}
              >
                {item.visto ? 'VISTO' : 'PENDIENTE'}
              </span>
            </div>

            {item.poster_url ? (
              <OptimizedImage
                src={item.poster_url}
                alt={item.titulo}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="hud-item-poster-fallback flex h-full w-full items-center justify-center px-4 text-center">
                <div>
                  <Film className="hud-item-poster-icon mx-auto mb-2 h-12 w-12" />
                  <div className="hud-item-poster-text text-[10px] font-black uppercase">
                    {item.tipo === 'pelicula' ? t('movies.title') : t('series.title')}
                  </div>
                </div>
              </div>
            )}

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          </div>
        </button>

        <div className="flex flex-1 flex-col justify-between p-5">
          <div>
            <button
              type="button"
              onClick={() => onOpenDetails(item)}
              className="block w-full text-left"
              aria-label={`${t('details_title')} ${item.titulo}`}
            >
              <h3
                className={`mb-3 line-clamp-3 break-words text-[15px] font-black uppercase italic leading-tight tracking-tighter ${
                  item.visto ? 'text-muted' : 'text-[var(--color-text-primary)]'
                }`}
              >
                {item.titulo}
              </h3>
            </button>

            <div className={`hud-item-meta ${isOwn ? 'hud-item-meta--owner' : 'hud-item-meta--shared'}`}>
              {ownerLabel}
              {item.genero && (
                <>
                  <span className="mx-1.5">•</span>
                  <span className="font-semibold">{item.genero}</span>
                </>
              )}
            </div>

            <div className="mt-3 flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${
                  item.visto
                    ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200'
                    : 'border-amber-400/30 bg-amber-400/10 text-amber-200'
                }`}
              >
                {progressLabel}
              </span>
            </div>

            <div className="hud-item-rating-divider mt-4 pt-3">
              <RatingWidget itemId={item.id} onlyOwn={true} tone={isOwn ? 'owner' : 'shared'} />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                handleToggle()
              }}
              disabled={togglingWatched}
              className={`flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold uppercase tracking-[0.14em] transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                item.visto
                  ? 'border-cyan-400/40 bg-cyan-400/12 text-cyan-200 hover:border-cyan-300 hover:bg-cyan-400/18'
                  : 'border-purple-400/40 bg-purple-400/12 text-purple-200 hover:border-purple-300 hover:bg-purple-400/18'
              }`}
              aria-label={progressActionLabel}
              title={progressActionLabel}
            >
              {togglingWatched ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : item.visto ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}

              <span>{progressActionLabel}</span>
            </button>

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  onOpenDetails(item)
                }}
                className="rounded-lg border border-slate-700 bg-black/30 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300 transition hover:border-slate-500 hover:text-white"
              >
                Ver detalle
              </button>

              {isOwn && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    setShowConfirmDialog(true)
                  }}
                  disabled={deleting}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-500/35 bg-red-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-red-300 transition hover:border-red-400 hover:bg-red-500/15 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                  title={t('buttons.delete')}
                  aria-label={`${t('buttons.delete')} ${item.titulo}`}
                >
                  {deleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span>{t('buttons.delete')}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </HudContainer>

      <ConfirmDialog
        isOpen={showConfirmDialog}
        title={t('buttons.delete')}
        message={t('item.delete_confirm')}
        confirmText={t('buttons.delete')}
        cancelText={t('buttons.cancel')}
        onConfirm={handleDelete}
        onCancel={() => setShowConfirmDialog(false)}
      />
    </>
  )
}

export default ItemCard