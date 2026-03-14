import React, { useState, useEffect, useRef, Suspense, lazy, ErrorInfo } from 'react'
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ErrorBoundary } from 'react-error-boundary'
import * as Sentry from '@sentry/react'
import { Menu, Film, Tv, User, Settings, LogOut, Heart, XCircle, Users, ArrowRight, Loader2, AtSign, Check, AlertCircle } from 'lucide-react'
import { useAuth } from '@/features/auth'
import { useUserProfile } from '@/features/profile'
import { validateUsername, SectionErrorFallback } from '@/features/shared'
import { supabase } from '@/supabaseClient'
import HudContainer from '@/features/shared/components/HudContainer'
import TechLabel from '@/features/shared/components/TechLabel'

import Login from '@pages/Login'

const handleSectionError = (error: unknown, info: ErrorInfo) => {
  Sentry.captureException(error, {
    extra: { componentStack: info.componentStack },
  })
}

// ─── Code Splitting: Lazy load heavy pages ─────────────────────────────────
const Peliculas = lazy(() => import('@pages/Peliculas'))
const Series = lazy(() => import('@pages/Series'))
const Perfil = lazy(() => import('@pages/Perfil'))
const Ajustes = lazy(() => import('@pages/Ajustes'))
const JoinList = lazy(() => import('@pages/JoinList'))

// ─── Lazy load heavy components ────────────────────────────────────────────
const SpotifyGlassCard = lazy(() =>
  import('@/features/shared').then((module) => ({
    default: module.SpotifyGlassCard,
  }))
)

// ─── Activity Feed Panel ────────────────────────────────────────────────────
const ActivityFeedPanel = lazy(() => import('@/features/lists/components/ActivityFeed'))

// ─── Per-route Loading Fallback ─────────────────────────────────────────────
const PageLoadingSkeleton: React.FC = () => {
  const { t } = useTranslation()
  
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="inline-flex items-center justify-center relative">
          <div className="w-20 h-20 border-2 border-[rgba(var(--color-accent-primary-rgb),0.2)] border-t-accent-primary border-r-[var(--color-accent-secondary)] rounded-full animate-spin"></div>
          <div className="absolute inset-0 border-2 border-[rgba(var(--color-accent-secondary-rgb),0.1)] border-b-[var(--color-accent-secondary)] rounded-full animate-[spin_3s_linear_infinite_reverse]"></div>
        </div>
        <div className="space-y-2">
          <p className="text-accent-primary font-mono font-bold text-lg uppercase tracking-[0.2em] animate-pulse">
            SYS.{t('status.loading')}...
          </p>
          <p className="text-[var(--color-text-muted)] font-mono text-xs uppercase opacity-70">
            {'>'} {t('states.optimizing')}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Activity Feed Loading Skeleton ─────────────────────────────────────────
const ActivityFeedSkeleton: React.FC = () => {
  const { t } = useTranslation()
  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 bg-accent-primary animate-pulse"></div>
           <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-accent-primary">
             SYS.{t('activity_feed.title')}
           </h3>
        </div>
        <div className="w-24 h-2 bg-[rgba(var(--color-accent-primary-rgb),0.2)] animate-pulse" />
      </div>

      <div className="space-y-3">
        {[1, 2, 3].map((line) => (
          <div key={line} 
               className="h-10 bg-[rgba(var(--color-accent-primary-rgb),0.05)] border border-[rgba(var(--color-accent-primary-rgb),0.1)] animate-pulse" 
               style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }} />
        ))}
      </div>

      <p className="mt-4 text-[10px] font-mono uppercase tracking-widest text-[var(--color-text-muted)] opacity-70">
        {'>'} {t('activity_feed.loading')}
      </p>
    </div>
  )
}

