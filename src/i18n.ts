import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Diccionarios de traducciones organizados por módulos
import esTranslations from './locales/es';
import enTranslations from './locales/en';

const resources = {
  es: {
    translation: esTranslations,
  },
  en: {
    translation: enTranslations,
  },
};

i18n
  // Detectar idioma automáticamente
  .use(LanguageDetector)
  // Inicializar react-i18next
  .use(initReactI18next)
  // Inicializar i18next
  .init({
    resources,
    fallbackLng: 'es', // Español como idioma por defecto
    interpolation: {
      escapeValue: false, // React protege contra XSS automáticamente
    },
    detection: {
      order: ['localStorage', 'navigator'], // Primero busca en localStorage, luego en el navegador
      caches: ['localStorage'], // Guarda la preferencia en localStorage
    },
  });

export default i18n;
