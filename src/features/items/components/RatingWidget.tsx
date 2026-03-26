import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Heart, HeartOff, Star } from 'lucide-react'
import { useTheme } from '@/features/shared'
import { useItemRating } from '../hooks/useItemRating'

interface RatingWidgetProps {
  itemId: string
  onlyOwn?: boolean
  tone?: 'owner' | 'shared'
}

const RatingWidget: React.FC<RatingWidgetProps> = ({ itemId, onlyOwn = true, tone = 'owner' }) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const isRetroCartoon = theme === 'retro-cartoon'
  const { rating, loading, error, updateRating, updateLike } = useItemRating(itemId)
  const [showRatingMenu, setShowRatingMenu] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const toneClass = tone === 'owner' ? 'owner' : 'shared'
  const toneAccentClass = toneClass === 'owner' ? 'text-accent-primary' : 'text-accent-secondary'

  const handleStarClick = async (stars: number) => {
    setIsUpdating(true)
    try {
      await updateRating(stars)
      setShowRatingMenu(false)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleLikeClick = async (isLike: boolean) => {
    setIsUpdating(true)
    try {
      // Toggle: if already liked, set to null (remove like)
      const newValue = rating?.liked === isLike ? null : isLike
      await updateLike(newValue)
    } finally {
      setIsUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className={`hud-rating-skeleton hud-rating-skeleton--${toneClass}`} aria-hidden="true">
        <div className="hud-rating-skeleton-chip" />
        <div className="hud-rating-skeleton-dot" />
        <div className="hud-rating-skeleton-dot" />
      </div>
    )
  }

  const currentRating = rating?.rating
  const currentLike = rating?.liked

  return (
    <div className="flex items-center gap-3 py-2" onClick={(e) => e.stopPropagation()}>
      {/* Stars Rating */}
      <div className="relative group">
        <button
          onClick={(e) => {
            e.stopPropagation()
            setShowRatingMenu(!showRatingMenu)
          }}
          disabled={isUpdating}
          className={`flex items-center gap-1 px-2 py-1 transition-colors hud-rating-trigger hud-rating-trigger--${toneClass} disabled:opacity-50 disabled:cursor-not-allowed`}
          title={currentRating ? `Calificación: ${currentRating}/5` : 'Calificar'}
          aria-label={currentRating ? `Calificación: ${currentRating} de 5. Cambiar` : 'Calificar'}
          aria-expanded={showRatingMenu}
        >
          <Star className={`w-4 h-4 ${toneAccentClass}`} fill={currentRating ? 'currentColor' : 'none'} aria-hidden="true" />
          {currentRating && <span className={`text-xs font-semibold ${toneAccentClass}`}>{currentRating}</span>}
        </button>

        {/* Rating Menu */}
        {showRatingMenu && (
          <div className={`absolute bottom-full left-0 mb-2 rounded-lg p-3 z-50 ${
            isRetroCartoon
              ? 'bg-white border-[3px] border-black shadow-[4px_4px_0px_0px_#000000] rounded-xl text-black'
              : `hud-rating-menu hud-rating-menu--${toneClass}`
          }`}>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleStarClick(star)
                  }}
                  disabled={isUpdating}
                  className={`transition-transform disabled:opacity-50 disabled:cursor-not-allowed ${
                    isRetroCartoon
                      ? 'text-black hover:scale-110'
                      : `hud-star-button hud-star-button--${toneClass}`
                  }`}
                  title={`${star} estrella${star > 1 ? 's' : ''}`}
                  aria-label={`${star} estrella${star > 1 ? 's' : ''}`}
                >
                  <Star className="w-6 h-6" fill={star <= (currentRating || 0) ? 'currentColor' : 'none'} aria-hidden="true" />
                </button>
              ))}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleStarClick(0)
              }}
              disabled={isUpdating}
              className={`mt-2 w-full px-2 py-1 transition-colors disabled:opacity-50 ${
                isRetroCartoon
                  ? 'text-black font-bold uppercase text-xs hover:underline'
                  : `text-xs hud-clear-button hud-clear-button--${toneClass}`
              }`}
            >
              Limpiar
            </button>
          </div>
        )}
      </div>

      {/* Like/Dislike Buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleLikeClick(true)
          }}
          disabled={isUpdating}
          className={`px-2 py-1 transition-all hud-reaction-button hud-reaction-button--${toneClass} disabled:opacity-50 disabled:cursor-not-allowed ${
            currentLike === true
              ? 'hud-reaction-button--like-active'
              : ''
          }`}
          title={t('buttons.like')}
          aria-label={t('buttons.like')}
          aria-pressed={currentLike === true}
        >
          <Heart className="w-5 h-5" fill={currentLike === true ? 'currentColor' : 'none'} aria-hidden="true" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation()
            handleLikeClick(false)
          }}
          disabled={isUpdating}
          className={`px-2 py-1 transition-all hud-reaction-button hud-reaction-button--${toneClass} disabled:opacity-50 disabled:cursor-not-allowed ${
            currentLike === false
              ? 'hud-reaction-button--dislike-active'
              : ''
          }`}
          title={t('buttons.dislike')}
          aria-label={t('buttons.dislike')}
          aria-pressed={currentLike === false}
        >
          <HeartOff className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {error && <span className="text-xs hud-rating-error">{error}</span>}
    </div>
  )
}

export default RatingWidget
