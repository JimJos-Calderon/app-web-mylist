import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) alert(error.message)
    else window.location.href = "/" // Redirigir al inicio al entrar
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl">
      <h2 className="text-3xl font-bold text-center mb-8 text-sky-400">Identifícate</h2>
      <form onSubmit={handleLogin} className="space-y-4">
        <input 
          type="email" placeholder="Tu email"
          className="w-full bg-slate-900 border border-slate-700 p-3 rounded-lg outline-none focus:border-sky-500"
          onChange={(e) => setEmail(e.target.value)}
        />
        <input 
          type="password" placeholder="Tu contraseña"
          className="w-full bg-slate-900 border border-slate-700 p-3 rounded-lg outline-none focus:border-sky-500"
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="w-full bg-sky-500 hover:bg-sky-600 py-3 rounded-lg font-bold transition-all">
          Entrar
        </button>
      </form>
    </div>
  )
}