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
        flex items-center gap-2 px-4 py-2.5 rounded-full
        bg-gradient-to-r from-purple-500/10 to-pink-500/10
        border border-purple-400/30 backdrop-blur-md
        hover:border-purple-400/60 hover:from-purple-500/20 hover:to-pink-500/20
        transition-all duration-300 ease-out
        disabled:opacity-70 cursor-pointer group
        font-semibold text-sm uppercase tracking-wide
      `}
      title={`Cambiar idioma (${currentLang === 'es' ? 'Change language' : 'Cambiar idioma'})`}
      aria-label={`Language switcher: currently ${currentLang}`}
    >
      <Globe
        size={18}
        className={`
          transition-all duration-300 group-hover:text-pink-400
          ${currentLang === 'es' ? 'text-purple-400' : 'text-pink-400'}
          ${isTransitioning ? 'animate-spin' : ''}
        `}
      />
      
      <span
        className={`
          transition-all duration-300
          ${currentLang === 'es' ? 'text-purple-300' : 'text-pink-300'}
          group-hover:text-white
        `}
      >
        {currentLang.toUpperCase()}
      </span>

      {/* Indicador visual del estado */}
      <span
        className={`
          absolute right-2 w-2 h-2 rounded-full
          transition-all duration-300
          ${currentLang === 'es' ? 'bg-purple-400' : 'bg-pink-400'}
          group-hover:shadow-lg group-hover:shadow-pink-500/50
        `}
      />
    </button>
  )
}
