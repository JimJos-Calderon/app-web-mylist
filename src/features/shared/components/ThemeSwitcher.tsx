import React from 'react'
import { useTranslation } from 'react-i18next'
import { Palette, Monitor } from 'lucide-react'
import { ThemePreference, useTheme } from '@/features/shared'
import HudContainer from '@/features/shared/components/HudContainer'

type ThemeOption = {
  value: ThemePreference
  titleKey: string
  descriptionKey: string
  Icon: React.ComponentType<{ className?: string }>
  previewClassName: string
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    value: 'cyberpunk',
    titleKey: 'settings.theme_options.cyberpunk.title',
    descriptionKey: 'settings.theme_options.cyberpunk.description',
    Icon: Palette,
    previewClassName: 'from-cyan-400 via-purple-500 to-pink-500',
  },
  {
    value: 'terminal',
    titleKey: 'settings.theme_options.terminal.title',
    descriptionKey: 'settings.theme_options.terminal.description',
    Icon: Monitor,
    previewClassName: 'from-emerald-500 via-emerald-400 to-black',
  },
  {
    value: 'retro-cartoon',
    titleKey: 'settings.theme_options.retro_cartoon.title',
    descriptionKey: 'settings.theme_options.retro_cartoon.description',
    Icon: Palette,
    previewClassName: 'from-stone-100 via-stone-400 to-black',
  },
]

