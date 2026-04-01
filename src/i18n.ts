import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { DEFAULT_LANGUAGE, getPreferredLanguage, persistLanguage } from '@config/appPreferences'

// Diccionarios de traducciones organizados por módulos
import esTranslations from './locales/es'
import enTranslations from './locales/en'

const resources = {
  es: {
    translation: esTranslations,
  },
  en: {
    translation: enTranslations,
  },
}

let initializationPromise: Promise<typeof i18n> | null = null
let languagePersistenceBound = false

export const initializeI18n = async () => {
  if (i18n.isInitialized) {
    return i18n
  }

  if (!initializationPromise) {
    initializationPromise = (async () => {
      const initialLanguage = await getPreferredLanguage()

      await i18n
        .use(initReactI18next)
        .init({
          resources,
          lng: initialLanguage,
          fallbackLng: DEFAULT_LANGUAGE,
          interpolation: {
            escapeValue: false,
          },
        })

      if (!languagePersistenceBound) {
        i18n.on('languageChanged', (language) => {
          void persistLanguage(language)
        })
        languagePersistenceBound = true
      }

      return i18n
    })()
  }

  return initializationPromise
}

export default i18n
