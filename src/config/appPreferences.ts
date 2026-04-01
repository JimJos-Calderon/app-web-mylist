import { capacitorStorage } from './capacitorStorage'

export const THEME_STORAGE_KEY = 'theme'
export const LANGUAGE_STORAGE_KEY = 'language'
export const DEFAULT_THEME = 'cyberpunk'
export const DEFAULT_LANGUAGE = 'es'

const normalizeLanguage = (value?: string | null) => {
  const normalized = value?.trim().toLowerCase().split('-')[0]
  return normalized === 'en' || normalized === 'es' ? normalized : null
}

export const getPreferredLanguage = async () => {
  const persistedLanguage = normalizeLanguage(await capacitorStorage.getItem(LANGUAGE_STORAGE_KEY))
  if (persistedLanguage) return persistedLanguage

  if (typeof navigator !== 'undefined') {
    return normalizeLanguage(navigator.language) ?? DEFAULT_LANGUAGE
  }

  return DEFAULT_LANGUAGE
}

export const getPersistedTheme = async () => {
  return (await capacitorStorage.getItem(THEME_STORAGE_KEY)) ?? DEFAULT_THEME
}

export const persistTheme = async (theme: string) => {
  await capacitorStorage.setItem(THEME_STORAGE_KEY, theme)
}

export const persistLanguage = async (language: string) => {
  const normalizedLanguage = normalizeLanguage(language) ?? DEFAULT_LANGUAGE
  await capacitorStorage.setItem(LANGUAGE_STORAGE_KEY, normalizedLanguage)
}

export const applyThemeToDocument = (theme: string) => {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', theme)
}