const ThemeSwitcher: React.FC = () => {
  const { t } = useTranslation()
  const { theme, changeTheme, isChangingTheme, error } = useTheme()
  const isRetroCartoonTheme = theme === 'retro-cartoon'
  const isTerminalTheme = theme === 'terminal'
  const isCyberpunkTheme = theme === 'cyberpunk'

  const retroFontClass = 'theme-heading-font font-heading'

  return (
    <HudContainer className={`p-6 sm:p-8 ${isRetroCartoonTheme ? retroFontClass : ''}`}>
      <header className="mb-5 border-b border-[rgba(var(--color-accent-primary-rgb),0.2)] pb-4">
        <h2 className={`text-xl font-black tracking-widest uppercase mb-2 flex items-center gap-3 text-[var(--color-text-primary)] ${isRetroCartoonTheme ? retroFontClass : isTerminalTheme || isCyberpunkTheme ? 'theme-heading-font' : 'font-mono'} ${isCyberpunkTheme ? 'cyberpunk-text-glow' : ''}`}>
          <Palette className="w-5 h-5 text-accent-primary" />
          {t('settings.theme_title')}
        </h2>
        <p
          className={`text-[var(--color-text-muted)] text-sm ${
            isRetroCartoonTheme ? retroFontClass : isTerminalTheme || isCyberpunkTheme ? 'theme-body-font' : 'font-mono'
          }`}
        >
          {t('settings.theme_description')}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {THEME_OPTIONS.map(({ value, titleKey, descriptionKey, Icon, previewClassName }) => {
          const isActive = theme === value

          return (
            <button
              key={value}
              type="button"
              onClick={() => changeTheme(value)}
              disabled={isChangingTheme}
              aria-pressed={isActive}
              className={`text-left rounded-lg border p-4 transition-all duration-300 group disabled:opacity-60 disabled:cursor-not-allowed ${
                isRetroCartoonTheme ? retroFontClass : ''
              } ${
                isRetroCartoonTheme
                  ? isActive
                    ? 'bg-black text-white border-[3px] border-black shadow-[6px_6px_0px_0px_#000000] rounded-xl'
                    : 'bg-white text-black border-[3px] border-black shadow-[4px_4px_0px_0px_#000000] rounded-xl hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_#000000]'
                  : isCyberpunkTheme
                    ? isActive
                      ? 'cyberpunk-surface rounded-md border-[rgba(0,255,255,0.95)] bg-[rgba(2,2,10,0.78)] shadow-[0_0_20px_rgba(255,0,255,0.25)]'
                      : 'cyberpunk-surface rounded-md border-[rgba(0,255,255,0.38)] bg-[rgba(2,2,10,0.65)] hover:border-[rgba(0,255,255,0.85)]'
                  : isTerminalTheme
                    ? isActive
                      ? 'terminal-surface border-[rgba(var(--color-accent-primary-rgb),1)] text-[var(--color-accent-primary)]'
                      : 'border-[rgba(var(--color-accent-primary-rgb),0.45)] bg-black/70 text-[var(--color-text-primary)] hover:border-[rgba(var(--color-accent-primary-rgb),0.85)] hover:bg-[rgba(var(--color-accent-primary-rgb),0.08)]'
                  : isActive
                    ? 'border-accent-primary bg-[rgba(var(--color-accent-primary-rgb),0.1)] shadow-[0_0_25px_rgba(var(--color-accent-primary-rgb),0.25)]'
                    : 'border-[rgba(var(--color-text-muted-rgb,161,161,170),0.3)] bg-black/40 hover:border-accent-primary hover:bg-[rgba(var(--color-accent-primary-rgb),0.05)]'
              }`}
              style={isActive && !isRetroCartoonTheme && !isTerminalTheme && !isCyberpunkTheme ? { clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' } : undefined}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className={`w-9 h-9 rounded border flex items-center justify-center transition-colors ${
                  isRetroCartoonTheme
                    ? 'bg-white border-2 border-black'
                    : isCyberpunkTheme
                      ? isActive
                        ? 'bg-[rgba(255,0,255,0.18)] border-[rgba(0,255,255,0.95)]'
                        : 'bg-[rgba(2,2,10,0.85)] border-[rgba(0,255,255,0.42)] group-hover:border-[rgba(0,255,255,0.9)]'
                    : isTerminalTheme
                      ? isActive
                        ? 'bg-[rgba(var(--color-accent-primary-rgb),0.14)] border-[rgba(var(--color-accent-primary-rgb),0.85)]'
                        : 'bg-black border-[rgba(var(--color-accent-primary-rgb),0.4)] group-hover:border-[rgba(var(--color-accent-primary-rgb),0.85)]'
                    : isActive
                      ? 'bg-black/80 border-accent-primary'
                      : 'bg-black/80 border-[rgba(var(--color-text-muted-rgb,161,161,170),0.3)] group-hover:border-accent-primary'
                }`}>
                  <Icon className={`w-4 h-4 ${
                    isRetroCartoonTheme
                      ? 'text-black'
                      : isCyberpunkTheme
                        ? isActive
                          ? 'text-[var(--color-text-primary)]'
                          : 'text-[var(--color-accent-primary)] group-hover:text-[var(--color-text-primary)]'
                      : isTerminalTheme
                        ? 'text-[var(--color-accent-primary)]'
                      : isActive
                        ? 'text-accent-primary'
                        : 'text-[var(--color-text-muted)] group-hover:text-accent-primary'
                  }`} />
                </div>
                {isActive && (
                  <span
                    className={`text-[10px] uppercase tracking-widest font-bold ${
                      isRetroCartoonTheme ? `${retroFontClass} text-white` : 'font-mono text-accent-primary'
                    }`}
                  >
                    {t('settings.theme_active')}
                  </span>
                )}
              </div>

              <div className={`h-2 rounded bg-gradient-to-r ${previewClassName} mb-3`} />

              <h3 className={`text-sm font-black uppercase tracking-widest mb-1 ${isRetroCartoonTheme ? retroFontClass : isTerminalTheme || isCyberpunkTheme ? 'theme-heading-font' : 'font-mono'} ${
                isRetroCartoonTheme
                  ? isActive
                    ? 'text-white'
                    : 'text-black'
                  : isCyberpunkTheme
                    ? 'text-[var(--color-text-primary)]'
                  : isTerminalTheme
                    ? 'text-[var(--color-accent-primary)]'
                  : isActive
                    ? 'text-accent-primary'
                    : 'text-[var(--color-text-primary)]'
              }`}>
                {t(titleKey)}
              </h3>
              <p className={`text-xs leading-relaxed ${isRetroCartoonTheme ? retroFontClass : isTerminalTheme || isCyberpunkTheme ? 'theme-body-font' : 'font-mono'} ${
                isRetroCartoonTheme
                  ? isActive ? 'text-white/90' : 'text-black/80'
                  : isCyberpunkTheme
                    ? 'text-[var(--color-text-muted)]'
                  : isTerminalTheme
                    ? 'text-[var(--color-text-muted)]'
                  : 'text-[var(--color-text-muted)]'
              }`}>
                {t(descriptionKey)}
              </p>
            </button>
          )
        })}
      </div>

      {error && (
        <div
          className={`mt-4 bg-[rgba(var(--color-accent-secondary-rgb),0.1)] border border-[rgba(var(--color-accent-secondary-rgb),0.3)] text-accent-secondary text-sm px-4 py-3 rounded tracking-wide ${
            isRetroCartoonTheme ? retroFontClass : 'font-mono'
          }`}
        >
          {error}
        </div>
      )}
    </HudContainer>
  )
}

export default ThemeSwitcher
