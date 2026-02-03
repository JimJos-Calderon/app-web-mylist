import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'

export default function ListaContenido({ tipo, icono, session }) {
  const [nombre, setNombre] = useState('')
  const [lista, setLista] = useState([])
  const [sugerencias, setSugerencias] = useState([])
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false)
  const [cargando, setCargando] = useState(true)
  const sugerenciasRef = useRef(null)

  useEffect(() => {
    if (session) {
      fetchItems()
    }
  }, [tipo, session])

  // Lógica para cerrar sugerencias si haces clic fuera del buscador
  useEffect(() => {
    const handleClickFuera = (e) => {
      if (sugerenciasRef.current && !sugerenciasRef.current.contains(e.target)) {
        setMostrarSugerencias(false)
      }
    }
    document.addEventListener("mousedown", handleClickFuera)
    return () => document.removeEventListener("mousedown", handleClickFuera)
  }, [])

  // BUSCADOR EN TIEMPO REAL: Se activa al escribir 3 letras
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
          setSugerencias(data.Search.slice(0, 5)) // Mostramos las primeras 5
          setMostrarSugerencias(true)
        }
      } catch (error) {
        console.error("Error en búsqueda:", error)
      }
    }

    const timeoutId = setTimeout(buscarSugerencias, 500) // Espera 500ms tras dejar de escribir
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

  // Función para cuando seleccionas una de las sugerencias del menú
  const seleccionarSugerencia = async (sugerencia) => {
    // 1. Limpiamos estados inmediatamente para cerrar el menú
    setNombre('');
    setSugerencias([]);
    setMostrarSugerencias(false);

    try {
      // 2. Insertamos en Supabase
      const { error } = await supabase
        .from('items')
        .insert([{
          titulo: sugerencia.Title,
          tipo: tipo,
          visto: false,
          user_id: session?.user?.id,
          user_email: session?.user?.email,
          poster_url: sugerencia.Poster !== "N/A" ? sugerencia.Poster : null
        }]);

      if (error) {
        console.error("Error al insertar sugerencia:", error.message);
      } else {
        // 3. Refrescamos la lista localmente
        fetchItems();
      }
    } catch (err) {
      console.error("Error de red:", err);
    }
  };

  async function agregarItem(e) {
    e.preventDefault();
    if (!nombre.trim()) return;

    try {
      const response = await fetch(
        `https://www.omdbapi.com/?t=${encodeURIComponent(nombre)}&apikey=${import.meta.env.VITE_OMDB_KEY}`
      );
      const data = await response.json();
      const poster = data.Response === "True" && data.Poster !== "N/A" ? data.Poster : null;

      const { error } = await supabase
        .from('items')
        .insert([
          {
            titulo: data.Title || nombre,
            tipo: tipo,
            visto: false,
            user_id: session?.user?.id,
            user_email: session?.user?.email,
            poster_url: poster
          }
        ]);

      if (error) throw error;
      setNombre('');
      setMostrarSugerencias(false);
      fetchItems();
    } catch (error) {
      console.error("Error:", error.message);
      alert("Hubo un problema al añadir.");
    }
  }

  async function toggleVisto(id, estadoActual) {
    const { error } = await supabase
      .from('items')
      .update({ visto: !estadoActual })
      .eq('id', id)

    if (error) console.error("Error al actualizar:", error)
    else fetchItems()
  }

  async function eliminarItem(id) {
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', id)

    if (error) console.error("Error al eliminar:", error)
    else fetchItems()
  }

  if (!session) return (
    <div className="flex justify-center mt-20">
      <div className="w-10 h-10 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin"></div>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto p-4 animate-in fade-in zoom-in duration-1000">
      <header className="mb-12 text-center md:text-left">
        <div className="flex items-center justify-center md:justify-start gap-4 mb-3">
          <span className="text-5xl drop-shadow-[0_0_12px_rgba(236,72,153,0.8)]">{icono}</span>
          <h2 className="text-5xl font-black tracking-tighter italic uppercase text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-400 to-cyan-400">
            {tipo}s
          </h2>
        </div>
        <p className="text-pink-500/60 font-black text-[10px] uppercase tracking-[0.3em]">
          Base de datos sincronizada // {session.user.email}
        </p>
      </header>

      {/* CONTENEDOR DEL BUSCADOR CON SUGERENCIAS */}
      <div className="relative mb-12" ref={sugerenciasRef}>
        <form onSubmit={agregarItem} className="flex gap-3">
          <input
            type="text"
            placeholder={`BUSCAR ${tipo.toUpperCase()}...`}
            className="flex-1 bg-black/40 border-2 border-purple-900/50 rounded-2xl px-6 py-4 text-white outline-none focus:border-pink-500 transition-all font-bold"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            onFocus={() => nombre.length >= 3 && setMostrarSugerencias(true)}
          />
          <button type="submit" className="bg-pink-600 hover:bg-pink-500 px-10 py-4 rounded-2xl font-black text-white shadow-[0_0_20px_rgba(219,39,119,0.4)] transition-all italic">
            AÑADIR
          </button>
        </form>

        {/* MENÚ DE SUGERENCIAS */}
        {mostrarSugerencias && sugerencias.length > 0 && (
          <div className="absolute w-full mt-2 bg-black/90 border-2 border-pink-500/50 rounded-2xl overflow-hidden z-50 shadow-[0_0_30px_rgba(219,39,119,0.3)] backdrop-blur-xl">
            {/* Dentro del map de sugerencias */}
            {sugerencias.map((s) => (
              <button
                key={s.imdbID}
                type="button" // <--- MUY IMPORTANTE: evita que dispare el submit del form
                onClick={() => seleccionarSugerencia(s)}
                className="w-full flex items-center gap-4 p-3 hover:bg-pink-500/10 border-b border-white/5 last:border-0 text-left transition-colors cursor-pointer"
              >
                <img
                  src={s.Poster !== "N/A" ? s.Poster : "https://via.placeholder.com/40x60?text=No+Poster"}
                  className="w-10 h-14 object-cover rounded shadow-md pointer-events-none" // pointer-events-none para que no interfiera en el clic
                  alt=""
                />
                <div className="pointer-events-none">
                  <div className="text-white font-bold">{s.Title}</div>
                  <div className="text-pink-500/60 text-xs font-black">{s.Year}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-6">
        {lista.map(item => (
          <div
            key={item.id}
            className={`group relative flex flex-row gap-4 p-4 rounded-2xl border-2 transition-all duration-500 ${item.visto
              ? 'bg-black/20 border-purple-900/20 opacity-30'
              : 'bg-purple-950/10 border-pink-500/20 hover:border-pink-500 hover:shadow-[0_0_30px_rgba(219,39,119,0.2)]'
              }`}
          >
            <div className="w-20 h-28 flex-shrink-0 overflow-hidden rounded-lg border border-pink-500/30">
              {item.poster_url ? (
                <img src={item.poster_url} alt={item.titulo} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-black/40 flex items-center justify-center text-[10px] text-pink-500/40 text-center p-1 uppercase">
                  Sin Póster
                </div>
              )}
            </div>

            <div className="flex flex-col justify-between flex-1 py-1">
              <div>
                <span className={`text-xl font-black italic tracking-tight block ${item.visto ? 'text-purple-900 line-through' : 'text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]'
                  }`}>
                  {item.titulo}
                </span>
                <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded border mt-2 inline-block ${item.user_id === session.user.id ? 'border-pink-500/30 text-pink-500' : 'border-cyan-500/30 text-cyan-500'
                  }`}>
                  {item.user_id === session.user.id ? 'TÚ' : item.user_email?.split('@')[0]}
                </span>
              </div>

              <div className="flex items-center justify-end gap-4 mt-2">
                <input
                  type="checkbox"
                  checked={item.visto}
                  onChange={() => toggleVisto(item.id, item.visto)}
                  className="w-6 h-6 rounded-full border-2 border-pink-500 bg-transparent accent-pink-500 cursor-pointer"
                />
                <button onClick={() => eliminarItem(item.id)} className="text-purple-900 hover:text-pink-500 transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}