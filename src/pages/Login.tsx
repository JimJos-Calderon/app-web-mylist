import React, { useState } from 'react'
import { supabase } from '@/supabaseClient'
import { validateEmail, validatePassword } from '@utils/validation'
import { ERROR_MESSAGES } from '@constants/index'
import { Eye, EyeOff, XCircle, Loader2 } from 'lucide-react'

const Login: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate inputs
    if (!validateEmail(email)) {
      setError('Por favor ingresa un email válido')
      return
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      setError(passwordValidation.message || ERROR_MESSAGES.AUTH_REQUIRED)
      return
    }

    setLoading(true)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          setError('Email o contraseña incorrectos')
        } else {
          setError(signInError.message)
        }
        throw signInError
      }

      // Clear form on success
      setEmail('')
      setPassword('')
    } catch (err) {
      console.error('Login error:', err)
      // Error already set above
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-black flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-4 sm:space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
              Nuestra Lista
            </h1>
            <p className="text-slate-400 text-base sm:text-xl">Gestiona tu lista compartida de películas y series</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <span className="text-red-500 text-sm font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-lg sm:text-xl font-semibold text-slate-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-900/50 border border-slate-600 text-white text-base sm:text-xl px-4 sm:px-5 py-3 sm:py-4 rounded-lg outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-slate-500 placeholder:text-sm sm:placeholder:text-lg"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-lg sm:text-xl font-semibold text-slate-300 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full bg-slate-900/50 border border-slate-600 text-white text-base sm:text-xl px-4 sm:px-5 py-3 sm:py-4 pr-12 rounded-lg outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-slate-500 placeholder:text-sm sm:placeholder:text-lg"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute right-3 sm:right-4 top-3 sm:top-4 text-slate-400 hover:text-slate-300 disabled:opacity-50"
                >
                  {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 disabled:from-slate-600 disabled:to-slate-600 text-white text-lg sm:text-xl font-bold py-3 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="animate-spin h-5 w-5" />}
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-slate-400 text-base sm:text-xl">
            by JimJos 
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
