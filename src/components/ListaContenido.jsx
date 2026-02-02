import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function ListaContenido({ tipo, icono, session }) {
  const [nombre, setNombre] = useState('')
  const [lista, setLista] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (session) {
      fetchItems()
    }
  }, [tipo, session])

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

  async function agregarItem(e) {
    e.preventDefault()
    if (!nombre.trim()) return

    const { error } = await supabase
      .from('items')
      .insert([
        { 
          titulo: nombre, 
          tipo: tipo, 
          visto: false, 
          user_id: session?.user?.id 
        }
      ])

    if (error) {
      alert("Error: " + error.message)
    } else {
      setNombre('')
      fetchItems()
    }
  }

  // FUNCIÓN PARA EL CHECKBOX
  async function toggleVisto(id, estadoActual) {
    const { error } = await supabase
      .from('items')
      .update({ visto: !estadoActual })
      .eq('id', id)

    if (error) console.error("Error al actualizar:", error)
    else fetchItems()
  }

  // FUNCIÓN PARA BORRAR
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

      <form onSubmit={agregarItem} className="flex gap-3 mb-12">
        <input 
          type="text" 
          placeholder={`INSERTAR ${tipo.toUpperCase()}...`}
          className="flex-1 bg-black/40 border-2 border-purple-900/50 rounded-2xl px-6 py-4 text-white outline-none focus:border-pink-500 transition-all font-bold"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
        <button type="submit" className="bg-pink-600 hover:bg-pink-500 px-10 py-4 rounded-2xl font-black text-white shadow-[0_0_20px_rgba(219,39,119,0.4)] transition-all italic">
          AÑADIR
        </button>
      </form>

      <div className="grid gap-6">
        {lista.map(item => (
          <div 
            key={item.id} 
            className={`group relative flex flex-col p-6 rounded-2xl border-2 transition-all duration-500 ${
              item.visto 
              ? 'bg-black/20 border-purple-900/20 opacity-30' 
              : 'bg-purple-950/5 border-pink-500/20 hover:border-pink-500 hover:shadow-[0_0_30px_rgba(219,39,119,0.2)]'
            }`}
          >
            <div className="flex items-center justify-between z-10">
              <div className="flex flex-col gap-2">
                <span className={`text-2xl font-black italic tracking-tight transition-all duration-500 ${
                  item.visto ? 'text-purple-900 line-through' : 'text-white'
                }`}>
                  {item.titulo}
                </span>
                
                <span className={`text-[9px] font-black uppercase tracking-[0.25em] px-2.5 py-1 rounded-full border-2 w-fit ${
                  item.user_id === session.user.id 
                  ? 'border-pink-500/30 text-pink-500 bg-pink-500/5' 
                  : 'border-cyan-500/30 text-cyan-500 bg-cyan-500/5'
                }`}>
                  {item.user_id === session.user.id ? 'AUTOR: TÚ' : 'AUTOR: SOCIO'}
                </span>
              </div>

              <div className="flex items-center gap-6">
                <input 
                  type="checkbox" 
                  checked={item.visto} 
                  onChange={() => toggleVisto(item.id, item.visto)}
                  className="w-8 h-8 rounded-full border-2 border-pink-500 bg-transparent accent-pink-500 cursor-pointer transition-transform hover:scale-110"
                />
                <button 
                  onClick={() => eliminarItem(item.id)}
                  className="md:opacity-0 group-hover:opacity-100 text-purple-900 hover:text-pink-500 transition-all p-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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