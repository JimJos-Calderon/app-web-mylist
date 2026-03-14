import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Cog, UserCircle, Film } from 'lucide-react'
import { useAuth } from '@/features/auth'
import { useUserProfile } from '@/features/profile'
import { ItemCard } from '@/features/items'
import { ListItem } from '@/features/shared'
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
  const navigate = useNavigate()
  const [ratedItems, setRatedItems] = useState<{ item: ListItem; rating: RatingInfo }[]>([])
  const [isLoadingItems, setIsLoadingItems] = useState(true)
  const [totalRatings, setTotalRatings] = useState(0)
  const [favoriteCount, setFavoriteCount] = useState(0)
  const [likedCount, setLikedCount] = useState(0)

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

  const handleToggleVisto = async (_id: string, _currentState: boolean) => {
    // No cambiar estado desde perfil - solo ver
  }

  const handleOpenDetails = async (item: ListItem) => {
    // Navigate a detalles si es necesario
    navigate(`/item/${item.id}`)
  }

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
                className="w-32 h-32 rounded-full overflow-hidden border-4 flex items-center justify-center flex-shrink-0"
                style={{ 
                  borderColor: 'rgba(var(--color-accent-primary-rgb), 0.5)',
                  background: 'radial-gradient(circle, rgba(var(--color-accent-primary-rgb), 0.2) 0%, transparent 70%)'
                }}
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.username}
                    className="w-full h-full object-cover"
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
            <div className="flex-1 grid grid-cols-3 gap-4 w-full sm:w-auto">
              <HudContainer className="p-4 text-center">
                <div className="text-2xl font-black text-[var(--color-text-primary)]">{totalRatings}</div>
                <div className="text-xs text-[var(--color-text-muted)] mt-1 font-mono uppercase tracking-widest">{t('stats.rated')}</div>
              </HudContainer>
              <HudContainer className="p-4 text-center" style={{ borderColor: 'rgba(var(--color-accent-primary-rgb), 0.5)' }}>
                <div className="text-2xl font-black text-accent-primary drop-shadow-[0_0_8px_rgba(var(--color-accent-primary-rgb),0.5)]">{favoriteCount}</div>
                <div className="text-xs text-[var(--color-text-muted)] mt-1 font-mono uppercase tracking-widest">{t('stats.favorites')}</div>
              </HudContainer>
              <HudContainer className="p-4 text-center" style={{ borderColor: 'rgba(var(--color-accent-secondary-rgb), 0.5)' }}>
                <div className="text-2xl font-black text-accent-secondary drop-shadow-[0_0_8px_rgba(var(--color-accent-secondary-rgb),0.5)]">{likedCount}</div>
                <div className="text-xs text-[var(--color-text-muted)] mt-1 font-mono uppercase tracking-widest">{t('stats.liked')}</div>
              </HudContainer>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <button
              onClick={() => navigate('/ajustes')}
              className="px-6 py-3 bg-[rgba(var(--color-accent-primary-rgb),0.05)] backdrop-blur-md border border-[rgba(var(--color-accent-primary-rgb),0.3)] text-accent-primary font-bold hover:bg-[rgba(var(--color-accent-primary-rgb),0.1)] hover:border-accent-primary hover:shadow-[0_0_20px_rgba(var(--color-accent-primary-rgb),0.3)] transition-all flex items-center justify-center gap-2"
              style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
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
              {ratedItems.map(({ item }) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  isOwn={true}
                  onDelete={handleDelete}
                  onToggleVisto={handleToggleVisto}
                  onOpenDetails={handleOpenDetails}
                  disableVistoEffect={true}
                />
              ))}
            </div>
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
    </div>
  )
}

export default Perfil
