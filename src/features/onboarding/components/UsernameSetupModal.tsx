import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AtSign, Loader2, Check, AlertCircle, XCircle } from 'lucide-react'
import { useAuth } from '@/features/auth'
import { supabase } from '@/supabaseClient'
import HudContainer from '@/features/shared/components/HudContainer'
import TechLabel from '@/features/shared/components/TechLabel'

const validateUsername = (value: string): { valid: boolean; message?: string } => {
  const username = value.trim()

  if (!username) return { valid: false, message: '' }
  if (username.length < 3) return { valid: false, message: 'Mínimo 3 caracteres' }
  if (username.length > 20) return { valid: false, message: 'Máximo 20 caracteres' }
  if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
    return { valid: false, message: 'Solo letras, números, guion, guion bajo y punto' }
  }

  return { valid: true }
}

const UsernameSetupModal: React.FC = () => {
  const { completeGoogleProfile } = useAuth()
  const { t } = useTranslation()
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle')
  const [usernameMessage, setUsernameMessage] = useState('')

  useEffect(() => {
    if (!username) {
      setUsernameStatus('idle')
      setUsernameMessage('')
      return
    }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (usernameStatus !== 'available') return

    setError(null)
    setLoading(true)

    try {
      await completeGoogleProfile(username)
    } catch (err: any) {
      setError(err?.message || 'Error al guardar el usuario')
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = usernameStatus === 'available' && !loading

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" />
      <div className="relative w-full max-w-md animate-in zoom-in-95 duration-200">
        <HudContainer className="p-0 border-[rgba(var(--color-accent-secondary-rgb),0.5)] shadow-[0_0_40px_rgba(var(--color-accent-secondary-rgb),0.15)] bg-[rgba(0,0,0,0.6)]">
          <div className="flex items-center justify-between px-6 py-5 border-b border-[rgba(var(--color-accent-secondary-rgb),0.2)]">
            <div className="flex items-center gap-4">
              <div
                className="w-10 h-10 bg-[rgba(var(--color-accent-secondary-rgb),0.08)] border border-[rgba(var(--color-accent-secondary-rgb),0.4)] flex items-center justify-center shrink-0"
                style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
              >
                <AtSign className="w-5 h-5 text-accent-secondary drop-shadow-[0_0_8px_rgba(var(--color-accent-secondary-rgb),0.6)]" />
              </div>
              <div className="flex flex-col gap-1">
                <TechLabel text="SYS.USER_INIT" tone="secondary" blink />
                <h2 className="text-lg font-black uppercase tracking-[0.1em] text-[var(--color-text-primary)] font-mono leading-none">
                  {t('needs_username.title')}
                </h2>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 space-y-6">
            <p className="text-[var(--color-text-muted)] text-sm font-mono opacity-80 leading-relaxed">
              {'>'} {t('needs_username.subtitle')}
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-2 font-mono">
                  {'>'} {t('signup.username_label')}
                </label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] opacity-60" />
                  <input
                    type="text"
                    placeholder={t('needs_username.username_placeholder')}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                    autoFocus
                    maxLength={20}
                    className={`w-full pl-9 pr-10 py-3 bg-[rgba(0,0,0,0.5)] border text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] opacity-80
                      focus-visible:outline-none focus:opacity-100 transition-all font-mono text-sm disabled:opacity-50
                      ${
                        usernameStatus === 'available'
                          ? 'border-accent-primary focus-visible:border-accent-primary focus-visible:ring-1 focus-visible:ring-[rgba(var(--color-accent-primary-rgb),0.5)]'
                          : usernameStatus === 'taken' || usernameStatus === 'invalid'
                            ? 'border-[rgba(var(--color-accent-secondary-rgb),0.6)] focus-visible:border-accent-secondary focus-visible:ring-1 focus-visible:ring-[rgba(var(--color-accent-secondary-rgb),0.5)] text-accent-secondary'
                            : 'border-[rgba(var(--color-accent-secondary-rgb),0.3)] focus-visible:border-accent-secondary focus-visible:ring-1 focus-visible:ring-[rgba(var(--color-accent-secondary-rgb),0.5)]'
                      }`}
                    style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
                    required
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {usernameStatus === 'checking' && <Loader2 className="w-4 h-4 text-accent-secondary animate-spin" />}
                    {usernameStatus === 'available' && <Check className="w-4 h-4 text-accent-primary" />}
                    {(usernameStatus === 'taken' || usernameStatus === 'invalid') && (
                      <AlertCircle className="w-4 h-4 text-accent-secondary" />
                    )}
                  </div>
                </div>

                {usernameMessage && (
                  <p
                    className={`text-[10px] uppercase font-mono tracking-widest mt-2 ${
                      usernameStatus === 'available' ? 'text-accent-primary' : 'text-accent-secondary'
                    }`}
                  >
                    {usernameMessage}
                  </p>
                )}

                <p className="text-[10px] text-[var(--color-text-muted)] font-mono mt-2 opacity-60 uppercase">
                  {t('signup.username_hint')}
                </p>
              </div>

              {error && (
                <div
                  className="px-4 py-3 bg-[rgba(var(--color-accent-secondary-rgb),0.1)] border border-[rgba(var(--color-accent-secondary-rgb),0.4)] text-accent-secondary font-mono text-xs flex items-start gap-3"
                  style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
                >
                  <XCircle className="w-4 h-4 text-accent-secondary shrink-0 mt-0.5" />
                  <span>{'> ERR:'} {error}</span>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full py-3 bg-[rgba(var(--color-accent-secondary-rgb),0.15)] hover:bg-[rgba(var(--color-accent-secondary-rgb),0.25)] text-accent-secondary font-mono text-xs font-bold uppercase tracking-widest transition-all border border-[rgba(var(--color-accent-secondary-rgb),0.6)] hover:border-accent-secondary hover:shadow-[0_0_20px_rgba(var(--color-accent-secondary-rgb),0.35)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
                  style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> {t('buttons.saving')}
                    </>
                  ) : (
                    t('buttons.confirm_user')
                  )}
                </button>
              </div>
            </form>
          </div>
        </HudContainer>
      </div>
    </div>
  )
}

export default UsernameSetupModal