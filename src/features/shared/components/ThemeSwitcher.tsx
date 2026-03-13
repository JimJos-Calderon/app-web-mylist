import React from 'react'
import { useTranslation } from 'react-i18next'
import { Palette, Cpu, Monitor } from 'lucide-react'
import { ThemePreference, useTheme } from '@/features/shared'

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
    value: '2advanced',
    titleKey: 'settings.theme_options.advanced.title',
    descriptionKey: 'settings.theme_options.advanced.description',
    Icon: Cpu,
    previewClassName: 'from-sky-400 via-blue-500 to-slate-400',
  },
  {
    value: 'terminal',
    titleKey: 'settings.theme_options.terminal.title',
    descriptionKey: 'settings.theme_options.terminal.description',
    Icon: Monitor,
    previewClassName: 'from-emerald-500 via-emerald-400 to-black',
  },
]

const ThemeSwitcher: React.FC = () => {
  const { t } = useTranslation()
  const { theme, changeTheme, isChangingTheme, error } = useTheme()

  return (
    <section className="bg-black/60 backdrop-blur-lg border border-cyan-500/20 rounded-3xl p-6 sm:p-8">
      <header className="mb-5">
        <h2 className="text-xl font-bold text-white mb-1">{t('settings.theme_title')}</h2>
        <p className="text-zinc-400 text-sm">{t('settings.theme_description')}</p>
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
              className={`text-left rounded-2xl border p-4 transition-all duration-300 group disabled:opacity-60 disabled:cursor-not-allowed ${
                isActive
                  ? 'border-cyan-400 bg-cyan-500/10 shadow-[0_0_25px_rgba(34,211,238,0.25)]'
                  : 'border-zinc-700 bg-zinc-900/60 hover:border-cyan-500/40 hover:bg-zinc-900/80'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center group-hover:border-cyan-400/60 transition-colors">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-300' : 'text-zinc-300 group-hover:text-cyan-300'}`} />
                </div>
                {isActive && (
                  <span className="text-[10px] uppercase tracking-widest font-bold text-cyan-300">
                    {t('settings.theme_active')}
                  </span>
                )}
              </div>

              <div className={`h-2 rounded-full bg-gradient-to-r ${previewClassName} mb-3`} />

              <h3 className="text-sm font-black uppercase tracking-wide text-white mb-1">
                {t(titleKey)}
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {t(descriptionKey)}
              </p>
            </button>
          )
        })}
      </div>

      {error && (
        <div className="mt-4 bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}
    </section>
  )
}

export default ThemeSwitcher
