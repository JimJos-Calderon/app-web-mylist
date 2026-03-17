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

const AppNavbar: React.FC = () => {
  const { signOut, session } = useAuth()
  const { profile } = useUserProfile()
  const { t } = useTranslation()

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
    <nav className="sticky top-0 z-40 backdrop-blur-md bg-black/60 border-b border-pink-500/20 px-3 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
      <Link to="/" className="group flex items-center gap-2 sm:gap-3">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-pink-600 rounded-lg flex items-center justify-center font-black text-white text-xs sm:text-base shadow-[0_0_15px_rgba(219,39,119,0.5)] group-hover:scale-110 transition-all">
          {t('appLogo')}
        </div>
        <span className="text-base sm:text-2xl font-black tracking-tighter text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
          <span className="hidden sm:inline">
            {t('appTitle')} <Heart className="inline w-5 h-5 text-red-500 fill-red-500" />
          </span>
          <span className="sm:hidden">
            {t('navbar.myAccount')} <Heart className="inline w-4 h-4 text-red-500 fill-red-500" />
          </span>
        </span>
      </Link>

      <div className="hidden md:flex bg-purple-900/20 p-1 rounded-xl border border-pink-500/10">
        <Link to="/peliculas" className="px-6 py-2 rounded-lg hover:text-pink-400 transition-all font-bold text-sm">
          {t('navbar.movies')}
        </Link>
        <Link to="/series" className="px-6 py-2 rounded-lg hover:text-pink-400 transition-all font-bold text-sm">
          {t('navbar.series')}
        </Link>
        <Link to="/perfil" className="px-6 py-2 rounded-lg hover:text-pink-400 transition-all font-bold text-sm">
          {t('navbar.profile')}
        </Link>
      </div>

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
          <span className="text-xs font-bold font-mono tracking-widest uppercase hidden sm:inline text-[var(--color-text-primary)]">
            {displayName}
          </span>
          <Menu className={`w-4 h-4 text-[var(--color-text-muted)] transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
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

      {showMobileMenu && (
        <HudContainer
          className="md:hidden !absolute top-full left-0 right-0 z-50 p-0 overflow-hidden shadow-[0_0_30px_rgba(var(--color-accent-primary-rgb),0.2)] animate-in slide-in-from-top-2 duration-200 block border-t-0 rounded-t-none"
        >
          <div ref={mobileMenuRef} className="contents">
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

            <button
              onClick={() => {
                signOut()
                setShowMobileMenu(false)
              }}
              className="w-full text-left px-5 py-4 font-mono text-xs uppercase tracking-widest text-accent-secondary hover:bg-[rgba(var(--color-accent-secondary-rgb),0.1)] hover:shadow-[inset_4px_0_0_var(--color-accent-secondary)] transition-all font-bold flex items-center gap-3 bg-[rgba(var(--color-bg-base-rgb),0.6)]"
            >
              <LogOut className="w-4 h-4 opacity-70" /> {t('navbar.logout')}
            </button>
          </div>
        </HudContainer>
      )}
    </nav>
  )
}

export default AppNavbar