import React, { useState } from 'react'
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@hooks/useAuth'
import { useUserProfile } from '@hooks/useUserProfile'
import Login from '@pages/Login'
import Peliculas from '@pages/Peliculas'
import Series from '@pages/Series'
import Perfil from '@pages/Perfil'
import SpotifyGlassCard from '@components/SpotifyGlassCard'

const App: React.FC = () => {
  const { session, loading, signOut, error: authError } = useAuth()
  const { profile } = useUserProfile()
  const location = useLocation()
  const [showUserMenu, setShowUserMenu] = useState(false)
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
          <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-red-200 text-sm">{showError}</span>
        </div>
      )}

      <nav className="sticky top-0 z-40 backdrop-blur-md bg-black/60 border-b border-pink-500/20 px-8 py-4 flex items-center justify-between">
        <Link to="/" className="group flex items-center gap-3">
          <div className="w-10 h-10 bg-pink-600 rounded-lg flex items-center justify-center font-black text-white shadow-[0_0_15px_rgba(219,39,119,0.5)] group-hover:scale-110 transition-all">
            J&N
          </div>
          <span className="text-2xl font-black tracking-tighter text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
            Nuestra Lista ❤️❤️
          </span>
        </Link>

        <div className="flex bg-purple-900/20 p-1 rounded-xl border border-pink-500/10">
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
        </div>

        <div className="relative">
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
            <svg
              className={`w-4 h-4 text-slate-400 transition-transform ${
                showUserMenu ? 'rotate-180' : ''
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-slate-700 bg-slate-900/50">
                <p className="text-sm font-semibold text-white">{displayName}</p>
                <p className="text-xs text-slate-400">{userEmail}</p>
                {profile?.bio && (
                  <p className="text-xs text-slate-300 mt-2 italic line-clamp-2">{profile.bio}</p>
                )}
              </div>
              <Link
                to="/perfil"
                onClick={() => setShowUserMenu(false)}
                className="block w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 transition-colors font-medium"
              >
                Mi Perfil
              </Link>
              <button
                onClick={() => {
                  signOut()
                  setShowUserMenu(false)
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors font-medium border-t border-slate-700"
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
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
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>

        {location.pathname === '/' && (
          <div
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
        )}

        {location.pathname === '/' && (
          <div
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
        )}
      </main>
    </div>
  )
}

export default App