// ─── Component Loading Skeleton (for Spotify widgets) ──────────────────────
const SpotifyWidgetSkeleton: React.FC = () => {
  const { t } = useTranslation()
  
  return (
    <div 
      className="w-80 h-[480px] bg-[rgba(var(--color-accent-primary-rgb),0.05)] border border-[rgba(var(--color-accent-primary-rgb),0.3)] backdrop-blur-xl animate-pulse flex items-center justify-center"
      style={{ clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)' }}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 bg-[rgba(var(--color-accent-primary-rgb),0.1)] border border-accent-primary flex items-center justify-center animate-pulse"
             style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
        </div>
        <p className="text-accent-primary font-mono text-[10px] uppercase tracking-widest opacity-80">{'>'} {t('states.loading_widget')}</p>
      </div>
    </div>
  )
}

// ─── Username Setup Modal (for new Google users) ─────────────────────────────
const UsernameSetupModal: React.FC = () => {
  const { completeGoogleProfile } = useAuth()
  const { t } = useTranslation()
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle')
  const [usernameMessage, setUsernameMessage] = useState('')

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
        <HudContainer
          className="p-0 border-[rgba(var(--color-accent-secondary-rgb),0.5)] shadow-[0_0_40px_rgba(var(--color-accent-secondary-rgb),0.15)] bg-[rgba(0,0,0,0.6)]"
        >
          {/* Header */}
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
                    onChange={e => setUsername(e.target.value)}
                    disabled={loading}
                    autoFocus
                    maxLength={20}
                    className={`w-full pl-9 pr-10 py-3 bg-[rgba(0,0,0,0.5)] border text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] opacity-80
                               focus-visible:outline-none focus:opacity-100 transition-all font-mono text-sm disabled:opacity-50
                               ${usernameStatus === 'available' ? 'border-accent-primary focus-visible:border-accent-primary focus-visible:ring-1 focus-visible:ring-[rgba(var(--color-accent-primary-rgb),0.5)]' :
                        usernameStatus === 'taken' || usernameStatus === 'invalid' ? 'border-[rgba(var(--color-accent-secondary-rgb),0.6)] focus-visible:border-accent-secondary focus-visible:ring-1 focus-visible:ring-[rgba(var(--color-accent-secondary-rgb),0.5)] text-accent-secondary' :
                          'border-[rgba(var(--color-accent-secondary-rgb),0.3)] focus-visible:border-accent-secondary focus-visible:ring-1 focus-visible:ring-[rgba(var(--color-accent-secondary-rgb),0.5)]'
                      }`}
                    style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
                    required
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {usernameStatus === 'checking' && <Loader2 className="w-4 h-4 text-accent-secondary animate-spin" />}
                    {usernameStatus === 'available' && <Check className="w-4 h-4 text-accent-primary" />}
                    {(usernameStatus === 'taken' || usernameStatus === 'invalid') && <AlertCircle className="w-4 h-4 text-accent-secondary" />}
                  </div>
                </div>
                {usernameMessage && (
                  <p className={`text-[10px] uppercase font-mono tracking-widest mt-2 ${usernameStatus === 'available' ? 'text-accent-primary' : 'text-accent-secondary'}`}>
                    {usernameMessage}
                  </p>
                )}
                <p className="text-[10px] text-[var(--color-text-muted)] font-mono mt-2 opacity-60 uppercase">{t('signup.username_hint')}</p>
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
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('buttons.saving')}</> : t('buttons.confirm_user')}
                </button>
              </div>
            </form>
          </div>
        </HudContainer>
      </div>
    </div>
  )
}

