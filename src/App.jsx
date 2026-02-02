import { useState, useEffect } from 'react'
import { Routes, Route, Link, Navigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Peliculas from './pages/Peliculas'
import Series from './pages/Series'
import Login from './pages/Login'

function App() {
  const [session, setSession] = useState(null)

  useEffect(() => {
    // Revisar sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = () => supabase.auth.signOut()

  // Si no hay sesión, forzamos la pantalla de Login
  if (!session) {
    return <Login />
  }

  return (
    <div className="min-h-screen text-white font-sans selection:bg-orange-500/30">

      <nav className="sticky top-0 z-50 backdrop-blur-md bg-black/60 border-b border-pink-500/20 px-8 py-4 flex items-center justify-between">
        <Link to="/" className="group flex items-center gap-3">
          {/* Logo Rosa Neón */}
          <div className="w-10 h-10 bg-pink-600 rounded-lg flex items-center justify-center font-black text-white shadow-[0_0_15px_rgba(219,39,119,0.5)] group-hover:scale-110 transition-all">
           J&N
          </div>
          <span className="text-2xl font-black tracking-tighter text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">Nuestra Lista ❤️❤️</span>
        </Link>

        <div className="flex bg-purple-900/20 p-1 rounded-xl border border-pink-500/10">
          <Link to="/peliculas" className="px-6 py-2 rounded-lg hover:text-pink-400 transition-all font-bold text-sm">Películas</Link>
          <Link to="/series" className="px-6 py-2 rounded-lg hover:text-pink-400 transition-all font-bold text-sm">Series</Link>
        </div>

        <button onClick={handleLogout} className="text-[10px] font-black text-pink-500/50 hover:text-pink-400 uppercase tracking-widest transition-colors ">
          Salir
        </button>
      </nav>
      {/* Contenido Principal */}
      <main className="max-w-4xl mx-auto p-4">
        <Routes>
          <Route path="/" element={
            <div className="text-center mt-20 animate-in fade-in zoom-in duration-700">
              <h2 className="text-5xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-violet-500">
                ¡Hola de nuevo!
              </h2>
              <p className="text-zinc-400 text-lg">¿Qué vamos a ver hoy, <span className="text-zinc-200 font-bold">{session.user.email}</span>?</p>
            </div>
          } />

          {/* Pasamos la session como prop a las páginas */}
          <Route path="/peliculas" element={<Peliculas session={session} />} />
          <Route path="/series" element={<Series session={session} />} />

          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  )
}

export default App