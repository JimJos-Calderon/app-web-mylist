import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { useTranslation } from 'react-i18next'
import { validateEmail, validatePassword, validateUsername, ERROR_MESSAGES, LanguageSwitcher } from '@/features/shared'
import { supabase } from '@/supabaseClient'
import { Eye, EyeOff, XCircle, Loader2, X, UserPlus, CheckCircle2, AtSign, Check, AlertCircle } from 'lucide-react'

// ─── Google SVG Icon ─────────────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
)

// ─── Register Modal ─────────────────────────────────────────────────────────────

interface RegisterModalProps {
  open: boolean
  onClose: () => void
}

const RegisterModal: React.FC<RegisterModalProps> = ({ open, onClose }) => {
  const { t } = useTranslation()
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
          setUsernameMessage(t('signup.username_taking'))
        } else {
          setUsernameStatus('available')
          setUsernameMessage(t('signup.username_available'))
        }
      } catch {
        setUsernameStatus('idle')
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [username, t])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const usernameCheck = validateUsername(username)
    if (!usernameCheck.valid) {
      setError(usernameCheck.message || t('signup.username_invalid'))
      return
    }

    if (usernameStatus === 'taken') {
      setError(t('signup.username_taken'))
      return
    }

    if (!validateEmail(email)) {
      setError(t('signup.error_invalid_email'))
      return
    }

    const pwdCheck = validatePassword(password)
    if (!pwdCheck.valid) {
      setError(pwdCheck.message || ERROR_MESSAGES.AUTH_REQUIRED)
      return
    }

    if (password !== confirmPassword) {
      setError(t('signup.password_mismatch'))
      return
    }

    setLoading(true)
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password })
      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError(t('signup.error_user_exists'))
        } else {
          setError(signUpError.message)
        }
        return
      }

      const newUser = signUpData?.user
      if (newUser) {
        const { data: existing } = await supabase
          .from('user_profiles')
          .select('id')
          .ilike('username', username.trim())
          .maybeSingle()

        if (existing) {
          setError(t('signup.username_just_taken'))
          await supabase.auth.signOut()
          return
        }

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
      setError(t('signup.error_unexpected'))
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
        className="relative w-full max-w-md border border-[rgba(var(--color-accent-primary-rgb),0.3)] bg-[rgba(var(--color-bg-base-rgb),0.95)] backdrop-blur-xl rounded-2xl shadow-[0_0_80px_rgba(var(--color-accent-primary-rgb),0.2)] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Top glow line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent-primary to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[rgba(var(--color-accent-primary-rgb),0.2)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[rgba(var(--color-accent-primary-rgb),0.2)] border border-[rgba(var(--color-accent-primary-rgb),0.4)] flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-accent-primary" />
            </div>
            <h2 className="text-xl font-black uppercase tracking-wider text-[var(--color-text-primary)]">
              {t('signup.title')}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label={t('buttons.close_signup_window')}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[rgba(var(--color-accent-primary-rgb),0.1)] transition-all"
          >
            <X className="w-4 h-4" aria-hidden="true" />
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
                <h3 className="text-xl font-black text-[var(--color-text-primary)] mb-2">{t('signup.account_created')}</h3>
                <p className="text-[var(--color-text-muted)] text-xl leading-relaxed">
                  {t('signup.confirmation_email')}{' '}
                  <span className="text-accent-primary font-semibold">{email}</span>.
                  <br />
                  {t('signup.confirmation_instruction')}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full px-4 py-3 bg-accent-primary text-white rounded-xl font-black text-xl hover:shadow-[0_0_25px_rgba(var(--color-accent-primary-rgb),0.5)] transition-all"
              >
                {t('signup.button_done')}
              </button>
            </div>
          ) : (
            /* ── Form ── */
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Username */}
              <div>
                <label className="block text-xl font-bold uppercase tracking-widest text-accent-primary mb-2">
                  {t('signup.username_label')}
                </label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                  <input
                    type="text"
                    placeholder={t('placeholders.username')}
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    disabled={loading}
                    autoFocus
                    maxLength={20}
                    className={`w-full pl-9 pr-10 py-3 bg-[rgba(var(--color-bg-base-rgb),0.8)] border rounded-xl text-[var(--color-text-primary)] text-xl placeholder-[var(--color-text-muted)]
                               focus-visible:ring-2 transition-all font-medium disabled:opacity-50
                               ${usernameStatus === 'available' ? 'border-green-500 focus-visible:border-green-500 focus-visible:ring-green-500/20' :
                        usernameStatus === 'taken' || usernameStatus === 'invalid' ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20' :
                          'border-[rgba(var(--color-accent-primary-rgb),0.3)] focus-visible:border-accent-primary focus-visible:ring-[rgba(var(--color-accent-primary-rgb),0.2)]'
                      }`}
                    required
                  />
                  {/* Status icon */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {usernameStatus === 'checking' && <Loader2 className="w-4 h-4 text-[var(--color-text-muted)] animate-spin" />}
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
                <p className="text-xl text-[var(--color-text-muted)] mt-1">{t('signup.username_hint')}</p>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xl font-bold uppercase tracking-widest text-accent-primary mb-2">
                  {t('signup.email_label')}
                </label>
                <input
                  type="email"
                  placeholder={t('placeholders.email')}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-[rgba(var(--color-bg-base-rgb),0.8)] border border-[rgba(var(--color-accent-primary-rgb),0.3)] rounded-xl text-[var(--color-text-primary)] text-xl placeholder-[var(--color-text-muted)]
                             focus-visible:border-accent-primary focus-visible:ring-2 focus-visible:ring-[rgba(var(--color-accent-primary-rgb),0.2)]
                             transition-all font-medium disabled:opacity-50"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xl font-bold uppercase tracking-widest text-accent-primary mb-2">
                  {t('signup.password_label')}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('placeholders.password_hint')}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={loading}
                    className="w-full px-4 py-3 pr-12 bg-[rgba(var(--color-bg-base-rgb),0.8)] border border-[rgba(var(--color-accent-primary-rgb),0.3)] rounded-xl text-[var(--color-text-primary)] text-xl placeholder-[var(--color-text-muted)]
                               focus-visible:border-accent-primary focus-visible:ring-2 focus-visible:ring-[rgba(var(--color-accent-primary-rgb),0.2)]
                               transition-all font-medium disabled:opacity-50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                  >
                    {showPassword ? <Eye className="w-5 h-5" aria-hidden="true" /> : <EyeOff className="w-5 h-5" aria-hidden="true" />}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-xl font-bold uppercase tracking-widest text-accent-primary mb-2">
                  {t('signup.confirm_password_label')}
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder={t('placeholders.password_confirm')}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    className="w-full px-4 py-3 pr-12 bg-[rgba(var(--color-bg-base-rgb),0.8)] border border-[rgba(var(--color-accent-primary-rgb),0.3)] rounded-xl text-[var(--color-text-primary)] text-xl placeholder-[var(--color-text-muted)]
                               focus-visible:border-accent-primary focus-visible:ring-2 focus-visible:ring-[rgba(var(--color-accent-primary-rgb),0.2)]
                               transition-all font-medium disabled:opacity-50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(v => !v)}
                    aria-label={showConfirm ? t('hide_password') : t('show_password')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                  >
                    {showConfirm ? <Eye className="w-5 h-5" aria-hidden="true" /> : <EyeOff className="w-5 h-5" aria-hidden="true" />}
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
                        : 'bg-[rgba(var(--color-accent-primary-rgb),0.1)]'
                        }`}
                    />
                  ))}
                  <span className="text-xl text-[var(--color-text-muted)] whitespace-nowrap">
                    {password.length < 4 ? t('signup.password_strength_veryWeak') : password.length < 7 ? t('signup.password_strength_weak') : password.length < 10 ? t('signup.password_strength_good') : t('signup.password_strength_strong')}
                  </span>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 px-4 py-3 border border-[rgba(var(--color-accent-primary-rgb),0.3)] text-[var(--color-text-muted)] rounded-xl font-bold text-xl
                             hover:bg-[rgba(var(--color-accent-primary-rgb),0.1)] hover:text-[var(--color-text-primary)] transition-all disabled:opacity-50"
                >
                  {t('signup.button_cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loading || !email || !password || !confirmPassword || !username || usernameStatus === 'taken' || usernameStatus === 'invalid' || usernameStatus === 'checking'}
                  className="flex-1 px-4 py-3 bg-accent-primary text-white rounded-xl font-black text-xl
                             hover:shadow-[0_0_25px_rgba(var(--color-accent-primary-rgb),0.5)] transition-all
                             disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
                             flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('signup.loading')}
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      {t('signup.button_signup')}
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Bottom glow line */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent-primary to-transparent opacity-30" />
      </div>
    </div>,
    document.body
  )
}

// ─── Login Page ──────────────────────────────────────────────────────────────

const Login: React.FC = () => {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showRegister, setShowRegister] = useState(false)

  const handleGoogleLogin = async () => {
    setError(null)
    setGoogleLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      })
      if (error) setError(error.message)
    } catch (err) {
      console.error('Google login error:', err)
      setError(t('login.error_google'))
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validateEmail(email)) {
      setError(t('signup.error_invalid_email'))
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
          setError(t('login.error_invalid'))
        } else if (signInError.message.includes('Email not confirmed')) {
          setError(t('login.error_email_not_confirmed'))
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

      <div
        className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden"
        style={{
          backgroundImage: 'url(/login-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Dark overlay + accent tint so card is readable */}
        <div className="absolute inset-0 bg-black/60" />
        {/* Subtle accent glow on top of the overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[rgba(var(--color-accent-primary-rgb),0.06)] rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[rgba(var(--color-accent-secondary-rgb),0.06)] rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-md relative">
          {/* Card */}
          <div
            className="relative rounded-2xl border border-[rgba(var(--color-accent-primary-rgb),0.25)] bg-black/70 backdrop-blur-xl shadow-[0_0_60px_rgba(var(--color-accent-primary-rgb),0.15)] overflow-hidden"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {/* Top glow line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent-primary to-transparent" />

            <div className="px-8 py-8 space-y-4">
              {/* Error */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-start gap-3">
                  <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span className="text-red-400 text-sm">{error}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label htmlFor="login-email" className="block text-xs font-bold uppercase tracking-widest text-accent-primary mb-1.5">
                    {t('login.email_label')}
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    placeholder={t('placeholders.email')}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={loading}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/30
                               focus-visible:border-accent-primary focus-visible:ring-1 focus-visible:ring-[rgba(var(--color-accent-primary-rgb),0.3)]
                               transition-all disabled:opacity-50 outline-none"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="login-password" className="block text-xs font-bold uppercase tracking-widest text-accent-primary mb-1.5">
                    {t('login.password_label')}
                  </label>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={t('placeholders.password')}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      disabled={loading}
                      className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/30
                                 focus-visible:border-accent-primary focus-visible:ring-1 focus-visible:ring-[rgba(var(--color-accent-primary-rgb),0.3)]
                                 transition-all disabled:opacity-50 outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      disabled={loading}
                      aria-label={showPassword ? t('hide_password') : t('show_password')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                    >
                      {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 text-white font-bold rounded-xl text-base tracking-wide mt-2
                             active:scale-[0.99] transition-all
                             disabled:opacity-50 disabled:cursor-not-allowed
                             flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-secondary))' }}
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />{t('login.loading')}</>
                  ) : (
                    t('login.button_login')
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-white/40 text-xs uppercase tracking-widest">{t('login.divider')}</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Google Login */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading || loading}
                className="w-full py-3 bg-white/5 border border-white/10 text-white font-semibold rounded-xl text-sm
                           hover:bg-white/10 hover:border-white/20
                           transition-all flex items-center justify-center gap-3
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {googleLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> {t('login.loading_google')}</>
                ) : (
                  <><GoogleIcon /> {t('login.button_google')}</>
                )}
              </button>

              {/* Register */}
              <button
                onClick={() => setShowRegister(true)}
                className="w-full py-3 border border-[rgba(var(--color-accent-primary-rgb),0.35)] text-accent-primary font-semibold rounded-xl text-sm
                           hover:bg-[rgba(var(--color-accent-primary-rgb),0.1)] hover:border-accent-primary
                           transition-all flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                {t('signup.button_signup')}
              </button>
              <p className="text-center text-white/25 text-xs">{t('footer.by')}</p>
            </div>

            {/* Bottom glow */}
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent-primary to-transparent opacity-30" />
          </div>

          <div className="fixed bottom-6 right-6">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </>
  )
}

export default Login
