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

const AppNavbar: React.FC = () => {
  const { signOut, session } = useAuth()
  const { profile } = useUserProfile()
  const { t } = useTranslation()
  const { theme, changeTheme } = useTheme()
  const isRetroCartoon = theme === 'retro-cartoon'

  const formatRetroLabel = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()

  const THEMES: { value: ThemePreference; label: string; color: string }[] = [
    { value: 'cyberpunk', label: 'CYB', color: 'rgba(var(--color-accent-primary-rgb),1)' },
    { value: '2advanced', label: '2ADV', color: '#38bdf8' },
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
    <nav className="app-navbar sticky top-0 z-40 flex items-center justify-between border-b border-[rgba(var(--color-accent-primary-rgb),0.2)] bg-[var(--color-bg-primary)] px-3 py-3 backdrop-blur-md sm:px-6 sm:py-4 lg:px-8 relative">
      <Link to="/" className="group flex items-center gap-2 sm:gap-3">
        <div
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center font-black text-[var(--color-text-primary)] text-xs sm:text-base group-hover:scale-110 transition-all"
          style={{
            background: 'var(--color-accent-secondary)',
            boxShadow: '0 0 15px rgba(var(--color-accent-secondary-rgb), 0.5)',
          }}
        >
          {t('appLogo')}
        </div>
        <span className="text-base sm:text-2xl font-black tracking-tighter text-[var(--color-text-primary)]">
          <span className="hidden sm:inline">
            <span className={isRetroCartoon ? 'theme-heading-font uppercase' : ''}>
              {isRetroCartoon ? formatRetroLabel(t('appTitle')) : t('appTitle')}
            </span>{' '}
            <Heart className="inline w-5 h-5 text-red-500 fill-red-500" />
          </span>
          <span className="sm:hidden">
            <span className={isRetroCartoon ? 'theme-heading-font uppercase' : ''}>
              {isRetroCartoon ? formatRetroLabel(t('navbar.myAccount')) : t('navbar.myAccount')}
            </span>{' '}
            <Heart className="inline w-4 h-4 text-red-500 fill-red-500" />
          </span>
        </span>
      </Link>

      <div className="absolute left-1/2 hidden -translate-x-1/2 rounded-xl border border-[rgba(var(--color-accent-primary-rgb),0.12)] bg-[rgba(var(--color-accent-primary-rgb),0.06)] p-1 md:flex">
        <Link to="/peliculas" className={`px-6 py-2 rounded-lg hover:text-accent-primary transition-all font-bold text-sm text-[var(--color-text-primary)] ${isRetroCartoon ? 'theme-heading-font uppercase' : ''}`}>
          {isRetroCartoon ? formatRetroLabel(t('navbar.movies')) : t('navbar.movies')}
        </Link>
        <Link to="/series" className={`px-6 py-2 rounded-lg hover:text-accent-primary transition-all font-bold text-sm text-[var(--color-text-primary)] ${isRetroCartoon ? 'theme-heading-font uppercase' : ''}`}>
          {isRetroCartoon ? formatRetroLabel(t('navbar.series')) : t('navbar.series')}
        </Link>
        <Link to="/perfil" className={`px-6 py-2 rounded-lg hover:text-accent-primary transition-all font-bold text-sm text-[var(--color-text-primary)] ${isRetroCartoon ? 'theme-heading-font uppercase' : ''}`}>
          {isRetroCartoon ? formatRetroLabel(t('navbar.profile')) : t('navbar.profile')}
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
          className="flex items-center gap-3 px-3 py-2 rounded border border-transparent hover:border-[rgba(var(--color-accent-primary-rgb),0.2)] hover:bg-[rgba(var(--color-accent-primary-rgb),0.05)] transition-all"
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
          <span className={`text-xs font-bold tracking-widest uppercase hidden sm:inline text-[var(--color-text-primary)] ${isRetroCartoon ? 'theme-heading-font' : 'font-mono'}`}>
            {isRetroCartoon ? formatRetroLabel(displayName) : displayName}
          </span>
          <Menu className={`w-4 h-4 text-[var(--color-text-primary)] transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
        </button>

        {showUserMenu && (
          <HudContainer className="!absolute right-0 mt-2 w-56 z-50 p-0 overflow-hidden shadow-[0_0_30px_rgba(var(--color-accent-primary-rgb),0.2)] animate-in slide-in-from-top-2 duration-200 block">
            <div className="px-5 py-4 border-b border-[rgba(var(--color-accent-primary-rgb),0.2)] bg-[rgba(var(--color-accent-primary-rgb),0.05)]">
              <p className={`text-sm font-bold text-[var(--color-text-primary)] truncate ${isRetroCartoon ? 'theme-heading-font uppercase' : 'font-mono'}`}>{isRetroCartoon ? formatRetroLabel(displayName) : displayName}</p>
              <p className="font-mono text-xs text-[var(--color-text-muted)] truncate opacity-80">{userEmail}</p>
            </div>

            <Link
              to="/perfil"
              onClick={() => setShowUserMenu(false)}
              className={`block w-full text-left px-5 py-3 text-xs uppercase tracking-widest text-[var(--color-text-primary)] hover:bg-[rgba(var(--color-accent-primary-rgb),0.1)] hover:text-accent-primary hover:shadow-[inset_4px_0_0_var(--color-accent-primary)] transition-all font-bold ${isRetroCartoon ? 'theme-heading-font' : 'font-mono'}`}
            >
              {isRetroCartoon ? formatRetroLabel(t('navbar.profile')) : t('navbar.profile')}
            </Link>

            <Link
              to="/ajustes"
              onClick={() => setShowUserMenu(false)}
              className={`block w-full text-left px-5 py-3 text-xs uppercase tracking-widest text-[var(--color-text-primary)] hover:bg-[rgba(var(--color-accent-primary-rgb),0.1)] hover:text-accent-primary hover:shadow-[inset_4px_0_0_var(--color-accent-primary)] transition-all font-bold ${isRetroCartoon ? 'theme-heading-font' : 'font-mono'}`}
            >
              {isRetroCartoon ? formatRetroLabel(t('navbar.settings')) : t('navbar.settings')}
            </Link>

            <div className="px-5 py-3 border-t border-[rgba(var(--color-accent-primary-rgb),0.15)]">
              <p className={`text-[9px] uppercase tracking-widest text-[var(--color-text-muted)] mb-2 opacity-70 ${isRetroCartoon ? 'theme-heading-font' : 'font-mono'}`}>{isRetroCartoon ? formatRetroLabel('Tema') : 'Tema'}</p>
              <div className="flex gap-1.5">
                {THEMES.map(({ value, label, color }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => { changeTheme(value); setShowUserMenu(false) }}
                    title={label}
                    className={`flex-1 py-1.5 text-[9px] font-bold uppercase tracking-widest rounded border transition-all ${isRetroCartoon ? 'theme-heading-font' : 'font-mono'}`}
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
              className={`w-full text-left px-5 py-4 text-xs uppercase tracking-widest text-[var(--color-text-primary)] hover:bg-[rgba(var(--color-accent-secondary-rgb),0.1)] hover:shadow-[inset_4px_0_0_var(--color-accent-secondary)] transition-all font-bold border-t border-[rgba(var(--color-accent-primary-rgb),0.2)] bg-[var(--color-bg-secondary)] flex items-center gap-2 ${isRetroCartoon ? 'theme-heading-font' : 'font-mono'}`}
            >
              <LogOut className="w-4 h-4 opacity-70" /> {isRetroCartoon ? formatRetroLabel(t('navbar.logout')) : t('navbar.logout')}
            </button>
          </HudContainer>
        )}
      </div>

      {showMobileMenu && (
        <div
          ref={mobileMenuRef}
          className="md:hidden absolute top-full left-0 right-0 z-50 animate-in slide-in-from-top-2 duration-200 border-t-0 overflow-hidden"
          style={{
            background: 'var(--color-bg-primary)',
            borderBottom: '1px solid rgba(var(--color-accent-primary-rgb), 0.25)',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 8px 24px rgba(var(--color-accent-primary-rgb),0.12)',
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
                <p className={`text-sm font-bold text-[var(--color-text-primary)] truncate ${isRetroCartoon ? 'theme-heading-font uppercase' : 'font-mono'}`}>{isRetroCartoon ? formatRetroLabel(displayName) : displayName}</p>
                <p className="font-mono text-xs text-[var(--color-text-muted)] truncate">{userEmail}</p>
              </div>
            </div>

            <Link
              to="/peliculas"
              onClick={() => setShowMobileMenu(false)}
              className={`block w-full text-left px-5 py-4 text-xs uppercase tracking-widest text-[var(--color-text-primary)] hover:bg-[rgba(var(--color-accent-primary-rgb),0.1)] hover:text-accent-primary hover:shadow-[inset_4px_0_0_var(--color-accent-primary)] transition-all font-bold border-b border-[rgba(var(--color-accent-primary-rgb),0.2)] flex items-center gap-3 ${isRetroCartoon ? 'theme-heading-font' : 'font-mono'}`}
            >
              <Film className="w-4 h-4 opacity-70" /> {isRetroCartoon ? formatRetroLabel(t('navbar.movies')) : t('navbar.movies')}
            </Link>

            <Link
              to="/series"
              onClick={() => setShowMobileMenu(false)}
              className={`block w-full text-left px-5 py-4 text-xs uppercase tracking-widest text-[var(--color-text-primary)] hover:bg-[rgba(var(--color-accent-primary-rgb),0.1)] hover:text-accent-primary hover:shadow-[inset_4px_0_0_var(--color-accent-primary)] transition-all font-bold border-b border-[rgba(var(--color-accent-primary-rgb),0.2)] flex items-center gap-3 ${isRetroCartoon ? 'theme-heading-font' : 'font-mono'}`}
            >
              <Tv className="w-4 h-4 opacity-70" /> {isRetroCartoon ? formatRetroLabel(t('navbar.series')) : t('navbar.series')}
            </Link>

            <Link
              to="/perfil"
              onClick={() => setShowMobileMenu(false)}
              className={`block w-full text-left px-5 py-4 text-xs uppercase tracking-widest text-[var(--color-text-primary)] hover:bg-[rgba(var(--color-accent-primary-rgb),0.1)] hover:text-accent-primary hover:shadow-[inset_4px_0_0_var(--color-accent-primary)] transition-all font-bold border-b border-[rgba(var(--color-accent-primary-rgb),0.2)] flex items-center gap-3 ${isRetroCartoon ? 'theme-heading-font' : 'font-mono'}`}
            >
              <User className="w-4 h-4 opacity-70" /> {isRetroCartoon ? formatRetroLabel(t('navbar.profile')) : t('navbar.profile')}
            </Link>

            <Link
              to="/ajustes"
              onClick={() => setShowMobileMenu(false)}
              className={`block w-full text-left px-5 py-4 text-xs uppercase tracking-widest text-[var(--color-text-primary)] hover:bg-[rgba(var(--color-accent-primary-rgb),0.1)] hover:text-accent-primary hover:shadow-[inset_4px_0_0_var(--color-accent-primary)] transition-all font-bold border-b border-[rgba(var(--color-accent-primary-rgb),0.2)] flex items-center gap-3 ${isRetroCartoon ? 'theme-heading-font' : 'font-mono'}`}
            >
              <Settings className="w-4 h-4 opacity-70" /> {isRetroCartoon ? formatRetroLabel(t('navbar.settings')) : t('navbar.settings')}
            </Link>

            <div className="px-5 py-3 border-t border-[rgba(var(--color-accent-primary-rgb),0.15)]">
              <p className={`text-[9px] uppercase tracking-widest text-[var(--color-text-muted)] mb-2 opacity-70 ${isRetroCartoon ? 'theme-heading-font' : 'font-mono'}`}>{isRetroCartoon ? formatRetroLabel('Tema') : 'Tema'}</p>
              <div className="flex gap-1.5">
                {THEMES.map(({ value, label, color }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => { changeTheme(value); setShowMobileMenu(false) }}
                    title={label}
                    className={`flex-1 py-1.5 text-[9px] font-bold uppercase tracking-widest rounded border transition-all ${isRetroCartoon ? 'theme-heading-font' : 'font-mono'}`}
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
              className={`w-full text-left px-5 py-4 text-xs uppercase tracking-widest text-[var(--color-text-primary)] hover:bg-[rgba(var(--color-accent-secondary-rgb),0.1)] hover:shadow-[inset_4px_0_0_var(--color-accent-secondary)] transition-all font-bold flex items-center gap-3 bg-[var(--color-bg-secondary)] ${isRetroCartoon ? 'theme-heading-font' : 'font-mono'}`}
            >
              <LogOut className="w-4 h-4 opacity-70" /> {isRetroCartoon ? formatRetroLabel(t('navbar.logout')) : t('navbar.logout')}
            </button>
        </div>
      )}
    </nav>
  )
}

export default AppNavbar
