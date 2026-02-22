import React, { useState } from 'react'
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom'
import { Menu, Film, Tv, User, Settings, LogOut, Heart, XCircle } from 'lucide-react'
import { useAuth } from '@hooks/useAuth'
import { useUserProfile } from '@hooks/useUserProfile'
import Login from '@pages/Login'
import Peliculas from '@pages/Peliculas'
import Series from '@pages/Series'
import Perfil from '@pages/Perfil'
import Ajustes from '@pages/Ajustes'
import SpotifyGlassCard from '@components/SpotifyGlassCard'
// import InvitationPage from './pages/InvitationPage';

const App: React.FC = () => {
  const { session, loading, signOut, error: authError } = useAuth()
  const { profile } = useUserProfile()
  const location = useLocation()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showError, setShowError] = useState(authError)
  const [playerPosition, setPlayerPosition] = useState({ x: window.innerWidth - 400, y: window.innerHeight - 400 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [playlistPosition, setPlaylistPosition] = useState({ x: 50, y: window.innerHeight - 400 })
  const [isPlaylistDragging, setIsPlaylistDragging] = useState(false)
  const [playlistDragOffset, setPlaylistDragOffset] = useState({ x: 0, y: 0 })

  React.useEffect(() => {
    if (authError) {
      setShowError(authError)
      const timer = setTimeout(() => setShowError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [authError])

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPlayerPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        })
      }
      if (isPlaylistDragging) {
        setPlaylistPosition({
          x: e.clientX - playlistDragOffset.x,
          y: e.clientY - playlistDragOffset.y
        })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsPlaylistDragging(false)
    }

    if (isDragging || isPlaylistDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragOffset, isPlaylistDragging, playlistDragOffset])

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true)
    setDragOffset({
      x: e.clientX - playerPosition.x,
      y: e.clientY - playerPosition.y
    })
  }

  const handlePlaylistMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsPlaylistDragging(true)
    setPlaylistDragOffset({
      x: e.clientX - playlistPosition.x,
      y: e.clientY - playlistPosition.y
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center">
            <div className="w-16 h-16 rounded-full border-4 border-pink-500/20 border-t-pink-500 animate-spin"></div>
          </div>
          <p className="text-cyan-400 font-black text-lg uppercase tracking-widest">
            Iniciando...
          </p>
        </div>
      </div>
    )
  }

  if (!session) {
    return <Login />
  }

  const userEmail = session.user.email || 'Usuario'
  const displayName = profile?.username || userEmail.split('@')[0]
  const userInitials = displayName.substring(0, 2).toUpperCase()

  return (
    <div className="min-h-screen text-white font-sans selection:bg-orange-500/30 bg-black">
      {/* Error notification */}
      {showError && (
        <div className="fixed top-4 right-4 z-50 bg-red-500/20 border border-red-500/50 rounded-lg p-4 flex items-start gap-3 max-w-md animate-in slide-in-from-top duration-300">
          <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <span className="text-red-200 text-sm">{showError}</span>
        </div>
      )}

      <nav className="sticky top-0 z-40 backdrop-blur-md bg-black/60 border-b border-pink-500/20 px-3 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
        <Link to="/" className="group flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-pink-600 rounded-lg flex items-center justify-center font-black text-white text-xs sm:text-base shadow-[0_0_15px_rgba(219,39,119,0.5)] group-hover:scale-110 transition-all">
            J&N
          </div>
          <span className="text-base sm:text-2xl font-black tracking-tighter text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
            <span className="hidden sm:inline">Nuestra Lista <Heart className="inline w-5 h-5 text-red-500 fill-red-500" /></span>
            <span className="sm:hidden">Mi Lista <Heart className="inline w-4 h-4 text-red-500 fill-red-500" /></span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex bg-purple-900/20 p-1 rounded-xl border border-pink-500/10">
          <Link
            to="/peliculas"
            className="px-6 py-2 rounded-lg hover:text-pink-400 transition-all font-bold text-sm"
          >
            Películas
          </Link>
          <Link
            to="/series"
            className="px-6 py-2 rounded-lg hover:text-pink-400 transition-all font-bold text-sm"
          >
            Series
          </Link>
          <Link
            to="/perfil"
            className="px-6 py-2 rounded-lg hover:text-pink-400 transition-all font-bold text-sm"
          >
            Mi Perfil
          </Link>
            {/* Invitación link removed */}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="md:hidden p-2 text-white hover:text-pink-400 transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="relative hidden md:block">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-700/30 transition-all"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs overflow-hidden bg-gradient-to-br from-cyan-500 to-pink-500">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              ) : (
                userInitials
              )}
            </div>
            <span className="text-sm font-semibold hidden sm:inline text-slate-300">{displayName}</span>
            <Menu
              className={`w-4 h-4 text-slate-400 transition-transform ${
                showUserMenu ? 'rotate-180' : ''
              }`}
            />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-black/95 backdrop-blur-lg border border-cyan-500/20 rounded-lg shadow-[0_0_30px_rgba(0,255,255,0.2)] overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-cyan-500/20 bg-black/60">
                <p className="text-sm font-semibold text-white">{displayName}</p>
                <p className="text-xs text-zinc-400">{userEmail}</p>
              </div>
              <Link
                to="/perfil"
                onClick={() => setShowUserMenu(false)}
                className="block w-full text-left px-4 py-2 text-sm text-zinc-200 hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors font-medium"
              >
                Mi Perfil
              </Link>
              <Link
                to="/ajustes"
                onClick={() => setShowUserMenu(false)}
                className="block w-full text-left px-4 py-2 text-sm text-zinc-200 hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors font-medium"
              >
                Ajustes
              </Link>
              <button
                onClick={() => {
                  signOut()
                  setShowUserMenu(false)
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors font-medium border-t border-cyan-500/20"
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>

        {/* Mobile Navigation Menu */}
        {showMobileMenu && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-black/95 backdrop-blur-lg border-b border-pink-500/20 shadow-[0_0_30px_rgba(219,39,119,0.2)] z-50">
            <div className="px-4 py-3 border-b border-pink-500/20 bg-black/60 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm overflow-hidden bg-gradient-to-br from-cyan-500 to-pink-500">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                ) : (
                  userInitials
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{displayName}</p>
                <p className="text-xs text-zinc-400">{userEmail}</p>
              </div>
            </div>
            <Link
              to="/peliculas"
              onClick={() => setShowMobileMenu(false)}
              className="block w-full text-left px-4 py-3 text-sm text-zinc-200 hover:bg-pink-500/10 hover:text-pink-400 transition-colors font-bold border-b border-pink-500/10 flex items-center gap-2"
            >
              <Film className="w-4 h-4" /> Películas
            </Link>
            <Link
              to="/series"
              onClick={() => setShowMobileMenu(false)}
              className="block w-full text-left px-4 py-3 text-sm text-zinc-200 hover:bg-pink-500/10 hover:text-pink-400 transition-colors font-bold border-b border-pink-500/10 flex items-center gap-2"
            >
              <Tv className="w-4 h-4" /> Series
            </Link>
            <Link
              to="/perfil"
              onClick={() => setShowMobileMenu(false)}
              className="block w-full text-left px-4 py-3 text-sm text-zinc-200 hover:bg-pink-500/10 hover:text-pink-400 transition-colors font-bold border-b border-pink-500/10 flex items-center gap-2"
            >
              <User className="w-4 h-4" /> Mi Perfil
            </Link>
            <Link
              to="/ajustes"
              onClick={() => setShowMobileMenu(false)}
              className="block w-full text-left px-4 py-3 text-sm text-zinc-200 hover:bg-pink-500/10 hover:text-pink-400 transition-colors font-bold border-b border-pink-500/10 flex items-center gap-2"
            >
              <Settings className="w-4 h-4" /> Ajustes
            </Link>
            {/* Invitación link removed from mobile menu */}
            <button
              onClick={() => {
                signOut()
                setShowMobileMenu(false)
              }}
              className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors font-bold flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Cerrar sesión
            </button>
          </div>
        )}
      </nav>

      <main className="max-w-7xl mx-auto p-4">
        <Routes>
          <Route
            path="/"
            element={
              <div className="text-center mt-20 animate-in fade-in zoom-in duration-700 space-y-8">
                <div>
                  <h2 className="text-5xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-violet-500">
                    ¡Hola de nuevo!
                  </h2>
                  <p className="text-zinc-400 text-lg">
                    ¿Qué vamos a ver hoy,{' '}
                    <span className="text-zinc-200 font-bold">{displayName}</span>?
                  </p>
                </div>
              </div>
            }
          />
          <Route path="/peliculas" element={<Peliculas />} />
          <Route path="/series" element={<Series />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/ajustes" element={<Ajustes />} />
          {/* InvitationPage route removed */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>

        {/* Spotify Players - Only on desktop */}
        {location.pathname === '/' && (
          <>
            <div
              className="hidden lg:block"
              onMouseDown={handleMouseDown}
              style={{
                position: 'fixed',
                left: `${playerPosition.x}px`,
                top: `${playerPosition.y}px`,
                zIndex: 30
              }}
            >
              <SpotifyGlassCard
                spotifyUrl="https://open.spotify.com/embed/playlist/3WyehWydbIc9FCDVDHbTbZ?utm_source=generator&theme=0"
                accentColor="rgb(168, 85, 247)"
                isDragging={isDragging}
              />
            </div>

            <div
              className="hidden lg:block"
              onMouseDown={handlePlaylistMouseDown}
              style={{
                position: 'fixed',
                left: `${playlistPosition.x}px`,
                top: `${playlistPosition.y}px`,
                zIndex: 30,
                pointerEvents: 'auto'
              }}
            >
              <SpotifyGlassCard
                spotifyUrl="https://open.spotify.com/embed/playlist/6y6uFhkd4QSgiZ4XBZekNb?utm_source=generator"
                accentColor="rgb(168, 85, 247)"
                isDragging={isPlaylistDragging}
              />
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default App
