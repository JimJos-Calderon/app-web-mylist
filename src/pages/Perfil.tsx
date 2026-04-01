import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Cog, UserCircle, Film } from 'lucide-react'
import { useAuth } from '@/features/auth'
import { useUserProfile } from '@/features/profile'
import { ItemCard } from '@/features/items'
import ItemDetailsModal from '@/features/lists/components/ItemDetailsModal'
import { useListItemDetails } from '@/features/lists/hooks/useListItemDetails'
import { ListItem, useTheme } from '@/features/shared'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/supabaseClient'
import HudContainer from '@/features/shared/components/HudContainer'
import TechLabel from '@/features/shared/components/TechLabel'

interface RatingInfo {
  rating: number
  liked: boolean
}

const Perfil: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { profile, loading } = useUserProfile()
  const { theme } = useTheme()
  const isRetroCartoon = theme === 'retro-cartoon'
  const navigate = useNavigate()
  const [ratedItems, setRatedItems] = useState<{ item: ListItem; rating: RatingInfo }[]>([])
  const [isLoadingItems, setIsLoadingItems] = useState(true)
  const [totalRatings, setTotalRatings] = useState(0)
  const [favoriteCount, setFavoriteCount] = useState(0)
  const [likedCount, setLikedCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const fetchRatedItems = useCallback(async () => {
    try {
      setIsLoadingItems(true)
      const { data, error } = await supabase
        .from('item_ratings')
        .select(`
          item_id,
          rating,
          liked,
          items (
            id,
            titulo,
            tipo,
            visto,
            user_id,
            user_email,
            poster_url,
            created_at,
            genero
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const formatted = data
        .filter((r: any) => r.items)
        .map((r: any) => ({
          item: {
            id: r.items.id,
            titulo: r.items.titulo,
            tipo: r.items.tipo,
            visto: r.items.visto,
            user_id: r.items.user_id,
            user_email: r.items.user_email,
            poster_url: r.items.poster_url,
            created_at: r.items.created_at,
            genero: r.items.genero,
            rating: r.rating,
            list_id: '' // Satisfy ListItem typing for global ratings without a specific list context
          },
          rating: {
            rating: r.rating,
            liked: r.liked
          }
        }))

      setRatedItems(formatted)
      setTotalRatings(formatted.length)
      setFavoriteCount(formatted.filter((r: any) => r.rating.rating >= 4).length)
      setLikedCount(formatted.filter((r: any) => r.rating.liked).length)
      setCurrentPage(1)
    } catch (error) {
      console.error('Error fetching rated items:', error)
    } finally {
      setIsLoadingItems(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (user) {
      fetchRatedItems()
    }
  }, [user, fetchRatedItems])

  const handleDelete = async (_id: string) => {
    // No eliminar desde perfil - solo ver
  }

  const handleToggleVisto = async (id: string, currentState: boolean) => {
    const { error } = await supabase
      .from('items')
      .update({ visto: !currentState })
      .eq('id', id)

    if (error) throw error

    setRatedItems((previous) =>
      previous.map((entry) =>
        entry.item.id === id
          ? {
              ...entry,
              item: {
                ...entry.item,
                visto: !currentState,
              },
            }
          : entry
      )
    )
  }

  const handleOpenDetails = async (item: ListItem, options?: { promptComment?: boolean }) => {
    await itemDetails.handleOpenDetails(item, options)
  }

  const itemDetails = useListItemDetails({
    currentUserId: user?.id || '',
    onToggleVisto: handleToggleVisto,
    onDeleteItem: async () => {},
    getDeleteConfirmationMessage: (item) => `Eliminar ${item.titulo}?`,
  })

  const totalPages = Math.max(1, Math.ceil(ratedItems.length / itemsPerPage))
  const paginatedRatedItems = ratedItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  if (loading || isLoadingItems) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-base)] flex items-center justify-center">
        <div className="text-[var(--color-text-primary)] font-mono">{t('profile.loading')}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-primary)] p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Profile Header */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row gap-8 items-start">
            {/* Avatar and Info */}
            <div className="flex flex-col items-center sm:items-start gap-4">
              <div 
                className={`w-32 h-32 aspect-square overflow-hidden flex items-center justify-center flex-shrink-0 ${
                  isRetroCartoon
                    ? 'rounded-lg border-[3px] border-black shadow-[5px_5px_0px_0px_#000000] p-1 bg-white'
                    : 'rounded-full border-4'
                }`}
                style={{ 
                  borderColor: isRetroCartoon ? undefined : 'rgba(var(--color-accent-primary-rgb), 0.5)',
                  background: isRetroCartoon ? undefined : 'radial-gradient(circle, rgba(var(--color-accent-primary-rgb), 0.2) 0%, transparent 70%)'
                }}
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.username}
                    className={`w-full h-full object-cover ${isRetroCartoon ? 'rounded-none' : ''}`}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                ) : (
                  <UserCircle className="w-20 h-20 text-accent-primary opacity-60" />
                )}
              </div>
              
              <div className="text-center sm:text-left">
                <h1 
                  className="text-3xl sm:text-4xl font-black font-mono tracking-tighter"
                  style={{
                    background: 'linear-gradient(to right, var(--color-accent-primary), var(--color-accent-secondary))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 0 10px rgba(var(--color-accent-primary-rgb), 0.3))'
                  }}
                >
                  {profile?.username || 'Usuario'}
                </h1>
                {profile?.bio && (
                  <p className="text-[var(--color-text-muted)] mt-2 max-w-sm">{profile.bio}</p>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex-1 grid grid-cols-3 gap-3 w-full sm:w-auto sm:gap-4">
              <HudContainer className={`flex min-h-[96px] flex-col items-center justify-center p-3 text-center sm:min-h-0 sm:p-4 ${isRetroCartoon ? 'border-[3px] border-black bg-white shadow-[5px_5px_0px_0px_#000000] rounded-lg' : ''}`}>
                <div className={`text-2xl font-black ${isRetroCartoon ? 'text-black' : 'text-[var(--color-text-primary)]'}`}>{totalRatings}</div>
                <div className="mt-1 w-full text-center text-[10px] font-mono uppercase tracking-[0.14em] text-[var(--color-text-muted)] sm:text-xs sm:tracking-widest">{t('stats.rated')}</div>
              </HudContainer>
              <HudContainer className={`flex min-h-[96px] flex-col items-center justify-center p-3 text-center sm:min-h-0 sm:p-4 ${isRetroCartoon ? 'border-[3px] border-black bg-white shadow-[5px_5px_0px_0px_#000000] rounded-lg' : ''}`} style={isRetroCartoon ? undefined : { borderColor: 'rgba(var(--color-accent-primary-rgb), 0.5)' }}>
                <div className={`text-2xl font-black ${isRetroCartoon ? 'text-black' : 'text-accent-primary drop-shadow-[0_0_8px_rgba(var(--color-accent-primary-rgb),0.5)]'}`}>{favoriteCount}</div>
                <div className="mt-1 w-full text-center text-[10px] font-mono uppercase tracking-[0.14em] text-[var(--color-text-muted)] sm:text-xs sm:tracking-widest">{t('stats.favorites')}</div>
              </HudContainer>
              <HudContainer className={`flex min-h-[96px] flex-col items-center justify-center p-3 text-center sm:min-h-0 sm:p-4 ${isRetroCartoon ? 'border-[3px] border-black bg-white shadow-[5px_5px_0px_0px_#000000] rounded-lg' : ''}`} style={isRetroCartoon ? undefined : { borderColor: 'rgba(var(--color-accent-secondary-rgb), 0.5)' }}>
                <div className={`text-2xl font-black ${isRetroCartoon ? 'text-black' : 'text-accent-secondary drop-shadow-[0_0_8px_rgba(var(--color-accent-secondary-rgb),0.5)]'}`}>{likedCount}</div>
                <div className="mt-1 w-full text-center text-[10px] font-mono uppercase tracking-[0.14em] text-[var(--color-text-muted)] sm:text-xs sm:tracking-widest">{t('stats.liked')}</div>
              </HudContainer>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <button
              onClick={() => navigate('/ajustes')}
              className={`px-6 py-3 font-bold transition-all flex items-center justify-center gap-2 ${
                isRetroCartoon
                  ? 'border-[3px] border-black shadow-[5px_5px_0px_0px_#000000] rounded-xl bg-white text-black hover:-translate-y-[2px] hover:shadow-[7px_7px_0px_0px_#000000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none'
                  : 'bg-[rgba(var(--color-accent-primary-rgb),0.05)] backdrop-blur-md border border-[rgba(var(--color-accent-primary-rgb),0.3)] text-accent-primary hover:bg-[rgba(var(--color-accent-primary-rgb),0.1)] hover:border-accent-primary hover:shadow-[0_0_20px_rgba(var(--color-accent-primary-rgb),0.3)]'
              }`}
              style={isRetroCartoon ? { clipPath: 'none' } : undefined}
            >
              <Cog className="w-5 h-5" />
              <span>{t('profile.settings_button')}</span>
            </button>
          </div>
        </div>

        {/* Rated Items Grid */}
        {ratedItems.length > 0 ? (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <TechLabel text="USER.DATA" blink={false} />
              <h2 className="text-xl font-black uppercase tracking-widest text-[var(--color-text-primary)] font-mono">{t('profile.my_ratings')}</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {paginatedRatedItems.map(({ item }) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  isOwn={true}
                  onDelete={handleDelete}
                  onToggleVisto={handleToggleVisto}
                  onOpenDetails={handleOpenDetails}
                  disableVistoEffect={true}
                  compactWatchedToggle={true}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 py-2 overflow-visible flex items-center justify-center gap-1 md:mt-10 md:gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-2 md:px-4 text-xs md:text-sm font-mono font-bold uppercase tracking-widest border transition-all ${
                    isRetroCartoon
                      ? 'relative z-10 m-1 bg-white text-black border-[3px] border-black rounded-md shadow-[3px_3px_0px_0px_#000000] hover:z-20 hover:-translate-y-[2px] hover:shadow-[5px_5px_0px_0px_#000000] active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed'
                      : 'rounded-lg border-[rgba(var(--color-accent-primary-rgb),0.35)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] hover:border-[rgba(var(--color-accent-primary-rgb),0.7)] hover:bg-[rgba(var(--color-accent-primary-rgb),0.12)] disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  Anterior
                </button>

                <div className="scrollbar-none flex max-w-[60vw] gap-1 overflow-x-auto overflow-y-visible md:max-w-none md:gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-[36px] md:min-w-[40px] px-3 py-2 md:px-4 text-xs md:text-sm font-mono font-bold border transition-all ${
                        isRetroCartoon
                          ? currentPage === page
                            ? 'relative z-10 m-1 hover:z-20 bg-black text-white border-[3px] border-black rounded-md shadow-[3px_3px_0px_0px_#000000]'
                            : 'relative z-10 m-1 hover:z-20 bg-white text-black border-[3px] border-black rounded-md shadow-[3px_3px_0px_0px_#000000] hover:-translate-y-[2px] hover:shadow-[5px_5px_0px_0px_#000000] active:translate-x-1 active:translate-y-1 active:shadow-none'
                          : currentPage === page
                            ? 'rounded-lg border-[rgba(var(--color-accent-primary-rgb),0.7)] bg-[rgba(var(--color-accent-primary-rgb),0.15)] text-[var(--color-accent-primary)]'
                            : 'rounded-lg border-[rgba(var(--color-accent-primary-rgb),0.35)] bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] hover:border-[rgba(var(--color-accent-primary-rgb),0.7)] hover:bg-[rgba(var(--color-accent-primary-rgb),0.12)] hover:text-[var(--color-accent-primary)]'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-2 md:px-4 text-xs md:text-sm font-mono font-bold uppercase tracking-widest border transition-all ${
                    isRetroCartoon
                      ? 'relative z-10 m-1 bg-white text-black border-[3px] border-black rounded-md shadow-[3px_3px_0px_0px_#000000] hover:z-20 hover:-translate-y-[2px] hover:shadow-[5px_5px_0px_0px_#000000] active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed'
                      : 'rounded-lg border-[rgba(var(--color-accent-primary-rgb),0.35)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] hover:border-[rgba(var(--color-accent-primary-rgb),0.7)] hover:bg-[rgba(var(--color-accent-primary-rgb),0.12)] disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>
        ) : (
          <HudContainer className="text-center py-20 px-4 border-[rgba(var(--color-accent-primary-rgb),0.2)]">
            <Film className="w-16 h-16 mx-auto mb-4 text-accent-primary opacity-50" />
            <h2 className="text-xl font-bold mb-2 font-mono uppercase tracking-widest text-accent-primary">{t('profile.no_ratings')}</h2>
            <p className="text-[var(--color-text-muted)] mb-6 font-mono text-sm max-w-md mx-auto">
              {'>'} {t('profile.start_rating')}
            </p>
            <button
              onClick={() => navigate('/peliculas')}
              className="px-8 py-3 bg-[rgba(var(--color-accent-primary-rgb),0.1)] border border-accent-primary text-accent-primary font-bold font-mono tracking-widest hover:bg-[rgba(var(--color-accent-primary-rgb),0.2)] hover:shadow-[0_0_30px_rgba(var(--color-accent-primary-rgb),0.4)] transition-all inline-block uppercase"
              style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}
            >
              {t('explore_movies')}
            </button>
          </HudContainer>
        )}
      </div>

      <ItemDetailsModal
        isOpen={itemDetails.isModalOpen}
        isAnimating={itemDetails.isModalAnimating}
        selectedItem={itemDetails.selectedItem}
        synopsis={itemDetails.synopsis}
        synopsisLoading={itemDetails.synopsisLoading}
        synopsisError={itemDetails.synopsisError}
        modalActionLoading={itemDetails.modalActionLoading}
        canDelete={false}
        promptCommentOnOpen={itemDetails.shouldPromptComment}
        titlePrefix={t('details_title')}
        closeLabel={t('modal.close')}
        noImageLabel={t('no_image')}
        loadingSynopsisLabel={t('loading.synopsis')}
        emptySynopsisLabel={t('item.no_synopsis')}
        movieTypeLabel={t('action.movie_type')}
        seriesTypeLabel={t('action.series_type')}
        watchedLabel={t('item.watched')}
        notWatchedLabel={t('item.not_watched')}
        markWatchedLabel={t('item.mark_watched')}
        markUnwatchedLabel={t('item.mark_unwatched')}
        deleteLabel={t('action.delete')}
        onClose={itemDetails.handleCloseDetails}
        onToggle={itemDetails.handleToggleFromModal}
        onDelete={itemDetails.handleDeleteFromModal}
        closeButtonRef={itemDetails.closeButtonRef}
      />
    </div>
  )
}

export default Perfil
