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
    try {
      await onToggleVisto(item.id, item.visto)
    } catch (err) {
      console.error('Toggle error:', err)
    }
  }

  const isRated = (item.rating ?? 0) > 0
  const statusLabel = isRated ? 'STATUS: RATED' : 'STATUS: PENDING'

  return (
    <HudContainer
      role="button"
      tabIndex={0}
      onClick={() => onOpenDetails(item)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOpenDetails(item)
        }
      }}
      className={`group flex flex-col transition-all duration-500 cursor-pointer ${
        item.visto && !disableVistoEffect
          ? 'opacity-30 scale-95'
          : isOwn
            ? 'hud-item-card--owner hover:-translate-y-2'
            : 'hud-item-card--shared hover:-translate-y-2'
      }`}
      contentClassName="relative flex h-full flex-col"
    >
      {/* Image */}
      <div className="relative aspect-[2/3] w-full overflow-hidden">
        <TechLabel
          text={statusLabel}
          tone={isRated ? 'secondary' : 'primary'}
          blink={!isRated}
          className="absolute top-3 left-3 z-10"
        />

        {item.poster_url ? (
          <OptimizedImage
            src={item.poster_url}
            alt={item.titulo}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full hud-item-poster-fallback flex items-center justify-center text-center px-4">
            <div>
              <Film className="w-12 h-12 mx-auto mb-2 hud-item-poster-icon" />
              <div className="text-[10px] font-black uppercase hud-item-poster-text">
                {item.tipo === 'pelicula' ? t('movies.title') : t('series.title')}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-5 flex flex-col flex-1 justify-between">
        <div>
          <h3
            className={`text-[15px] font-black italic tracking-tighter leading-tight mb-3 uppercase break-words line-clamp-3 ${
              item.visto ? 'text-muted line-through' : 'text-[var(--color-text-primary)]'
            }`}
          >
            {item.titulo}
          </h3>
          <div
            className={`hud-item-meta ${isOwn ? 'hud-item-meta--owner' : 'hud-item-meta--shared'}`}
          >
            {isOwn ? t('own_item') : (username || item.user_email?.split('@')[0] || 'Usuario')}
            {item.genero && (
              <>
                <span className="mx-1.5">•</span>
                <span className="font-semibold">{item.genero}</span>
              </>
            )}
          </div>

          {/* Rating Widget */}
          <div className="mt-4 pt-3 hud-item-rating-divider">
            <RatingWidget itemId={item.id} onlyOwn={true} tone={isOwn ? 'owner' : 'shared'} />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(event) => {
              event.stopPropagation()
              handleToggle()
            }}
            className={`p-2 transition-all hud-item-action ${
              item.visto
                ? 'hud-item-action--active'
                : 'hud-item-action--idle'
            }`}
            title={item.visto ? t('item.mark_unwatched') : t('item.mark_watched')}
            aria-label={item.visto ? t('item.mark_unwatched') : t('item.mark_watched')}
          >
            {item.visto ? (
              <Eye className="h-4 w-4" aria-hidden="true" />
            ) : (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            )}
          </button>

          <button
            onClick={(event) => {
              event.stopPropagation()
              setShowConfirmDialog(true)
            }}
            disabled={deleting}
            className="p-2 transition-all hud-item-action hud-item-action--danger disabled:opacity-50 disabled:cursor-not-allowed"
            title={t('buttons.delete')}
            aria-label={`${t('buttons.delete')} ${item.titulo}`}
          >
            {deleting ? (
              <Loader2 className="animate-spin h-4 w-4" aria-hidden="true" />
            ) : (
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        title={t('buttons.delete')}
        message={t('item.delete_confirm')}
        confirmText={t('buttons.delete')}
        cancelText={t('buttons.cancel')}
        onConfirm={handleDelete}
        onCancel={() => setShowConfirmDialog(false)}
      />
    </HudContainer>
  )
}

export default ItemCard
