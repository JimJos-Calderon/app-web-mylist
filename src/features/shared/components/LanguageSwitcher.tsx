import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'

export const LanguageSwitcher: React.FC = () => {
  const { i18n: i18nInstance } = useTranslation()
  const { theme } = useTheme()
  const isRetroCartoon = theme === 'retro-cartoon'
  const isTerminal = theme === 'terminal'
  const isCyberpunk = theme === 'cyberpunk'
  const [currentLang, setCurrentLang] = useState<'es' | 'en'>(
    (i18nInstance.language as 'es' | 'en') || 'es'
  )
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Sincronizar estado cuando cambia el idioma desde otro lugar
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setCurrentLang((lng as 'es' | 'en') || 'es')
    }

    i18nInstance.on('languageChanged', handleLanguageChange)
    return () => {
      i18nInstance.off('languageChanged', handleLanguageChange)
    }
  }, [i18nInstance])

  const toggleLanguage = async () => {
    setIsTransitioning(true)
    const newLang = currentLang === 'es' ? 'en' : 'es'
    
    try {
      await i18nInstance.changeLanguage(newLang)
      setCurrentLang(newLang)
    } catch (error) {
      console.error('Error al cambiar idioma:', error)
    } finally {
      setIsTransitioning(false)
    }
  }

  return (
    <button
      onClick={toggleLanguage}
      disabled={isTransitioning}
      className={`
        relative overflow-hidden flex items-center justify-center gap-2 px-4 py-2.5
        ${isRetroCartoon
          ? 'bg-white text-black border-[3px] border-black shadow-[3px_3px_0px_0px_#000000] rounded-md font-bold hover:-translate-y-[2px] hover:shadow-[5px_5px_0px_0px_#000000] active:translate-x-1 active:translate-y-1 active:shadow-none'
          : isTerminal
            ? 'terminal-button theme-heading-font rounded-none'
          : isCyberpunk
            ? 'cyberpunk-pill theme-heading-font bg-[rgba(2,2,10,0.58)] backdrop-blur-[12px] border-[rgba(0,255,255,0.5)] hover:bg-[linear-gradient(90deg,rgba(0,255,255,0.12),rgba(255,0,255,0.16))]'
          : 'bg-[rgba(var(--color-bg-base-rgb),0.6)] border border-[rgba(var(--color-text-muted-rgb,161,161,170),0.3)] backdrop-blur-md hover:border-accent-primary hover:bg-[rgba(var(--color-accent-primary-rgb),0.1)] hover:shadow-[0_0_15px_rgba(var(--color-accent-primary-rgb),0.3)]'
        }
        transition-all duration-300 ease-out
        disabled:opacity-70 cursor-pointer group
        font-bold text-xs uppercase tracking-widest ${isTerminal || isCyberpunk ? '' : 'font-mono'}
      `}
      style={isRetroCartoon || isTerminal || isCyberpunk ? undefined : { clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
      title={`Cambiar idioma (${currentLang === 'es' ? 'Change language' : 'Cambiar idioma'})`}
      aria-label={`Language switcher: currently ${currentLang}`}
    >
      <Globe
        size={16}
        className={`
          transition-all duration-300 
          ${isRetroCartoon ? 'text-black' : isTerminal ? 'text-[var(--color-accent-primary)]' : isCyberpunk ? 'text-[var(--color-text-primary)] cyberpunk-text-glow' : 'text-[var(--color-text-muted)] group-hover:text-accent-primary'}
          ${isTransitioning ? 'animate-spin' : ''}
        `}
      />
      
      <span
        className={`
          transition-all duration-300
          ${isRetroCartoon ? 'text-black' : isTerminal ? 'text-[var(--color-accent-primary)]' : isCyberpunk ? 'text-[var(--color-text-primary)] cyberpunk-text-glow' : 'text-[var(--color-text-primary)] group-hover:text-accent-primary'}
        `}
      >
        {currentLang.toUpperCase()}
      </span>

      {/* Indicador visual del estado */}
      <span
        className={`
          w-1.5 h-1.5 rounded-full ml-1
          transition-all duration-300
          ${isRetroCartoon ? 'bg-black' : isTerminal ? 'bg-[var(--color-accent-primary)] group-hover:shadow-[0_0_8px_var(--color-glow)]' : isCyberpunk ? 'bg-[var(--color-accent-primary)] group-hover:shadow-[0_0_10px_rgba(255,0,255,0.45)]' : 'bg-accent-secondary group-hover:shadow-[0_0_8px_var(--color-accent-secondary)]'}
        `}
      />
    </button>
  )
}
