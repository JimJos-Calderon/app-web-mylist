import React from 'react'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff, Trash2, Loader2, Film } from 'lucide-react'
import { ConfirmDialog, HudContainer, ListItem, OptimizedImage, TechLabel, useTheme } from '@/features/shared'
import { useUsername } from '@/features/profile'
import RatingWidget from './RatingWidget'

interface ItemCardProps {
  item: ListItem
  isOwn: boolean
  onDelete: (id: string) => Promise<void>
  onToggleVisto: (id: string, currentState: boolean) => Promise<void>
  onOpenDetails: (item: ListItem) => void
  disableVistoEffect?: boolean
  compactWatchedToggle?: boolean
}

const ItemCard: React.FC<ItemCardProps> = ({
  item,
  isOwn,
  onDelete,
  onToggleVisto,
  onOpenDetails,
  disableVistoEffect = false,
  compactWatchedToggle = false,
}) => {
  const { t } = useTranslation()
  const [deleting, setDeleting] = React.useState(false)
  const [togglingWatched, setTogglingWatched] = React.useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false)
  const { username } = useUsername(item.user_id)
  const { theme } = useTheme()
  const isRetroCartoon = theme === 'retro-cartoon'

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

  let statusText = ''
  if (isRated) {
    statusText = t('stats.rated', 'RATED')
  } else if (item.visto) {
    statusText = t('item.watched', 'WATCHED')
  } else {
    statusText = t('item.not_watched', 'PENDING')
  }

  const statusLabel = `STATUS: ${statusText}`.toUpperCase()
  const ownerLabel = isOwn ? t('own_item') : username || item.user_email?.split('@')[0] || 'Usuario'
  const progressActionLabel = item.visto ? t('item.mark_unwatched') : t('item.mark_watched')
  const showCompactToggle = compactWatchedToggle && item.visto

  return (
    <>
      <HudContainer
        role="article"
        className={`group flex h-full flex-col transition-all duration-300 hover:z-10 ${
          item.visto && !disableVistoEffect
            ? 'opacity-[0.65] saturate-50 hover:opacity-100 hover:saturate-100'
            : 'ring-1 ring-inset ring-white/5 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/50 hover:ring-white/10'
        } ${
          isOwn ? 'hud-item-card--owner' : 'hud-item-card--shared'
        } ${
          isRetroCartoon ? 'item-card-retro-ink border-[3px] border-black shadow-[5px_5px_0px_0px_#000000] rounded-xl' : ''
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
                  <div className={`hud-item-poster-text text-[10px] font-black uppercase ${isRetroCartoon ? 'theme-heading-font' : ''}`}>
                    {item.tipo === 'pelicula' ? t('movies.title') : t('series.title')}
                  </div>
                </div>
              </div>
            )}


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
                  <span className="block w-full text-center font-semibold">{item.genero}</span>
                </>
              )}
            </div>



            <div className="hud-item-rating-divider mt-4 pt-3">
              <RatingWidget itemId={item.id} onlyOwn={true} tone={isOwn ? 'owner' : 'shared'} />
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                onOpenDetails(item)
              }}
                className={`flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white transition hover:border-slate-500 hover:bg-slate-700/50 ${isRetroCartoon ? 'theme-heading-font' : ''}`}
            >
              Ver detalle
            </button>

            <div className={`grid gap-2 ${isOwn ? 'grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto]' : 'grid-cols-1'}`}>
              {showCompactToggle ? (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    handleToggle()
                  }}
                  disabled={togglingWatched}
                  className={`flex w-full items-center justify-center rounded-xl border border-cyan-400/35 bg-cyan-400/10 px-3 py-2 text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-400/18 disabled:cursor-not-allowed disabled:opacity-60 ${isRetroCartoon ? 'theme-heading-font' : ''}`}
                  aria-label={progressActionLabel}
                  title={progressActionLabel}
                >
                  {togglingWatched ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    handleToggle()
                  }}
                  disabled={togglingWatched}
                  className={`flex min-w-0 w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] transition-all disabled:cursor-not-allowed disabled:opacity-60 ${isRetroCartoon ? 'theme-heading-font ' : ''}${
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
                  <span className="min-w-0 truncate">{progressActionLabel}</span>
                </button>
              )}

              {isOwn && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    setShowConfirmDialog(true)
                  }}
                  disabled={deleting}
                  className="flex items-center justify-center rounded-xl border border-red-500/35 bg-red-500/10 px-3 py-2 text-red-300 transition hover:border-red-400 hover:bg-red-500/15 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                  title={t('buttons.delete')}
                  aria-label={`${t('buttons.delete')} ${item.titulo}`}
                >
                  {deleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  )}
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
