import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'
import i18n from '@/i18n'

export const LanguageSwitcher: React.FC = () => {
  const { i18n: i18nInstance } = useTranslation()
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
      await i18n.changeLanguage(newLang)
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
        relative overflow-hidden flex items-center justify-center gap-2 px-4 py-2.5 rounded
        bg-[rgba(var(--color-bg-base-rgb),0.6)]
        border border-[rgba(var(--color-text-muted-rgb,161,161,170),0.3)] backdrop-blur-md
        hover:border-accent-primary hover:bg-[rgba(var(--color-accent-primary-rgb),0.1)]
        hover:shadow-[0_0_15px_rgba(var(--color-accent-primary-rgb),0.3)]
        transition-all duration-300 ease-out
        disabled:opacity-70 cursor-pointer group
        font-bold text-xs uppercase tracking-widest font-mono
      `}
      style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
      title={`Cambiar idioma (${currentLang === 'es' ? 'Change language' : 'Cambiar idioma'})`}
      aria-label={`Language switcher: currently ${currentLang}`}
    >
      <Globe
        size={16}
        className={`
          transition-all duration-300 
          text-[var(--color-text-muted)] group-hover:text-accent-primary
          ${isTransitioning ? 'animate-spin' : ''}
        `}
      />
      
      <span
        className={`
          transition-all duration-300
          text-[var(--color-text-primary)]
          group-hover:text-accent-primary
        `}
      >
        {currentLang.toUpperCase()}
      </span>

      {/* Indicador visual del estado */}
      <span
        className={`
          w-1.5 h-1.5 rounded-full ml-1
          transition-all duration-300
          bg-accent-secondary
          group-hover:shadow-[0_0_8px_var(--color-accent-secondary)]
        `}
      />
    </button>
  )
}
