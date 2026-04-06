import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Menu,
  Film,
  Tv,
  User,
  Settings,
  LogOut,
  Heart,
} from 'lucide-react'
import { useAuth } from '@/features/auth'
import { useUserProfile } from '@/features/profile'
import HudContainer from '@/features/shared/components/HudContainer'
import { useTheme } from '@/features/shared'
import type { ThemePreference } from '@/features/shared'
import { formatRetroHeading } from '@/features/shared/utils/textUtils'
/** Fallback si aún no existe public/logo-navbar.webp (ej. sin ejecutar npm run icons). */
import appLogoPngFallback from '../../../../assets/icon-sin-fondo.png'

const AppNavbar: React.FC = () => {
  const { signOut, session } = useAuth()
  const { profile } = useUserProfile()
  const { t } = useTranslation()
  const { theme, changeTheme } = useTheme()
  const isRetroCartoon = theme === 'retro-cartoon'
  const isTerminal = theme === 'terminal'
  const isCyberpunk = theme === 'cyberpunk'

  const THEMES: { value: ThemePreference; label: string; color: string }[] = [
    { value: 'cyberpunk', label: 'CYB', color: 'rgba(var(--color-accent-primary-rgb),1)' },
    { value: 'terminal', label: 'TERM', color: '#34d399' },
    { value: 'retro-cartoon', label: 'RETRO', color: '#111111' },
  ]

  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

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

  const userEmail = session?.user?.email || 'Usuario'
  const displayName = profile?.username || userEmail.split('@')[0]
  const userInitials = displayName.substring(0, 2).toUpperCase()

  return (
    <nav className={`app-navbar sticky top-0 z-40 flex items-center justify-between border-b px-3 py-3 sm:px-6 sm:py-4 lg:px-8 relative ${
      isCyberpunk
        ? 'border-b-[rgba(0,255,255,0.55)] bg-[rgba(2,2,10,0.72)] shadow-[0_2px_14px_rgba(0,255,255,0.16)] backdrop-blur-[12px]'
        : 'border-[rgba(var(--color-accent-primary-rgb),0.2)] bg-[var(--color-bg-primary)] backdrop-blur-md'
    }`}>
      <Link to="/" className="group flex items-center gap-2 sm:gap-3">
        <picture>
          <source srcSet="/logo-navbar.webp" type="image/webp" />
          <img
            src={appLogoPngFallback}
            alt="Logo de la App"
            width={160}
            height={40}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            className={`h-8 w-auto max-h-10 object-contain shrink-0 transition-all duration-300 group-hover:scale-110 sm:h-10 ${
              isRetroCartoon
                ? 'drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] contrast-125 saturate-75'
                : 'drop-shadow-[0_0_10px_rgba(var(--color-accent-secondary-rgb),0.35)]'
            }`}
          />
        </picture>
        <span className={`text-base sm:text-2xl font-black tracking-tighter text-[var(--color-text-primary)] ${isTerminal || isCyberpunk ? 'theme-heading-font' : ''} ${isCyberpunk ? 'cyberpunk-text-glow' : ''}`}>
          <span className="hidden sm:inline">
            <span className={isRetroCartoon || isCyberpunk ? 'theme-heading-font uppercase' : ''}>
              {formatRetroHeading(t('appTitle'), theme)}
            </span>{' '}
            <Heart className="inline w-5 h-5 text-red-500 fill-red-500" />
          </span>
          <span className="sm:hidden">
            <span className={isRetroCartoon || isCyberpunk ? 'theme-heading-font uppercase' : ''}>
              {formatRetroHeading(t('navbar.myAccount'), theme)}
            </span>{' '}
            <Heart className="inline w-4 h-4 text-red-500 fill-red-500" />
          </span>
        </span>
      </Link>

      <div className={`absolute left-1/2 hidden -translate-x-1/2 p-1 md:flex ${
        isCyberpunk
          ? 'rounded-full border border-[rgba(0,255,255,0.4)] bg-[rgba(2,2,10,0.72)] shadow-[0_0_14px_rgba(255,0,255,0.16)] backdrop-blur-[12px]'
          : isTerminal
          ? 'rounded-md border border-[rgba(var(--color-accent-primary-rgb),0.5)] bg-[rgba(0,0,0,0.88)] shadow-[0_0_12px_rgba(var(--color-accent-primary-rgb),0.12)]'
          : 'rounded-xl border border-[rgba(var(--color-accent-primary-rgb),0.12)] bg-[rgba(var(--color-accent-primary-rgb),0.06)]'
      }`}>
        <Link to="/peliculas" className={`px-6 py-2 rounded-lg hover:text-accent-primary transition-all font-bold text-sm text-[var(--color-text-primary)] ${isRetroCartoon || isTerminal || isCyberpunk ? 'theme-heading-font uppercase' : ''} ${isCyberpunk ? 'cyberpunk-nav-link' : ''}`}>
          {formatRetroHeading(t('navbar.movies'), theme)}
        </Link>
        <Link to="/series" className={`px-6 py-2 rounded-lg hover:text-accent-primary transition-all font-bold text-sm text-[var(--color-text-primary)] ${isRetroCartoon || isTerminal || isCyberpunk ? 'theme-heading-font uppercase' : ''} ${isCyberpunk ? 'cyberpunk-nav-link' : ''}`}>
          {formatRetroHeading(t('navbar.series'), theme)}
        </Link>
        <Link to="/perfil" className={`px-6 py-2 rounded-lg hover:text-accent-primary transition-all font-bold text-sm text-[var(--color-text-primary)] ${isRetroCartoon || isTerminal || isCyberpunk ? 'theme-heading-font uppercase' : ''} ${isCyberpunk ? 'cyberpunk-nav-link' : ''}`}>
          {formatRetroHeading(t('navbar.profile'), theme)}
        </Link>
      </div>

      <button
        onClick={() => setShowMobileMenu(!showMobileMenu)}
        className="md:hidden p-2 text-[var(--color-text-primary)] hover:text-accent-primary transition-colors"
      >
        <Menu className="w-6 h-6" />
      </button>

      <div className="relative hidden md:block" ref={userMenuRef}>
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className={`flex items-center gap-3 px-3 py-2 rounded border transition-all ${
            isCyberpunk
              ? 'rounded-full border-[rgba(0,255,255,0.35)] bg-[rgba(2,2,10,0.66)] hover:border-[rgba(0,255,255,0.85)] hover:bg-[rgba(255,0,255,0.08)]'
              : isTerminal
              ? 'rounded-md border-[rgba(var(--color-accent-primary-rgb),0.45)] bg-[rgba(0,0,0,0.75)] hover:border-[rgba(var(--color-accent-primary-rgb),0.9)] hover:bg-[rgba(var(--color-accent-primary-rgb),0.08)]'
              : 'border-transparent hover:border-[rgba(var(--color-accent-primary-rgb),0.2)] hover:bg-[rgba(var(--color-accent-primary-rgb),0.05)]'
          }`}
        >
          <div
            className="w-8 h-8 rounded flex items-center justify-center text-[var(--color-text-primary)] font-bold text-xs overflow-hidden border-2"
            style={{
              borderColor: 'rgba(var(--color-accent-primary-rgb), 0.5)',
              background: 'radial-gradient(circle, rgba(var(--color-accent-primary-rgb), 0.2) 0%, transparent 70%)',
            }}
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Avatar"
                className="w-full h-full object-cover"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            ) : (
              userInitials
            )}
          </div>
          <span className={`text-xs font-bold tracking-widest uppercase hidden sm:inline text-[var(--color-text-primary)] ${isRetroCartoon || isTerminal || isCyberpunk ? 'theme-heading-font' : 'font-mono'} ${isCyberpunk ? 'cyberpunk-text-glow' : ''}`}>
            {formatRetroHeading(displayName, theme)}
          </span>
          <Menu className={`w-4 h-4 text-[var(--color-text-primary)] transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
        </button>

        {showUserMenu && (
          <HudContainer className={`!absolute right-0 mt-2 w-56 z-50 p-0 overflow-hidden animate-in slide-in-from-top-2 duration-200 block ${
            isCyberpunk
              ? 'cyberpunk-surface shadow-[0_0_24px_rgba(255,0,255,0.18)] backdrop-blur-[12px]'
              : 'shadow-[0_0_30px_rgba(var(--color-accent-primary-rgb),0.2)]'
          }`}>
            <div className="px-5 py-4 border-b border-[rgba(var(--color-accent-primary-rgb),0.2)] bg-[rgba(var(--color-accent-primary-rgb),0.05)]">
              <p className={`text-sm font-bold text-[var(--color-text-primary)] truncate ${isRetroCartoon || isTerminal || isCyberpunk ? 'theme-heading-font uppercase' : 'font-mono'} ${isCyberpunk ? 'cyberpunk-text-glow' : ''}`}>{formatRetroHeading(displayName, theme)}</p>
              <p className={`text-xs text-[var(--color-text-muted)] truncate opacity-80 ${isCyberpunk ? 'theme-body-font' : 'font-mono'}`}>{userEmail}</p>
            </div>

            <Link
              to="/perfil"
              onClick={() => setShowUserMenu(false)}
              className={`block w-full text-left px-5 py-3 text-xs uppercase tracking-widest text-[var(--color-text-primary)] hover:bg-[rgba(var(--color-accent-primary-rgb),0.1)] hover:text-accent-primary hover:shadow-[inset_4px_0_0_var(--color-accent-primary)] transition-all font-bold ${isRetroCartoon || isTerminal || isCyberpunk ? 'theme-heading-font' : 'font-mono'} ${isCyberpunk ? 'cyberpunk-nav-link' : ''}`}
            >
              {formatRetroHeading(t('navbar.profile'), theme)}
            </Link>

            <Link
              to="/ajustes"
              onClick={() => setShowUserMenu(false)}
              className={`block w-full text-left px-5 py-3 text-xs uppercase tracking-widest text-[var(--color-text-primary)] hover:bg-[rgba(var(--color-accent-primary-rgb),0.1)] hover:text-accent-primary hover:shadow-[inset_4px_0_0_var(--color-accent-primary)] transition-all font-bold ${isRetroCartoon || isTerminal || isCyberpunk ? 'theme-heading-font' : 'font-mono'} ${isCyberpunk ? 'cyberpunk-nav-link' : ''}`}
            >
              {formatRetroHeading(t('navbar.settings'), theme)}
            </Link>

            <div className="px-5 py-3 border-t border-[rgba(var(--color-accent-primary-rgb),0.15)]">
              <p className={`text-[9px] uppercase tracking-widest text-[var(--color-text-muted)] mb-2 opacity-70 ${isRetroCartoon || isTerminal || isCyberpunk ? 'theme-heading-font' : 'font-mono'}`}>{formatRetroHeading('Tema', theme)}</p>
              <div className="flex gap-1.5">
                {THEMES.map(({ value, label, color }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => { changeTheme(value); setShowUserMenu(false) }}
                    title={label}
                    className={`flex-1 py-1.5 text-[9px] font-bold uppercase tracking-widest border transition-all ${
                      isCyberpunk ? 'cyberpunk-pill theme-heading-font px-2' : isRetroCartoon || isTerminal ? 'theme-heading-font rounded' : 'font-mono rounded'
                    }`}
                    style={{
                      borderColor: theme === value ? color : 'rgba(255,255,255,0.1)',
                      color: theme === value ? color : 'var(--color-text-muted)',
                      background: theme === value ? `color-mix(in srgb, ${color} 15%, transparent)` : 'transparent',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                signOut()
                setShowUserMenu(false)
              }}
              className={`w-full text-left px-5 py-4 text-xs uppercase tracking-widest text-[var(--color-text-primary)] hover:bg-[rgba(var(--color-accent-secondary-rgb),0.1)] hover:shadow-[inset_4px_0_0_var(--color-accent-secondary)] transition-all font-bold border-t border-[rgba(var(--color-accent-primary-rgb),0.2)] bg-[var(--color-bg-secondary)] flex items-center gap-2 ${isRetroCartoon || isTerminal || isCyberpunk ? 'theme-heading-font' : 'font-mono'} ${isCyberpunk ? 'cyberpunk-nav-link' : ''}`}
            >
              <LogOut className="w-4 h-4 opacity-70" /> {formatRetroHeading(t('navbar.logout'), theme)}
            </button>
          </HudContainer>
        )}
      </div>

      {showMobileMenu && (
        <div
          ref={mobileMenuRef}
          className="md:hidden absolute top-full left-0 right-0 z-50 animate-in slide-in-from-top-2 duration-200 border-t-0 overflow-hidden"
          style={{
            background: isCyberpunk ? 'rgba(2,2,10,0.72)' : 'var(--color-bg-primary)',
            borderBottom: isCyberpunk ? '1px solid rgba(0,255,255,0.5)' : '1px solid rgba(var(--color-accent-primary-rgb), 0.25)',
            backdropFilter: isCyberpunk ? 'blur(12px)' : 'blur(16px)',
            boxShadow: isCyberpunk ? '0 8px 24px rgba(255,0,255,0.16)' : '0 8px 24px rgba(var(--color-accent-primary-rgb),0.12)',
          }}
        >
            <div className="px-4 py-3 border-b border-[rgba(var(--color-accent-primary-rgb),0.2)] bg-[rgba(var(--color-accent-primary-rgb),0.05)] flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-[var(--color-text-primary)] font-bold text-sm overflow-hidden border-2"
                style={{
                  borderColor: 'rgba(var(--color-accent-primary-rgb), 0.5)',
                  background: 'radial-gradient(circle, rgba(var(--color-accent-primary-rgb), 0.2) 0%, transparent 70%)',
                }}
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                ) : (
                  userInitials
                )}
              </div>
              <div className="overflow-hidden">
                <p className={`text-sm font-bold text-[var(--color-text-primary)] truncate ${isRetroCartoon || isCyberpunk ? 'theme-heading-font uppercase' : 'font-mono'} ${isCyberpunk ? 'cyberpunk-text-glow' : ''}`}>{formatRetroHeading(displayName, theme)}</p>
                <p className={`text-xs text-[var(--color-text-muted)] truncate ${isCyberpunk ? 'theme-body-font' : 'font-mono'}`}>{userEmail}</p>
              </div>
            </div>

            <Link
              to="/peliculas"
              onClick={() => setShowMobileMenu(false)}
              className={`block w-full text-left px-5 py-4 text-xs uppercase tracking-widest text-[var(--color-text-primary)] hover:bg-[rgba(var(--color-accent-primary-rgb),0.1)] hover:text-accent-primary hover:shadow-[inset_4px_0_0_var(--color-accent-primary)] transition-all font-bold border-b border-[rgba(var(--color-accent-primary-rgb),0.2)] flex items-center gap-3 ${isRetroCartoon || isCyberpunk ? 'theme-heading-font' : 'font-mono'} ${isCyberpunk ? 'cyberpunk-nav-link' : ''}`}
            >
              <Film className="w-4 h-4 opacity-70" /> {formatRetroHeading(t('navbar.movies'), theme)}
            </Link>

            <Link
              to="/series"
              onClick={() => setShowMobileMenu(false)}
              className={`block w-full text-left px-5 py-4 text-xs uppercase tracking-widest text-[var(--color-text-primary)] hover:bg-[rgba(var(--color-accent-primary-rgb),0.1)] hover:text-accent-primary hover:shadow-[inset_4px_0_0_var(--color-accent-primary)] transition-all font-bold border-b border-[rgba(var(--color-accent-primary-rgb),0.2)] flex items-center gap-3 ${isRetroCartoon || isCyberpunk ? 'theme-heading-font' : 'font-mono'} ${isCyberpunk ? 'cyberpunk-nav-link' : ''}`}
            >
              <Tv className="w-4 h-4 opacity-70" /> {formatRetroHeading(t('navbar.series'), theme)}
            </Link>

            <Link
              to="/perfil"
              onClick={() => setShowMobileMenu(false)}
              className={`block w-full text-left px-5 py-4 text-xs uppercase tracking-widest text-[var(--color-text-primary)] hover:bg-[rgba(var(--color-accent-primary-rgb),0.1)] hover:text-accent-primary hover:shadow-[inset_4px_0_0_var(--color-accent-primary)] transition-all font-bold border-b border-[rgba(var(--color-accent-primary-rgb),0.2)] flex items-center gap-3 ${isRetroCartoon || isCyberpunk ? 'theme-heading-font' : 'font-mono'} ${isCyberpunk ? 'cyberpunk-nav-link' : ''}`}
            >
              <User className="w-4 h-4 opacity-70" /> {formatRetroHeading(t('navbar.profile'), theme)}
            </Link>

            <Link
              to="/ajustes"
              onClick={() => setShowMobileMenu(false)}
              className={`block w-full text-left px-5 py-4 text-xs uppercase tracking-widest text-[var(--color-text-primary)] hover:bg-[rgba(var(--color-accent-primary-rgb),0.1)] hover:text-accent-primary hover:shadow-[inset_4px_0_0_var(--color-accent-primary)] transition-all font-bold border-b border-[rgba(var(--color-accent-primary-rgb),0.2)] flex items-center gap-3 ${isRetroCartoon || isCyberpunk ? 'theme-heading-font' : 'font-mono'} ${isCyberpunk ? 'cyberpunk-nav-link' : ''}`}
            >
              <Settings className="w-4 h-4 opacity-70" /> {formatRetroHeading(t('navbar.settings'), theme)}
            </Link>

            <div className="px-5 py-3 border-t border-[rgba(var(--color-accent-primary-rgb),0.15)]">
              <p className={`text-[9px] uppercase tracking-widest text-[var(--color-text-muted)] mb-2 opacity-70 ${isRetroCartoon || isCyberpunk ? 'theme-heading-font' : 'font-mono'}`}>{formatRetroHeading('Tema', theme)}</p>
              <div className="flex gap-1.5">
                {THEMES.map(({ value, label, color }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => { changeTheme(value); setShowMobileMenu(false) }}
                    title={label}
                    className={`flex-1 py-1.5 text-[9px] font-bold uppercase tracking-widest border transition-all ${
                      isCyberpunk ? 'cyberpunk-pill theme-heading-font px-2' : isRetroCartoon ? 'theme-heading-font rounded' : 'font-mono rounded'
                    }`}
                    style={{
                      borderColor: theme === value ? color : 'rgba(255,255,255,0.1)',
                      color: theme === value ? color : 'var(--color-text-muted)',
                      background: theme === value ? `color-mix(in srgb, ${color} 15%, transparent)` : 'transparent',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                signOut()
                setShowMobileMenu(false)
              }}
              className={`w-full text-left px-5 py-4 text-xs uppercase tracking-widest text-[var(--color-text-primary)] hover:bg-[rgba(var(--color-accent-secondary-rgb),0.1)] hover:shadow-[inset_4px_0_0_var(--color-accent-secondary)] transition-all font-bold flex items-center gap-3 bg-[var(--color-bg-secondary)] ${isRetroCartoon || isCyberpunk ? 'theme-heading-font' : 'font-mono'} ${isCyberpunk ? 'cyberpunk-nav-link' : ''}`}
            >
              <LogOut className="w-4 h-4 opacity-70" /> {formatRetroHeading(t('navbar.logout'), theme)}
            </button>
        </div>
      )}
    </nav>
  )
}

export default AppNavbar
