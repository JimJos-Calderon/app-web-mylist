import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
// Importamos tu imagen local
import imagenFondo from './fondo_rosa.png' 

export default function ListaContenido({ tipo, icono, session }) {
  const [nombre, setNombre] = useState('')
  const [lista, setLista] = useState([])
  const [sugerencias, setSugerencias] = useState([])
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false)
  const [cargando, setCargando] = useState(true)
  const sugerenciasRef = useRef(null)

  useEffect(() => {
    if (session) fetchItems()
  }, [tipo, session])

  useEffect(() => {
    const handleClickFuera = (e) => {
      if (sugerenciasRef.current && !sugerenciasRef.current.contains(e.target)) {
        setMostrarSugerencias(false)
      }
    }
    document.addEventListener("mousedown", handleClickFuera)
    return () => document.removeEventListener("mousedown", handleClickFuera)
  }, [])

  useEffect(() => {
    const buscarSugerencias = async () => {
      if (nombre.length < 3) {
        setSugerencias([])
        return
      }
      try {
        const res = await fetch(
          `https://www.omdbapi.com/?s=${encodeURIComponent(nombre)}&type=${tipo === 'pelicula' ? 'movie' : 'series'}&apikey=${import.meta.env.VITE_OMDB_KEY}`
        )
        const data = await res.json()
        if (data.Response === "True") {
          setSugerencias(data.Search.slice(0, 5))
          setMostrarSugerencias(true)
        }
      } catch (error) { console.error("Error:", error) }
    }
    const timeoutId = setTimeout(buscarSugerencias, 500)
    return () => clearTimeout(timeoutId)
  }, [nombre, tipo])

  async function fetchItems() {
    setCargando(true)
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('tipo', tipo)
      .order('created_at', { ascending: false })
    if (error) console.error('Error:', error.message)
    else setLista(data)
    setCargando(false)
  }

  const seleccionarSugerencia = async (sugerencia) => {
    setNombre('');
    setSugerencias([]);
    setMostrarSugerencias(false);
    try {
      const { error } = await supabase.from('items').insert([{
        titulo: sugerencia.Title,
        tipo: tipo,
        visto: false,
        user_id: session?.user?.id,
        user_email: session?.user?.email,
        poster_url: sugerencia.Poster !== "N/A" ? sugerencia.Poster : null
      }]);
      if (error) console.error("Error:", error.message);
      else fetchItems();
    } catch (err) { console.error(err) }
  };

  async function agregarItem(e) {
    e.preventDefault();
    if (!nombre.trim()) return;
    try {
      const response = await fetch(`https://www.omdbapi.com/?t=${encodeURIComponent(nombre)}&apikey=${import.meta.env.VITE_OMDB_KEY}`);
      const data = await response.json();
      const poster = data.Response === "True" && data.Poster !== "N/A" ? data.Poster : null;
      const { error } = await supabase.from('items').insert([{
        titulo: data.Title || nombre,
        tipo: tipo,
        visto: false,
        user_id: session?.user?.id,
        user_email: session?.user?.email,
        poster_url: poster
      }]);
      if (error) throw error;
      setNombre('');
      fetchItems();
    } catch (error) { console.error(error.message) }
  }

  async function toggleVisto(id, estadoActual) {
    const { error } = await supabase.from('items').update({ visto: !estadoActual }).eq('id', id)
    if (!error) fetchItems()
  }

  async function eliminarItem(id) {
    const { error } = await supabase.from('items').delete().eq('id', id)
    if (!error) fetchItems()
  }

  if (!session) return <div className="p-10 text-cyan-400 font-black animate-pulse uppercase tracking-widest text-center">Iniciando Protocolo...</div>

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden font-sans bg-black">
      
      {/* CAPA DE FONDO PERSONALIZADA */}
      <div className="fixed inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url(${imagenFondo})`,
            filter: 'brightness(0.4) saturate(1.2)' 
          }}
        ></div>
        {/* Rejilla de Perspectiva Rosa */}
        <div className="absolute bottom-0 left-0 right-0 h-[40%] opacity-20"
          style={{
            backgroundImage: `linear-gradient(to right, #ff00ff 1px, transparent 1px), linear-gradient(to bottom, #ff00ff 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
            transform: 'perspective(500px) rotateX(60deg)',
            transformOrigin: 'bottom center'
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60"></div>
      </div>

      {/* CONTENIDO */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-12">
        <header className="mb-12">
          <div className="flex items-center gap-5 mb-3">
            <span className="text-6xl drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]">{icono}</span>
            <h2 className="text-5xl md:text-7xl font-black italic uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 tracking-tighter">
              {tipo}s
            </h2>
          </div>
          <p className="text-cyan-400 font-black text-[10px] uppercase tracking-[0.5em] border-l-4 border-pink-500 pl-4 opacity-90">
            STATION_SYNC // {session.user.email.split('@')[0]}
          </p>
        </header>

        {/* BUSCADOR */}
        <div className="relative mb-16 max-w-xl" ref={sugerenciasRef}>
          <form onSubmit={agregarItem} className="flex gap-3">
            <input
              type="text"
              placeholder={`BUSCAR ${tipo.toUpperCase()}...`}
              className="flex-1 bg-black/70 border-2 border-cyan-500/30 rounded-2xl px-6 py-4 text-white outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(0,255,255,0.2)] transition-all font-bold uppercase tracking-tight"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              onFocus={() => nombre.length >= 3 && setMostrarSugerencias(true)}
            />
            <button type="submit" className="bg-gradient-to-r from-pink-600 to-purple-600 px-8 py-4 rounded-2xl font-black text-white shadow-[0_0_20px_rgba(255,0,255,0.4)] transition-all italic uppercase text-xs">
              OK
            </button>
          </form>

          {/* SUGERENCIAS */}
          {mostrarSugerencias && sugerencias.length > 0 && (
            <div className="absolute w-full mt-2 bg-black/95 border-2 border-pink-500/50 rounded-2xl overflow-hidden z-50 backdrop-blur-xl">
              {sugerencias.map((s) => (
                <button key={s.imdbID} type="button" onClick={() => seleccionarSugerencia(s)} className="w-full flex items-center gap-4 p-3 hover:bg-pink-500/20 border-b border-white/5 text-left transition-all">
                  <img src={s.Poster !== "N/A" ? s.Poster : "https://via.placeholder.com/60x90"} className="w-10 h-14 object-cover rounded border border-pink-500/30" alt="" />
                  <div>
                    <div className="text-white font-black text-sm uppercase italic">{s.Title}</div>
                    <div className="text-cyan-400 text-[10px] font-bold mt-1">{s.Year}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* GRID DE CARDS (4 COLUMNAS) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {lista.map(item => {
            const esPropio = item.user_id === session.user.id;
            return (
              <div key={item.id} className={`group relative flex flex-col rounded-[2rem] border-2 transition-all duration-500 overflow-hidden bg-black/60 backdrop-blur-md ${
                item.visto ? 'border-purple-900/20 opacity-30 scale-95' :
                esPropio ? 'border-cyan-500/20 hover:border-cyan-400 hover:shadow-[0_0_30px_rgba(0,255,255,0.4)] hover:-translate-y-2' :
                'border-pink-500/20 hover:border-pink-500 hover:shadow-[0_0_30px_rgba(255,0,255,0.4)] hover:-translate-y-2'
              }`}>
                {/* Imagen */}
                <div className="relative aspect-[2/3] w-full overflow-hidden">
                  {item.poster_url ? (
                    <img src={item.poster_url} alt={item.titulo} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-[10px] text-zinc-500 font-black uppercase">NO_POSTER</div>
                  )}
                  <div className={`absolute top-4 right-4 transition-all duration-300 ${item.visto ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <input type="checkbox" checked={item.visto} onChange={() => toggleVisto(item.id, item.visto)} className="w-7 h-7 rounded-full border-2 border-white bg-black/60 accent-cyan-400 cursor-pointer" />
                  </div>
                </div>

                {/* Info */}
                <div className="p-5 flex flex-col flex-1 justify-between">
                  <div>
                    <h3 className={`text-[15px] font-black italic tracking-tighter leading-tight mb-3 uppercase break-words ${item.visto ? 'text-zinc-700 line-through' : 'text-white'}`}>
                      {item.titulo}
                    </h3>
                    <div className={`inline-block text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-md border ${
                      esPropio ? 'border-cyan-400/30 text-cyan-400 bg-cyan-400/5' : 'border-pink-500/30 text-pink-500 bg-pink-500/5'
                    }`}>
                      {esPropio ? 'TUYO' : item.user_email?.split('@')[0]}
                    </div>
                  </div>
                  <div className="flex justify-end mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => eliminarItem(item.id)} className="text-zinc-600 hover:text-red-500 transition-all p-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  )
}