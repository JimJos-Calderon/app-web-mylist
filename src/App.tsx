import React, { useState } from 'react'
import { Routes, Route, Link, Navigate } from 'react-router-dom'
import { useAuth } from '@hooks/useAuth'
import Login from '@pages/Login'
import Peliculas from '@pages/Peliculas'
import Series from '@pages/Series'

const App: React.FC = () => {
  const { session, loading, signOut, error: authError } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showError, setShowError] = useState(authError)

  React.useEffect(() => {
    if (authError) {
      setShowError(authError)
      const timer = setTimeout(() => setShowError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [authError])

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
  const userInitials = userEmail.split('@')[0].substring(0, 2).toUpperCase()

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
        </div>

        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-700/30 transition-all"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">
              {userInitials}
            </div>
            <span className="text-sm font-semibold hidden sm:inline text-slate-300">{userEmail}</span>
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
            <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-slate-700 bg-slate-900/50">
                <p className="text-sm font-semibold text-white">{userEmail}</p>
              </div>
              <button
                onClick={() => {
                  signOut()
                  setShowUserMenu(false)
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors font-medium"
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
              <div className="text-center mt-20 animate-in fade-in zoom-in duration-700">
                <h2 className="text-5xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-violet-500">
                  ¡Hola de nuevo!
                </h2>
                <p className="text-zinc-400 text-lg">
                  ¿Qué vamos a ver hoy,{' '}
                  <span className="text-zinc-200 font-bold">{userEmail}</span>?
                </p>
              </div>
            }
          />
          <Route path="/peliculas" element={<Peliculas />} />
          <Route path="/series" element={<Series />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