const App: React.FC = () => {
  const { session, loading, signOut, error: authError, needsUsername } = useAuth()
  const { profile } = useUserProfile()
  const { t } = useTranslation()
  const location = useLocation()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showError, setShowError] = useState(authError)
  const [playerPosition, setPlayerPosition] = useState({ x: window.innerWidth - 400, y: window.innerHeight - 400 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [playlistPosition, setPlaylistPosition] = useState({ x: 50, y: window.innerHeight - 400 })
  const [isPlaylistDragging, setIsPlaylistDragging] = useState(false)
  const [playlistDragOffset, setPlaylistDragOffset] = useState({ x: 0, y: 0 })

  // Pending invite
  const [pendingInvite, setPendingInvite] = useState<{ list_id: string; list_name: string; list_description: string | null; invite_code: string } | null>(null)
  const [inviteJoining, setInviteJoining] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)

  type JoinListRpcResult = {
    joined: boolean
    status: string
    list_id: string | null
    membership_role: string | null
  }

  // Refs para cerrar menús al hacer click fuera
  const userMenuRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setShowMobileMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  React.useEffect(() => {
    if (authError) {
      setShowError(authError)
      const timer = setTimeout(() => setShowError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [authError])

  // Detect pending invite code on session start
  React.useEffect(() => {
    if (!session?.user?.id) return
    const code = localStorage.getItem('pendingInviteCode')
    if (!code) return

    const resolvePendingInvite = async () => {
      try {
        const { data, error } = await supabase
          .from('lists')
          .select('id, name, description, invite_code')
          .eq('invite_code', code)
          .maybeSingle()
        if (error) {
          console.error('Invite resolve error:', error)
        }
        if (data) {
          // Check not already a member
          const { data: membership } = await supabase
            .from('list_members')
            .select('id')
            .eq('list_id', data.id)
            .eq('user_id', session.user.id)
            .maybeSingle()
          if (!membership) {
            setPendingInvite({
              list_id: data.id,
              list_name: data.name,
              list_description: data.description,
              invite_code: data.invite_code,
            })
          }
        }
      } catch (err) {
        console.error('Error resolving pending invite:', err)
      } finally {
        localStorage.removeItem('pendingInviteCode')
      }
    }

    resolvePendingInvite()
  }, [session?.user?.id])

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPlayerPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        })
      }
      if (isPlaylistDragging) {
        setPlaylistPosition({
          x: e.clientX - playlistDragOffset.x,
          y: e.clientY - playlistDragOffset.y
        })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsPlaylistDragging(false)
    }

    if (isDragging || isPlaylistDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragOffset, isPlaylistDragging, playlistDragOffset])

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true)
    setDragOffset({
      x: e.clientX - playerPosition.x,
      y: e.clientY - playerPosition.y
    })
  }

  const handlePlaylistMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsPlaylistDragging(true)
    setPlaylistDragOffset({
      x: e.clientX - playlistPosition.x,
      y: e.clientY - playlistPosition.y
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center relative">
            <div className="w-20 h-20 border-2 border-[rgba(var(--color-accent-primary-rgb),0.2)] border-t-accent-primary border-r-[var(--color-accent-secondary)] rounded-full animate-spin"></div>
            <div className="absolute inset-0 border-2 border-[rgba(var(--color-accent-secondary-rgb),0.1)] border-b-[var(--color-accent-secondary)] rounded-full animate-[spin_3s_linear_infinite_reverse]"></div>
          </div>
          <div className="space-y-2">
            <p className="text-accent-primary font-mono font-bold text-lg uppercase tracking-[0.2em] animate-pulse">
              SYS.INIT_SEQUENCE...
            </p>
            <p className="text-[var(--color-text-muted)] font-mono text-xs uppercase opacity-70">
              {'>'} AUTH_CHECK_PENDING
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Render join route BEFORE auth guards — JoinList manages its own auth state
  if (location.pathname.match(/^\/join\/[^/]+$/)) {
    return <JoinList />
  }

  if (!session) {
    return <Login />
  }

  const userEmail = session.user.email || 'Usuario'
  const displayName = profile?.username || userEmail.split('@')[0]
  const userInitials = displayName.substring(0, 2).toUpperCase()

  return (
    <div className="min-h-screen text-white font-sans selection:bg-orange-500/30 bg-black">
      {/* ── Username Setup Modal (new Google users) ── */}
      {needsUsername && <UsernameSetupModal />}

      {/* ── Pending Invite Modal ── */}
      {pendingInvite && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" />
          <div className="relative w-full max-w-md animate-in zoom-in-95 duration-200">
            <HudContainer
              className="p-0 border-[rgba(var(--color-accent-primary-rgb),0.5)] shadow-[0_0_40px_rgba(var(--color-accent-primary-rgb),0.15)] bg-[rgba(0,0,0,0.6)]"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-[rgba(var(--color-accent-primary-rgb),0.2)]">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-10 h-10 bg-[rgba(var(--color-accent-primary-rgb),0.08)] border border-[rgba(var(--color-accent-primary-rgb),0.4)] flex items-center justify-center shrink-0"
                    style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                  >
                    <Users className="w-5 h-5 text-accent-primary drop-shadow-[0_0_8px_rgba(var(--color-accent-primary-rgb),0.6)]" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <TechLabel text="SYS.PENDING_REQ" blink />
                    <h2 className="text-lg font-black uppercase tracking-[0.1em] text-[var(--color-text-primary)] font-mono leading-none">
                      {t('invite_notification.title')}
                    </h2>
                  </div>
                </div>
              </div>

              <div className="px-6 py-6 space-y-6">
                <div 
                  className="px-5 py-4 bg-[rgba(var(--color-accent-primary-rgb),0.05)] border border-[rgba(var(--color-accent-primary-rgb),0.2)]"
                  style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-accent-primary opacity-70 mb-1 font-mono">
                    {'>'} TARGET: LIST
                  </p>
                  <h2 className="text-[var(--color-text-primary)] font-mono font-bold text-sm leading-tight text-xl mb-2">{pendingInvite.list_name}</h2>
                  {pendingInvite.list_description && (
                    <p className="text-[var(--color-text-muted)] text-xs mt-2 font-mono opacity-80">{pendingInvite.list_description}</p>
                  )}
                </div>

                {inviteError && (
                  <div 
                    className="px-4 py-3 bg-[rgba(var(--color-accent-secondary-rgb),0.1)] border border-[rgba(var(--color-accent-secondary-rgb),0.4)] text-accent-secondary font-mono text-xs flex items-center gap-2"
                    style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
                  >
                    <XCircle className="w-4 h-4 text-accent-secondary shrink-0" />
                    <span>{'> ERR:'} {inviteError}</span>
                  </div>
                )}
                
                <div className="flex gap-4 pt-2 w-full">
                  <button
                    onClick={() => setPendingInvite(null)}
                    disabled={inviteJoining}
                    className="flex-1 px-4 py-3 bg-transparent hover:bg-[rgba(var(--color-accent-primary-rgb),0.1)] text-[var(--color-text-primary)] font-mono text-xs font-bold uppercase tracking-widest transition-all border border-[rgba(var(--color-accent-primary-rgb),0.4)] hover:border-accent-primary hover:text-accent-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
                  >
                    {t('invite_notification.reject_button')}
                  </button>
                  <button
                    disabled={inviteJoining}
                    onClick={async () => {
                      if (!session?.user?.id) return
                      setInviteJoining(true)
                      setInviteError(null)
                      try {
                        const { data, error } = await supabase.rpc('join_list_with_code', {
                          p_user_id: session.user.id,
                          p_invite_code: pendingInvite.invite_code,
                        })

                        if (error) throw error

                        const result = Array.isArray(data)
                          ? (data[0] as JoinListRpcResult | undefined)
                          : (data as JoinListRpcResult | null)

                        if (!result) {
                          throw new Error('Respuesta vacía del servidor')
                        }

                        if (result.status !== 'JOINED' && result.status !== 'ALREADY_MEMBER') {
                          if (result.status === 'LIST_NOT_FOUND' || result.status === 'INVALID_CODE') {
                            throw new Error('El código de invitación ya no es válido')
                          }
                          throw new Error('No se pudo unir a la lista')
                        }

                        setPendingInvite(null)
                        window.location.href = '/peliculas'
                      } catch (err: any) {
                        console.error(err)
                        setInviteError(err?.message || 'Error al unirse a la lista')
                      } finally {
                        setInviteJoining(false)
                      }
                    }}
                    className="flex-1 px-4 py-3 bg-[rgba(var(--color-accent-primary-rgb),0.15)] hover:bg-[rgba(var(--color-accent-primary-rgb),0.25)] text-accent-primary font-mono text-xs font-bold uppercase tracking-widest transition-all border border-[rgba(var(--color-accent-primary-rgb),0.6)] hover:border-[rgba(var(--color-accent-primary-rgb),1)] hover:shadow-[0_0_20px_rgba(var(--color-accent-primary-rgb),0.35)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
                  >
                    {inviteJoining ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> {t('invite_notification.joining')}</>
                    ) : (
                      <>{t('invite_notification.join_button')} <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </div>
              </div>
            </HudContainer>
          </div>
        </div>
      )}
      {/* Error notification */}
      {showError && (
        <div className="fixed top-4 right-4 z-50 bg-red-500/20 border border-red-500/50 rounded-lg p-4 flex items-start gap-3 max-w-md animate-in slide-in-from-top duration-300">
          <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <span className="text-red-200 text-sm">{showError}</span>
        </div>
      )}

      <nav className="sticky top-0 z-40 backdrop-blur-md bg-black/60 border-b border-pink-500/20 px-3 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
        <Link to="/" className="group flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-pink-600 rounded-lg flex items-center justify-center font-black text-white text-xs sm:text-base shadow-[0_0_15px_rgba(219,39,119,0.5)] group-hover:scale-110 transition-all">
            {t('appLogo')}
          </div>
          <span className="text-base sm:text-2xl font-black tracking-tighter text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
            <span className="hidden sm:inline">{t('appTitle')} <Heart className="inline w-5 h-5 text-red-500 fill-red-500" /></span>
            <span className="sm:hidden">{t('navbar.myAccount')} <Heart className="inline w-4 h-4 text-red-500 fill-red-500" /></span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex bg-purple-900/20 p-1 rounded-xl border border-pink-500/10">
          <Link
            to="/peliculas"
            className="px-6 py-2 rounded-lg hover:text-pink-400 transition-all font-bold text-sm"
          >
            {t('navbar.movies')}
          </Link>
          <Link
            to="/series"
            className="px-6 py-2 rounded-lg hover:text-pink-400 transition-all font-bold text-sm"
          >
            {t('navbar.series')}
          </Link>
          <Link
            to="/perfil"
            className="px-6 py-2 rounded-lg hover:text-pink-400 transition-all font-bold text-sm"
          >
            {t('navbar.profile')}
          </Link>
          {/* Invitación link removed */}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="md:hidden p-2 text-white hover:text-pink-400 transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="relative hidden md:block" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 px-3 py-2 rounded border border-transparent hover:border-[rgba(var(--color-accent-primary-rgb),0.2)] hover:bg-[rgba(var(--color-accent-primary-rgb),0.05)] transition-all"
          >
            <div 
              className="w-8 h-8 rounded flex items-center justify-center text-[var(--color-text-primary)] font-bold text-xs overflow-hidden border-2"
              style={{ 
                borderColor: 'rgba(var(--color-accent-primary-rgb), 0.5)',
                background: 'radial-gradient(circle, rgba(var(--color-accent-primary-rgb), 0.2) 0%, transparent 70%)'
              }}
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              ) : (
                userInitials
              )}
            </div>
            <span className="text-xs font-bold font-mono tracking-widest uppercase hidden sm:inline text-[var(--color-text-primary)]">{displayName}</span>
            <Menu
              className={`w-4 h-4 text-[var(--color-text-muted)] transition-transform ${showUserMenu ? 'rotate-180' : ''
                }`}
            />
          </button>

          {showUserMenu && (
            <HudContainer className="!absolute right-0 mt-2 w-56 z-50 p-0 overflow-hidden shadow-[0_0_30px_rgba(var(--color-accent-primary-rgb),0.2)] animate-in slide-in-from-top-2 duration-200 block">
              <div className="px-5 py-4 border-b border-[rgba(var(--color-accent-primary-rgb),0.2)] bg-[rgba(var(--color-accent-primary-rgb),0.05)]">
                <p className="font-mono text-sm font-bold text-[var(--color-accent-primary)] truncate">{displayName}</p>
                <p className="font-mono text-xs text-[var(--color-text-muted)] truncate opacity-80">{userEmail}</p>
              </div>
              <Link
                to="/perfil"
                onClick={() => setShowUserMenu(false)}
                className="block w-full text-left px-5 py-3 font-mono text-xs uppercase tracking-widest text-[var(--color-text-primary)] hover:bg-[rgba(var(--color-accent-primary-rgb),0.1)] hover:text-accent-primary hover:shadow-[inset_4px_0_0_var(--color-accent-primary)] transition-all font-bold"
              >
                {t('navbar.profile')}
              </Link>
              <Link
                to="/ajustes"
                onClick={() => setShowUserMenu(false)}
                className="block w-full text-left px-5 py-3 font-mono text-xs uppercase tracking-widest text-[var(--color-text-primary)] hover:bg-[rgba(var(--color-accent-primary-rgb),0.1)] hover:text-accent-primary hover:shadow-[inset_4px_0_0_var(--color-accent-primary)] transition-all font-bold"
              >
                {t('navbar.settings')}
              </Link>
              <button
                onClick={() => {
                  signOut()
                  setShowUserMenu(false)
                }}
                className="w-full text-left px-5 py-4 font-mono text-xs uppercase tracking-widest text-accent-secondary hover:bg-[rgba(var(--color-accent-secondary-rgb),0.1)] hover:shadow-[inset_4px_0_0_var(--color-accent-secondary)] transition-all font-bold border-t border-[rgba(var(--color-accent-primary-rgb),0.2)] bg-[rgba(var(--color-bg-base-rgb),0.6)] flex items-center gap-2"
              >
                <LogOut className="w-4 h-4 opacity-70" /> {t('navbar.logout')}
              </button>
            </HudContainer>
          )}
        </div>

        {/* Mobile Navigation Menu */}
        {showMobileMenu && (
          <HudContainer className="md:hidden !absolute top-full left-0 right-0 z-50 p-0 overflow-hidden shadow-[0_0_30px_rgba(var(--color-accent-primary-rgb),0.2)] animate-in slide-in-from-top-2 duration-200 block border-t-0 rounded-t-none">
            <div className="px-4 py-3 border-b border-[rgba(var(--color-accent-primary-rgb),0.2)] bg-[rgba(var(--color-accent-primary-rgb),0.05)] flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center text-[var(--color-text-primary)] font-bold text-sm overflow-hidden border-2"
                style={{ 
                  borderColor: 'rgba(var(--color-accent-primary-rgb), 0.5)',
                  background: 'radial-gradient(circle, rgba(var(--color-accent-primary-rgb), 0.2) 0%, transparent 70%)'
                }}
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                ) : (
                  userInitials
                )}
              </div>
              <div className="overflow-hidden">
                <p className="font-mono text-sm font-bold text-[var(--color-accent-primary)] truncate">{displayName}</p>
                <p className="font-mono text-xs text-[var(--color-text-muted)] truncate">{userEmail}</p>
              </div>
            </div>
            <Link
              to="/peliculas"
              onClick={() => setShowMobileMenu(false)}
              className="block w-full text-left px-5 py-4 font-mono text-xs uppercase tracking-widest text-[var(--color-text-primary)] hover:bg-[rgba(var(--color-accent-primary-rgb),0.1)] hover:text-accent-primary hover:shadow-[inset_4px_0_0_var(--color-accent-primary)] transition-all font-bold border-b border-[rgba(var(--color-accent-primary-rgb),0.2)] flex items-center gap-3"
            >
              <Film className="w-4 h-4 opacity-70" /> {t('navbar.movies')}
            </Link>
            <Link
              to="/series"
              onClick={() => setShowMobileMenu(false)}
              className="block w-full text-left px-5 py-4 font-mono text-xs uppercase tracking-widest text-[var(--color-text-primary)] hover:bg-[rgba(var(--color-accent-primary-rgb),0.1)] hover:text-accent-primary hover:shadow-[inset_4px_0_0_var(--color-accent-primary)] transition-all font-bold border-b border-[rgba(var(--color-accent-primary-rgb),0.2)] flex items-center gap-3"
            >
              <Tv className="w-4 h-4 opacity-70" /> {t('navbar.series')}
            </Link>
            <Link
              to="/perfil"
              onClick={() => setShowMobileMenu(false)}
              className="block w-full text-left px-5 py-4 font-mono text-xs uppercase tracking-widest text-[var(--color-text-primary)] hover:bg-[rgba(var(--color-accent-primary-rgb),0.1)] hover:text-accent-primary hover:shadow-[inset_4px_0_0_var(--color-accent-primary)] transition-all font-bold border-b border-[rgba(var(--color-accent-primary-rgb),0.2)] flex items-center gap-3"
            >
              <User className="w-4 h-4 opacity-70" /> {t('navbar.profile')}
            </Link>
            <Link
              to="/ajustes"
              onClick={() => setShowMobileMenu(false)}
              className="block w-full text-left px-5 py-4 font-mono text-xs uppercase tracking-widest text-[var(--color-text-primary)] hover:bg-[rgba(var(--color-accent-primary-rgb),0.1)] hover:text-accent-primary hover:shadow-[inset_4px_0_0_var(--color-accent-primary)] transition-all font-bold border-b border-[rgba(var(--color-accent-primary-rgb),0.2)] flex items-center gap-3"
            >
              <Settings className="w-4 h-4 opacity-70" /> {t('navbar.settings')}
            </Link>
            {/* Invitación link removed from mobile menu */}
            <button
              onClick={() => {
                signOut()
                setShowMobileMenu(false)
              }}
              className="w-full text-left px-5 py-4 font-mono text-xs uppercase tracking-widest text-accent-secondary hover:bg-[rgba(var(--color-accent-secondary-rgb),0.1)] hover:shadow-[inset_4px_0_0_var(--color-accent-secondary)] transition-all font-bold flex items-center gap-3 bg-[rgba(var(--color-bg-base-rgb),0.6)]"
            >
              <LogOut className="w-4 h-4 opacity-70" /> {t('navbar.logout')}
            </button>
          </HudContainer>
        )}
      </nav>

      <main className="max-w-7xl mx-auto p-4">
        <Suspense fallback={<PageLoadingSkeleton />}>
          <Routes>
            <Route
              path="/"
              element={
                <div className="max-w-4xl mx-auto space-y-12 pb-24">
                  <div className="text-center mt-12 animate-in fade-in zoom-in duration-700 space-y-6">
                    <div>
                      <h2 
                        className="text-5xl font-black mb-4 font-mono tracking-tighter"
                        style={{
                          background: 'linear-gradient(to right, var(--color-accent-primary), var(--color-accent-secondary))',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          filter: 'drop-shadow(0 0 15px rgba(var(--color-accent-primary-rgb), 0.5))'
                        }}
                      >
                        {t('greeting.welcome_back')}
                      </h2>
                      <p className="text-[var(--color-text-muted)] text-lg">
                        {t('greeting.what_to_watch', { name: displayName })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both px-4">
                    <section className="border border-[rgba(var(--color-accent-primary-rgb),0.3)] bg-[rgba(0,0,0,0.6)] p-5 md:p-8 shadow-[0_0_30px_rgba(var(--color-accent-primary-rgb),0.1)] border-l-4 border-l-accent-primary text-left"
                      style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}>
                      <div className="flex flex-col gap-1 mb-6">
                        <h3 className="text-sm md:text-base font-black uppercase tracking-widest text-accent-primary font-mono flex items-center gap-2">
                          SYS.{t('activity_feed.title')}
                        </h3>
                        <p className="text-[10px] md:text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)] font-mono opacity-80">
                          {'>'} GLOBAL_ACTIVITY_LOG
                        </p>
                      </div>

                      <ErrorBoundary FallbackComponent={SectionErrorFallback}>
                        <Suspense fallback={<ActivityFeedSkeleton />}>
                          <ActivityFeedPanel limit={20} />
                        </Suspense>
                      </ErrorBoundary>
                    </section>
                  </div>
                </div>
              }
            />
            <Route path="/peliculas" element={
              <ErrorBoundary FallbackComponent={SectionErrorFallback} onError={handleSectionError} onReset={() => window.location.reload()}>
                <Peliculas />
              </ErrorBoundary>
            } />
            <Route path="/series" element={
              <ErrorBoundary FallbackComponent={SectionErrorFallback} onError={handleSectionError} onReset={() => window.location.reload()}>
                <Series />
              </ErrorBoundary>
            } />
            <Route path="/perfil" element={
              <ErrorBoundary FallbackComponent={SectionErrorFallback} onError={handleSectionError} onReset={() => window.location.reload()}>
                <Perfil />
              </ErrorBoundary>
            } />
            <Route path="/ajustes" element={
              <ErrorBoundary FallbackComponent={SectionErrorFallback} onError={handleSectionError} onReset={() => window.location.reload()}>
                <Ajustes />
              </ErrorBoundary>
            } />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>

        {/* Spotify Players - Only on desktop */}
        {location.pathname === '/' && (
          <>
            <Suspense fallback={<SpotifyWidgetSkeleton />}>
              <div
                className="hidden lg:block"
                onMouseDown={handleMouseDown}
                style={{
                  position: 'fixed',
                  left: `${playerPosition.x}px`,
                  top: `${playerPosition.y}px`,
                  zIndex: 30
                }}
              >
                <SpotifyGlassCard
                  spotifyUrl="https://open.spotify.com/embed/playlist/3WyehWydbIc9FCDVDHbTbZ?utm_source=generator&theme=0"
                  accentColor="rgb(168, 85, 247)"
                  isDragging={isDragging}
                />
              </div>
            </Suspense>

            <Suspense fallback={<SpotifyWidgetSkeleton />}>
              <div
                className="hidden lg:block"
                onMouseDown={handlePlaylistMouseDown}
                style={{
                  position: 'fixed',
                  left: `${playlistPosition.x}px`,
                  top: `${playlistPosition.y}px`,
                  zIndex: 30,
                  pointerEvents: 'auto'
                }}
              >
                <SpotifyGlassCard
                  spotifyUrl="https://open.spotify.com/embed/playlist/6y6uFhkd4QSgiZ4XBZekNb?utm_source=generator"
                  accentColor="rgb(168, 85, 247)"
                  isDragging={isPlaylistDragging}
                />
              </div>
            </Suspense>
          </>
        )}
      </main>
    </div>
  )
}

export default App
