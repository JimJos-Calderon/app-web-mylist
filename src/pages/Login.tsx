import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { supabase } from '@/supabaseClient'
import { validateEmail, validatePassword, validateUsername } from '@utils/validation'
import { ERROR_MESSAGES } from '@constants/index'
import { Eye, EyeOff, XCircle, Loader2, X, UserPlus, CheckCircle2, Heart, AtSign, Check, AlertCircle } from 'lucide-react'

// ─── Register Modal ─────────────────────────────────────────────────────────────

interface RegisterModalProps {
  open: boolean
  onClose: () => void
}

const RegisterModal: React.FC<RegisterModalProps> = ({ open, onClose }) => {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle')
  const [usernameMessage, setUsernameMessage] = useState<string>('')

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  // Reset state when closing
  useEffect(() => {
    if (!open) {
      setEmail(''); setPassword(''); setConfirmPassword('')
      setUsername(''); setUsernameStatus('idle'); setUsernameMessage('')
      setError(null); setSuccess(false)
      setShowPassword(false); setShowConfirm(false)
    }
  }, [open])

  // Debounced username availability check
  useEffect(() => {
    if (!username) { setUsernameStatus('idle'); setUsernameMessage(''); return }
    const formatCheck = validateUsername(username)
    if (!formatCheck.valid) {
      setUsernameStatus('invalid')
      setUsernameMessage(formatCheck.message || '')
      return
    }
    setUsernameStatus('checking')
    setUsernameMessage('')
    const timer = setTimeout(async () => {
      try {
        const { data } = await supabase
          .from('user_profiles')
          .select('id')
          .ilike('username', username.trim())
          .maybeSingle()
        if (data) {
          setUsernameStatus('taken')
          setUsernameMessage('Este usuario ya está en uso')
        } else {
          setUsernameStatus('available')
          setUsernameMessage('¡Usuario disponible!')
        }
      } catch {
        setUsernameStatus('idle')
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [username])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate username format
    const usernameCheck = validateUsername(username)
    if (!usernameCheck.valid) {
      setError(usernameCheck.message || 'Usuario inválido')
      return
    }

    // Block if username is taken
    if (usernameStatus === 'taken') {
      setError('Ese usuario ya está en uso. Elige otro.')
      return
    }

    if (!validateEmail(email)) {
      setError('Por favor ingresa un email válido')
      return
    }

    const pwdCheck = validatePassword(password)
    if (!pwdCheck.valid) {
      setError(pwdCheck.message || ERROR_MESSAGES.AUTH_REQUIRED)
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password })
      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('Este email ya está registrado. Intenta iniciar sesión.')
        } else {
          setError(signUpError.message)
        }
        return
      }

      // With confirm email OFF, we get an immediate session + user
      const newUser = signUpData?.user
      if (newUser) {
        // Double-check username availability (race condition guard)
        const { data: existing } = await supabase
          .from('user_profiles')
          .select('id')
          .ilike('username', username.trim())
          .maybeSingle()

        if (existing) {
          setError('Ese usuario ya fue tomado justo ahora. Elige otro.')
          // Roll back: sign out the newly created user
          await supabase.auth.signOut()
          return
        }

        // Insert user profile
        await supabase.from('user_profiles').insert([{
          user_id: newUser.id,
          username: username.trim().toLowerCase(),
          avatar_url: null,
          bio: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
      }

      setSuccess(true)
    } catch (err) {
      console.error(err)
      setError('Ocurrió un error inesperado. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center px-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Card */}
      <div
        className="relative w-full max-w-md rounded-2xl border border-pink-500/30 bg-black/95 backdrop-blur-xl
                   shadow-[0_0_80px_rgba(219,39,119,0.2)] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Top glow line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-pink-500 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-pink-500/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-pink-500/20 border border-pink-500/40 flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-pink-400" />
            </div>
            <h2 className="text-xl font-black uppercase tracking-wider text-white">
              Crear cuenta
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {success ? (
            /* ── Success state ── */
            <div className="flex flex-col items-center gap-5 py-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/40 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white mb-2">¡Cuenta creada!</h3>
                <p className="text-zinc-400 text-xl leading-relaxed">
                  Hemos enviado un correo de confirmación a{' '}
                  <span className="text-pink-400 font-semibold">{email}</span>.
                  <br />
                  Revisa tu bandeja de entrada y confirma tu cuenta para poder iniciar sesión.
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full px-4 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl font-black text-xl
                           hover:shadow-[0_0_25px_rgba(219,39,119,0.5)] transition-all"
              >
                Entendido
              </button>
            </div>
          ) : (
            /* ── Form ── */
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Username */}
              <div>
                <label className="block text-xl font-bold uppercase tracking-widest text-pink-400 mb-2">
                  Usuario
                </label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="tu_usuario"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    disabled={loading}
                    autoFocus
                    maxLength={20}
                    className={`w-full pl-9 pr-10 py-3 bg-zinc-900/80 border rounded-xl text-white text-xl placeholder-zinc-500
                               focus:outline-none focus:ring-2 transition-all font-medium disabled:opacity-50
                               ${usernameStatus === 'available' ? 'border-green-500 focus:border-green-500 focus:ring-green-500/20' :
                        usernameStatus === 'taken' || usernameStatus === 'invalid' ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' :
                          'border-zinc-700 focus:border-pink-500 focus:ring-pink-500/20'
                      }`}
                    required
                  />
                  {/* Status icon */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {usernameStatus === 'checking' && <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />}
                    {usernameStatus === 'available' && <Check className="w-4 h-4 text-green-400" />}
                    {(usernameStatus === 'taken' || usernameStatus === 'invalid') && <AlertCircle className="w-4 h-4 text-red-400" />}
                  </div>
                </div>
                {/* Status message */}
                {usernameMessage && (
                  <p className={`text-xl mt-1.5 font-medium ${usernameStatus === 'available' ? 'text-green-400' : 'text-red-400'
                    }`}>
                    {usernameMessage}
                  </p>
                )}
                <p className="text-xl text-zinc-600 mt-1">Solo letras, números y _ (3-20 caracteres)</p>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xl font-bold uppercase tracking-widest text-pink-400 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-zinc-900/80 border border-zinc-700 rounded-xl text-white text-xl placeholder-zinc-500
                             focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20
                             transition-all font-medium disabled:opacity-50"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xl font-bold uppercase tracking-widest text-pink-400 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={loading}
                    className="w-full px-4 py-3 pr-12 bg-zinc-900/80 border border-zinc-700 rounded-xl text-white text-xl placeholder-zinc-500
                               focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20
                               transition-all font-medium disabled:opacity-50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-xl font-bold uppercase tracking-widest text-pink-400 mb-2">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Repite tu contraseña"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    className="w-full px-4 py-3 pr-12 bg-zinc-900/80 border border-zinc-700 rounded-xl text-white text-xl placeholder-zinc-500
                               focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20
                               transition-all font-medium disabled:opacity-50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                  >
                    {showConfirm ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
                  <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span className="text-red-400 text-xl">{error}</span>
                </div>
              )}

              {/* Strength hint */}
              {password.length > 0 && (
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4].map(i => (
                    <div
                      key={i}
                      className={`flex-1 h-1 rounded-full transition-all ${password.length >= i * 3
                        ? i <= 1 ? 'bg-red-500' : i === 2 ? 'bg-yellow-500' : i === 3 ? 'bg-blue-400' : 'bg-green-400'
                        : 'bg-zinc-800'
                        }`}
                    />
                  ))}
                  <span className="text-xl text-zinc-500 whitespace-nowrap">
                    {password.length < 4 ? 'Muy débil' : password.length < 7 ? 'Débil' : password.length < 10 ? 'Buena' : 'Fuerte'}
                  </span>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 px-4 py-3 border border-zinc-700 text-zinc-300 rounded-xl font-bold text-xl
                             hover:bg-zinc-800 hover:text-white transition-all disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !email || !password || !confirmPassword || !username || usernameStatus === 'taken' || usernameStatus === 'invalid' || usernameStatus === 'checking'}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl font-black text-xl
                             hover:shadow-[0_0_25px_rgba(219,39,119,0.5)] transition-all
                             disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
                             flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creando…
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Registrarse
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Bottom glow line */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-pink-500/30 to-transparent" />
      </div>
    </div>,
    document.body
  )
}

// ─── Login Page ──────────────────────────────────────────────────────────────

const Login: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showRegister, setShowRegister] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

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
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          setError('Email o contraseña incorrectos')
        } else if (signInError.message.includes('Email not confirmed')) {
          setError('Debes confirmar tu email antes de iniciar sesión. Revisa tu bandeja de entrada.')
        } else {
          setError(signInError.message)
        }
        return
      }
      setEmail(''); setPassword('')
    } catch (err) {
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <RegisterModal open={showRegister} onClose={() => setShowRegister(false)} />

      <div className="min-h-screen bg-black flex items-center justify-center px-4 py-8 relative overflow-hidden">
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-pink-600/8 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/8 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-2xl" />
        </div>

        <div className="w-full max-w-md relative">
          {/* Card */}
          <div className="relative rounded-2xl border border-pink-500/25 bg-black/90 backdrop-blur-xl shadow-[0_0_80px_rgba(219,39,119,0.12)] overflow-hidden">
            {/* Top glow line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-pink-500 to-transparent" />

            <div className="px-8 py-10 space-y-7">
              {/* Logo / Header */}
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-pink-600 shadow-[0_0_30px_rgba(219,39,119,0.6)] mb-3">
                  <span className="text-white font-black text-lg">J&N</span>
                </div>
                <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
                  Nuestra Lista <Heart className="inline w-6 h-6 text-red-500 fill-red-500 -mt-1" />
                </h1>
                <p className="text-zinc-400 text-xl">
                  Tu lista compartida de películas y series
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <span className="text-red-400 text-xl font-medium">{error}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label htmlFor="login-email" className="block text-xl font-bold uppercase tracking-widest text-pink-400 mb-2">
                    Email
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={loading}
                    className="w-full px-4 py-3 bg-zinc-900/80 border border-zinc-700 rounded-xl text-white text-xl placeholder-zinc-500
                               focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20
                               transition-all font-medium disabled:opacity-50"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="login-password" className="block text-xl font-bold uppercase tracking-widest text-pink-400 mb-2">
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      disabled={loading}
                      className="w-full px-4 py-3 pr-12 bg-zinc-900/80 border border-zinc-700 rounded-xl text-white text-xl placeholder-zinc-500
                                 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20
                                 transition-all font-medium disabled:opacity-50"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      disabled={loading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
                    >
                      {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-black rounded-xl text-xl
                             hover:shadow-[0_0_30px_rgba(219,39,119,0.5)] transition-all
                             disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
                             flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Entrando…
                    </>
                  ) : (
                    'Iniciar sesión'
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-zinc-800" />
                <span className="text-zinc-600 text-xl uppercase tracking-widest">o</span>
                <div className="flex-1 h-px bg-zinc-800" />
              </div>

              {/* Register CTA */}
              <div className="text-center space-y-3">
                <p className="text-zinc-400 text-xl">¿No tienes cuenta todavía?</p>
                <button
                  onClick={() => setShowRegister(true)}
                  className="w-full py-3 border border-pink-500/40 text-pink-400 font-black rounded-xl text-xl
                             hover:bg-pink-500/10 hover:border-pink-500/70 hover:shadow-[0_0_20px_rgba(219,39,119,0.2)]
                             transition-all flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Crear cuenta nueva
                </button>
              </div>
            </div>

            {/* Bottom glow */}
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-pink-500/30 to-transparent" />
          </div>

          <p className="text-center mt-5 text-zinc-700 text-xl">by JimJos</p>
        </div>
      </div>
    </>
  )
}

export default Login
