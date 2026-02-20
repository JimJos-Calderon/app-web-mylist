import React, { useState } from 'react'
import { useItemRating } from '@/hooks/useItemRating'

interface RatingWidgetProps {
  itemId: string
  onlyOwn?: boolean
}

const RatingWidget: React.FC<RatingWidgetProps> = ({ itemId, onlyOwn = true }) => {
  const { rating, loading, error, updateRating, updateLike } = useItemRating(itemId)
  const [showRatingMenu, setShowRatingMenu] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

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
      <div className="flex items-center gap-2 opacity-50">
        <div className="animate-pulse h-5 w-12 bg-zinc-700 rounded" />
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
          className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={currentRating ? `Calificación: ${currentRating}/5` : 'Calificar'}
        >
          <span className="text-lg">⭐</span>
          {currentRating && <span className="text-xs font-semibold text-yellow-400">{currentRating}</span>}
        </button>

        {/* Rating Menu */}
        {showRatingMenu && (
          <div className="absolute bottom-full left-0 mb-2 bg-black/95 border border-zinc-700 rounded-lg p-3 shadow-lg z-50">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleStarClick(star)
                  }}
                  disabled={isUpdating}
                  className="text-2xl hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                  title={`${star} estrella${star > 1 ? 's' : ''}`}
                >
                  {star <= (currentRating || 0) ? '⭐' : '☆'}
                </button>
              ))}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleStarClick(0)
              }}
              disabled={isUpdating}
              className="text-xs mt-2 w-full px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors disabled:opacity-50"
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
          className={`px-2 py-1 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            currentLike === true
              ? 'bg-green-500/30 text-green-400 border border-green-500/50'
              : 'hover:bg-zinc-800 text-zinc-400'
          }`}
          title="Me gusta"
        >
          <span className="text-lg">👍</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation()
            handleLikeClick(false)
          }}
          disabled={isUpdating}
          className={`px-2 py-1 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            currentLike === false
              ? 'bg-red-500/30 text-red-400 border border-red-500/50'
              : 'hover:bg-zinc-800 text-zinc-400'
          }`}
          title="No me gusta"
        >
          <span className="text-lg">👎</span>
        </button>
      </div>

      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  )
}

export default RatingWidget
