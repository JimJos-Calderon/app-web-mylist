import React, { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
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

/** Fallback ligero (~64×64) en `public/`; no importar PNG grandes (evita inflar el bundle JS). */
const NAV_LOGO_WEBP = '/logo-navbar.webp'
const NAV_LOGO_PNG_FALLBACK = '/pwa-64x64.png'

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
    { value: 'retro-cartoon', label: 'RETRO', color: '#335C67' },
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
    <nav
      className={`app-navbar sticky top-0 z-40 flex min-h-fit items-center justify-between border-b px-3 lg:px-8 relative ${
        isCyberpunk
          ? 'border-b-[rgba(0,255,255,0.55)] bg-[rgba(2,2,10,0.72)] py-3 shadow-[0_2px_14px_rgba(0,255,255,0.16)] backdrop-blur-[12px] sm:px-6 sm:py-4'
          : isRetroCartoon
            ? 'border-b-2 border-black bg-retro-cyan min-h-[70px] py-4 sm:px-6'
            : 'border-[rgba(var(--color-accent-primary-rgb),0.2)] bg-[var(--color-bg-primary)] py-3 backdrop-blur-md sm:px-6 sm:py-4'
      }`}
    >
      <Link
        to="/"
        className="group flex min-w-0 flex-1 items-center gap-2 sm:max-w-none sm:flex-initial sm:gap-3"
      >
        <picture>
          <source srcSet={NAV_LOGO_WEBP} type="image/webp" />
          <img
            src={NAV_LOGO_PNG_FALLBACK}
            alt="Logo de la App"
            width={160}
            height={40}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            className={`h-7 w-auto max-h-9 shrink-0 object-contain transition-all duration-300 group-hover:scale-105 sm:h-10 sm:max-h-10 sm:group-hover:scale-110 ${
              isRetroCartoon
                ? 'drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] contrast-125 saturate-75'
                : 'drop-shadow-[0_0_10px_rgba(var(--color-accent-secondary-rgb),0.35)]'
            }`}
          />
        </picture>
        <span
          className={`min-w-0 truncate text-sm font-black tracking-tighter sm:text-2xl ${isRetroCartoon ? '!text-[var(--color-bg-primary)] theme-heading-font font-heading' : 'text-[var(--color-text-primary)]'} ${isTerminal || isCyberpunk ? 'theme-heading-font' : ''} ${isCyberpunk ? 'cyberpunk-text-glow' : ''}`}
        >
          <span className="hidden sm:inline">
            <span className={isRetroCartoon || isCyberpunk ? 'theme-heading-font uppercase' : ''}>
              {formatRetroHeading(t('appTitle'), theme)}
            </span>{' '}
            <Heart className={`inline w-5 h-5 ${isRetroCartoon ? 'fill-[var(--color-retro-yellow)] text-[var(--color-retro-yellow)] [stroke:black] [stroke-width:2px] [paint-order:stroke_fill]' : 'text-red-500 fill-red-500'}`} />
          </span>
          <span className="inline sm:hidden">
            <span className={isRetroCartoon || isCyberpunk ? 'theme-heading-font uppercase' : ''}>
              {formatRetroHeading(t('navbar.myAccount'), theme)}
            </span>{' '}
            <Heart className={`inline h-3.5 w-3.5 align-[-0.125em] ${isRetroCartoon ? 'fill-[var(--color-retro-yellow)] text-[var(--color-retro-yellow)] [stroke:black] [stroke-width:2px] [paint-order:stroke_fill]' : 'text-red-500 fill-red-500'}`} />
          </span>
        </span>
      </Link>

      <div
        className={`app-navbar__nav-cluster absolute left-1/2 z-20 hidden -translate-x-1/2 md:flex md:flex-row items-center justify-center gap-6 md:gap-8 ${
          isRetroCartoon
            ? 'top-1/2 -translate-y-1/2 border-0 bg-transparent shadow-none py-2 md:py-3'
            : 'top-1/2 -translate-y-1/2 py-4 md:py-6 ' +
              (isCyberpunk
                ? 'rounded-full border border-[rgba(0,255,255,0.4)] bg-[rgba(2,2,10,0.72)] px-2 shadow-[0_0_14px_rgba(255,0,255,0.16)] backdrop-blur-[12px]'
                : isTerminal
                  ? 'rounded-md border border-[rgba(var(--color-accent-primary-rgb),0.5)] bg-[rgba(0,0,0,0.88)] px-2 shadow-[0_0_12px_rgba(var(--color-accent-primary-rgb),0.12)]'
                  : 'rounded-xl border border-[rgba(var(--color-accent-primary-rgb),0.12)] bg-[rgba(var(--color-accent-primary-rgb),0.06)] px-2')
        }`}
      >
        <NavLink
          to="/peliculas"
          className={({ isActive }) =>
            isRetroCartoon
              ? `ui-nav-button ui-nav-button--peliculas${isActive ? ' ui-nav-button--active' : ''}`
              : `px-6 py-2 rounded-lg hover:text-accent-primary transition-all font-bold text-sm text-[var(--color-text-primary)] ${isTerminal || isCyberpunk ? 'theme-heading-font uppercase' : ''} ${isCyberpunk ? 'cyberpunk-nav-link' : ''}`
          }
        >
          {formatRetroHeading(t('navbar.movies'), theme)}
        </NavLink>
        <NavLink
          to="/series"
          className={({ isActive }) =>
            isRetroCartoon
              ? `ui-nav-button ui-nav-button--series${isActive ? ' ui-nav-button--active' : ''}`
              : `px-6 py-2 rounded-lg hover:text-accent-primary transition-all font-bold text-sm text-[var(--color-text-primary)] ${isTerminal || isCyberpunk ? 'theme-heading-font uppercase' : ''} ${isCyberpunk ? 'cyberpunk-nav-link' : ''}`
          }
        >
          {formatRetroHeading(t('navbar.series'), theme)}
        </NavLink>
        <NavLink
          to="/perfil"
          className={({ isActive }) =>
            isRetroCartoon
              ? `ui-nav-button ui-nav-button--perfil${isActive ? ' ui-nav-button--active' : ''}`
              : `px-6 py-2 rounded-lg hover:text-accent-primary transition-all font-bold text-sm text-[var(--color-text-primary)] ${isTerminal || isCyberpunk ? 'theme-heading-font uppercase' : ''} ${isCyberpunk ? 'cyberpunk-nav-link' : ''}`
          }
        >
          {formatRetroHeading(t('navbar.profile'), theme)}
        </NavLink>
      </div>

      <button
        type="button"
        onClick={() => setShowMobileMenu(!showMobileMenu)}
        className={
          isRetroCartoon
            ? 'app-navbar__menu-trigger md:hidden'
            : 'md:hidden flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[rgba(var(--color-accent-primary-rgb),0.25)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] shadow-sm transition-colors hover:border-[rgba(var(--color-accent-primary-rgb),0.45)] active:scale-[0.98]'
        }
        aria-expanded={showMobileMenu}
        aria-label="Menú"
      >
        <Menu className="h-6 w-6" strokeWidth={isRetroCartoon ? 2.75 : 2.5} />
      </button>

      <div className="relative hidden md:block" ref={userMenuRef}>
        <button
          type="button"
          onClick={() => setShowUserMenu(!showUserMenu)}
          className={`flex items-center gap-3 rounded border transition-all ${
            isRetroCartoon
              ? 'border-2 border-black bg-retro-yellow px-3 py-2 !text-[var(--color-text-primary)] shadow-[2px_2px_0px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'
              : isCyberpunk
                ? 'rounded-full border-[rgba(0,255,255,0.35)] bg-[rgba(2,2,10,0.66)] px-3 py-2 hover:border-[rgba(0,255,255,0.85)] hover:bg-[rgba(255,0,255,0.08)]'
                : isTerminal
                  ? 'rounded-md border-[rgba(var(--color-accent-primary-rgb),0.45)] bg-[rgba(0,0,0,0.75)] px-3 py-2 hover:border-[rgba(var(--color-accent-primary-rgb),0.9)] hover:bg-[rgba(var(--color-accent-primary-rgb),0.08)]'
                  : 'border-transparent px-3 py-2 hover:border-[rgba(var(--color-accent-primary-rgb),0.2)] hover:bg-[rgba(var(--color-accent-primary-rgb),0.05)]'
          }`}
        >
          <div
            className={`flex h-8 w-8 items-center justify-center overflow-hidden text-xs font-bold text-[var(--color-text-primary)] shrink-0 ${
              isRetroCartoon
                ? 'rounded border-2 border-black bg-[var(--color-retro-yellow)]'
                : 'rounded border-2'
            }`}
            style={
              isRetroCartoon
                ? undefined
                : {
                    borderColor: 'rgba(var(--color-accent-primary-rgb), 0.5)',
                    background: 'radial-gradient(circle, rgba(var(--color-accent-primary-rgb), 0.2) 0%, transparent 70%)',
                  }
            }
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
          <span
            className={`hidden text-xs font-bold uppercase tracking-widest sm:inline ${isRetroCartoon ? '!text-[var(--color-text-primary)] font-heading theme-heading-font' : `text-[var(--color-text-primary)] ${isTerminal || isCyberpunk ? 'theme-heading-font' : 'font-mono'} ${isCyberpunk ? 'cyberpunk-text-glow' : ''}`}`}
          >
            {formatRetroHeading(displayName, theme)}
          </span>
          <Menu
            className={`h-4 w-4 transition-transform ${showUserMenu ? 'rotate-180' : ''} ${isRetroCartoon ? '!text-[var(--color-text-primary)]' : 'text-[var(--color-text-primary)]'}`}
            strokeWidth={2.5}
          />
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

            {isRetroCartoon ? (
              <div className="px-5 pt-3 pb-1">
                <Link
                  to="/perfil"
                  onClick={() => setShowUserMenu(false)}
                  className="app-navbar-user-menu-item block w-full text-left font-bold uppercase tracking-widest text-[var(--color-text-primary)] transition-colors theme-heading-font"
                >
                  {formatRetroHeading(t('navbar.profile'), theme)}
                </Link>
                <Link
                  to="/ajustes"
                  onClick={() => setShowUserMenu(false)}
                  className="app-navbar-user-menu-item block w-full text-left font-bold uppercase tracking-widest text-[var(--color-text-primary)] transition-colors theme-heading-font"
                >
                  {formatRetroHeading(t('navbar.settings'), theme)}
                </Link>
              </div>
            ) : (
              <>
                <Link
                  to="/perfil"
                  onClick={() => setShowUserMenu(false)}
                  className={`block w-full text-left px-5 py-3 text-xs uppercase tracking-widest text-[var(--color-text-primary)] hover:bg-[rgba(var(--color-accent-primary-rgb),0.1)] hover:text-accent-primary hover:shadow-[inset_4px_0_0_var(--color-accent-primary)] transition-all font-bold ${isTerminal || isCyberpunk ? 'theme-heading-font' : 'font-mono'} ${isCyberpunk ? 'cyberpunk-nav-link' : ''}`}
                >
                  {formatRetroHeading(t('navbar.profile'), theme)}
                </Link>
                <Link
                  to="/ajustes"
                  onClick={() => setShowUserMenu(false)}
                  className={`block w-full text-left px-5 py-3 text-xs uppercase tracking-widest text-[var(--color-text-primary)] hover:bg-[rgba(var(--color-accent-primary-rgb),0.1)] hover:text-accent-primary hover:shadow-[inset_4px_0_0_var(--color-accent-primary)] transition-all font-bold ${isTerminal || isCyberpunk ? 'theme-heading-font' : 'font-mono'} ${isCyberpunk ? 'cyberpunk-nav-link' : ''}`}
                >
                  {formatRetroHeading(t('navbar.settings'), theme)}
                </Link>
              </>
            )}

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
          className="app-navbar__mobile-dropdown md:hidden absolute top-full left-0 right-0 z-50 mx-2 mt-1 max-h-[min(82vh,28rem)] animate-in slide-in-from-top-2 overflow-y-auto overscroll-contain rounded-b-2xl border border-t-0 border-[rgba(var(--color-accent-primary-rgb),0.2)] shadow-xl duration-200"
          style={{
            background: isCyberpunk ? 'rgba(2,2,10,0.92)' : 'var(--color-bg-elevated)',
            borderBottom: isCyberpunk ? '1px solid rgba(0,255,255,0.45)' : undefined,
            backdropFilter: isCyberpunk ? 'blur(14px)' : isRetroCartoon ? undefined : 'blur(12px)',
            paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))',
          }}
        >
          <div className="app-navbar__mobile-dropdown__header flex items-center gap-3 border-b border-[rgba(var(--color-accent-primary-rgb),0.15)] bg-[rgba(var(--color-accent-primary-rgb),0.06)] px-4 py-3">
            <div
              className="app-navbar__mobile-dropdown__avatar flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 text-sm font-bold text-[var(--color-text-primary)]"
              style={{
                borderColor: 'rgba(var(--color-accent-primary-rgb), 0.45)',
                background: 'radial-gradient(circle, rgba(var(--color-accent-primary-rgb), 0.18) 0%, transparent 72%)',
              }}
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              ) : (
                userInitials
              )}
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <p
                className={`truncate text-sm font-bold text-[var(--color-text-primary)] ${isRetroCartoon || isCyberpunk || isTerminal ? 'theme-heading-font uppercase' : 'font-mono'} ${isCyberpunk ? 'cyberpunk-text-glow' : ''}`}
              >
                {formatRetroHeading(displayName, theme)}
              </p>
              <p className={`truncate text-xs text-[var(--color-text-muted)] ${isCyberpunk ? 'theme-body-font' : 'font-mono'}`}>
                {userEmail}
              </p>
            </div>
          </div>

          <NavLink
            to="/peliculas"
            onClick={() => setShowMobileMenu(false)}
            className={({ isActive }) =>
              `app-navbar__mobile-dropdown__link flex min-h-[3rem] items-center gap-3 border-b border-[rgba(var(--color-accent-primary-rgb),0.12)] px-5 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-text-primary)] transition-colors hover:bg-[rgba(var(--color-accent-primary-rgb),0.08)] ${isActive ? 'bg-[rgba(var(--color-accent-primary-rgb),0.1)] app-navbar__mobile-dropdown__link--active' : ''} ${isRetroCartoon || isCyberpunk || isTerminal ? 'theme-heading-font' : 'font-mono'} ${isCyberpunk ? 'cyberpunk-nav-link' : ''}`
            }
          >
            <Film className="h-4 w-4 shrink-0 opacity-80" />
            {formatRetroHeading(t('navbar.movies'), theme)}
          </NavLink>
          <NavLink
            to="/series"
            onClick={() => setShowMobileMenu(false)}
            className={({ isActive }) =>
              `app-navbar__mobile-dropdown__link flex min-h-[3rem] items-center gap-3 border-b border-[rgba(var(--color-accent-primary-rgb),0.12)] px-5 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-text-primary)] transition-colors hover:bg-[rgba(var(--color-accent-primary-rgb),0.08)] ${isActive ? 'bg-[rgba(var(--color-accent-primary-rgb),0.1)] app-navbar__mobile-dropdown__link--active' : ''} ${isRetroCartoon || isCyberpunk || isTerminal ? 'theme-heading-font' : 'font-mono'} ${isCyberpunk ? 'cyberpunk-nav-link' : ''}`
            }
          >
            <Tv className="h-4 w-4 shrink-0 opacity-80" />
            {formatRetroHeading(t('navbar.series'), theme)}
          </NavLink>
          <NavLink
            to="/perfil"
            onClick={() => setShowMobileMenu(false)}
            className={({ isActive }) =>
              `app-navbar__mobile-dropdown__link flex min-h-[3rem] items-center gap-3 border-b border-[rgba(var(--color-accent-primary-rgb),0.12)] px-5 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-text-primary)] transition-colors hover:bg-[rgba(var(--color-accent-primary-rgb),0.08)] ${isActive ? 'bg-[rgba(var(--color-accent-primary-rgb),0.1)] app-navbar__mobile-dropdown__link--active' : ''} ${isRetroCartoon || isCyberpunk || isTerminal ? 'theme-heading-font' : 'font-mono'} ${isCyberpunk ? 'cyberpunk-nav-link' : ''}`
            }
          >
            <User className="h-4 w-4 shrink-0 opacity-80" />
            {formatRetroHeading(t('navbar.profile'), theme)}
          </NavLink>
          <Link
            to="/ajustes"
            onClick={() => setShowMobileMenu(false)}
            className={`app-navbar__mobile-dropdown__link flex min-h-[3rem] items-center gap-3 border-b border-[rgba(var(--color-accent-primary-rgb),0.12)] px-5 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-text-primary)] transition-colors hover:bg-[rgba(var(--color-accent-primary-rgb),0.08)] ${isRetroCartoon || isCyberpunk || isTerminal ? 'theme-heading-font' : 'font-mono'} ${isCyberpunk ? 'cyberpunk-nav-link' : ''}`}
          >
            <Settings className="h-4 w-4 shrink-0 opacity-80" />
            {formatRetroHeading(t('navbar.settings'), theme)}
          </Link>

          <div className="app-navbar__mobile-dropdown__themes border-t border-[rgba(var(--color-accent-primary-rgb),0.1)] px-5 py-3">
            <p
              className={`mb-2 text-[9px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] opacity-80 ${isRetroCartoon || isCyberpunk || isTerminal ? 'theme-heading-font' : 'font-mono'}`}
            >
              {formatRetroHeading('Tema', theme)}
            </p>
            <div className="flex gap-2">
              {THEMES.map(({ value, label, color }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    changeTheme(value)
                    setShowMobileMenu(false)
                  }}
                  title={label}
                  className={`flex-1 rounded-lg border py-2 text-[9px] font-bold uppercase tracking-widest transition-all ${
                    isCyberpunk ? 'cyberpunk-pill theme-heading-font px-1' : isRetroCartoon || isTerminal ? 'theme-heading-font' : 'font-mono'
                  }`}
                  style={{
                    borderColor: theme === value ? color : 'rgba(var(--color-accent-primary-rgb),0.2)',
                    color: theme === value ? color : 'var(--color-text-muted)',
                    background: theme === value ? `color-mix(in srgb, ${color} 14%, transparent)` : 'transparent',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              signOut()
              setShowMobileMenu(false)
            }}
            className={`app-navbar__mobile-dropdown__logout flex w-full min-h-[3.25rem] items-center gap-3 border-t border-[rgba(var(--color-accent-primary-rgb),0.15)] bg-[var(--color-bg-secondary)] px-5 py-3 text-left text-xs font-bold uppercase tracking-widest text-[var(--color-text-primary)] transition-colors hover:bg-[rgba(var(--color-accent-secondary-rgb),0.08)] ${isRetroCartoon || isCyberpunk || isTerminal ? 'theme-heading-font' : 'font-mono'} ${isCyberpunk ? 'cyberpunk-nav-link' : ''}`}
          >
            <LogOut className="h-4 w-4 shrink-0 opacity-80" />
            {formatRetroHeading(t('navbar.logout'), theme)}
          </button>
        </div>
      )}
    </nav>
  )
}

export default AppNavbar
