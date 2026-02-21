import React, { useState, useEffect } from 'react'
import { Cog } from 'lucide-react'
import { useAuth } from '@hooks/useAuth'
import { useUserProfile } from '@hooks/useUserProfile'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/supabaseClient'
import ItemCard from '@components/ItemCard'
import { ListItem } from '@/types'

interface RatingInfo {
  rating: number
  liked: boolean
}

const Perfil: React.FC = () => {
  const { user } = useAuth()
  const { profile, loading } = useUserProfile()
  const navigate = useNavigate()
  const [ratedItems, setRatedItems] = useState<{ item: ListItem; rating: RatingInfo }[]>([])
  const [isLoadingItems, setIsLoadingItems] = useState(true)
  const [totalRatings, setTotalRatings] = useState(0)
  const [favoriteCount, setFavoriteCount] = useState(0)
  const [likedCount, setLikedCount] = useState(0)

  useEffect(() => {
    if (user) {
      fetchRatedItems()
    }
  }, [user])

  const fetchRatedItems = async () => {
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
            rating: r.rating
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
  }

  const handleDelete = async (id: string) => {
    // No eliminar desde perfil - solo ver
  }

  const handleToggleVisto = async (id: string, currentState: boolean) => {
    // No cambiar estado desde perfil - solo ver
  }

  const handleOpenDetails = async (item: ListItem) => {
    // Navigate a detalles si es necesario
    navigate(`/item/${item.id}`)
  }

  if (loading || isLoadingItems) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-black to-zinc-900 flex items-center justify-center">
        <div className="text-white">Cargando perfil...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-black to-zinc-900 text-white p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Profile Header */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row gap-8 items-start">
            {/* Avatar and Info */}
            <div className="flex flex-col items-center sm:items-start gap-4">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-cyan-400/30 bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center flex-shrink-0">
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
                  <div className="text-5xl">👤</div>
                )}
              </div>
              
              <div className="text-center sm:text-left">
                <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  {profile?.username || 'Usuario'}
                </h1>
                {profile?.bio && (
                  <p className="text-zinc-400 mt-2 max-w-sm">{profile.bio}</p>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex-1 grid grid-cols-3 gap-4 w-full sm:w-auto">
              <div className="bg-black/60 backdrop-blur-lg border border-cyan-500/20 rounded-xl p-4 text-center">
                <div className="text-2xl font-black text-cyan-400">{totalRatings}</div>
                <div className="text-xs text-zinc-400 mt-1">Calificadas</div>
              </div>
              <div className="bg-black/60 backdrop-blur-lg border border-cyan-500/20 rounded-xl p-4 text-center">
                <div className="text-2xl font-black text-yellow-400">{favoriteCount}</div>
                <div className="text-xs text-zinc-400 mt-1">Favoritas</div>
              </div>
              <div className="bg-black/60 backdrop-blur-lg border border-cyan-500/20 rounded-xl p-4 text-center">
                <div className="text-2xl font-black text-red-400">{likedCount}</div>
                <div className="text-xs text-zinc-400 mt-1">Me gusta</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <button
              onClick={() => navigate('/ajustes')}
              className="px-6 py-3 bg-black/60 backdrop-blur-lg border border-cyan-500/30 text-cyan-400 font-bold rounded-lg hover:bg-cyan-500/10 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(0,255,255,0.3)] transition-all flex items-center justify-center gap-2"
            >
              <Cog className="w-5 h-5" />
              <span>Ajustes</span>
            </button>
          </div>
        </div>

        {/* Rated Items Grid */}
        {ratedItems.length > 0 ? (
          <div>
            <h2 className="text-2xl font-black mb-6">Mis Calificaciones</h2>
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
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎬</div>
            <h2 className="text-2xl font-bold mb-2">Aún sin calificaciones</h2>
            <p className="text-zinc-400 mb-6">
              Comienza a calificar películas y series para verlas aquí
            </p>
            <button
              onClick={() => navigate('/peliculas')}
              className="px-6 py-3 bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-bold rounded-lg hover:shadow-[0_0_30px_rgba(0,255,255,0.3)] transition-all inline-block"
            >
              Explorar Películas
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Perfil
