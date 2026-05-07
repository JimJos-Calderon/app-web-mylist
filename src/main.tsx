import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { ErrorBoundary } from 'react-error-boundary'
import * as Sentry from '@sentry/react'
import { AuthProvider } from '@/features/auth'
import { GlobalErrorFallback, InstallPwaPrompt } from '@/features/shared'
import { queryClient } from '@config/queryClient'
import { persistOptions } from '@config/queryPersistence'
import { applyThemeToDocument, getPersistedTheme } from '@config/appPreferences'
import App from './App'
import './index.css'
import { initializeI18n } from './i18n'

// ─── Sentry Initialization ─────────────────────────────────────────────────
const sentryDsn = import.meta.env.VITE_SENTRY_DSN?.trim() || undefined
Sentry.init({
  dsn: sentryDsn,
  environment: import.meta.env.MODE,
  enabled: import.meta.env.PROD && Boolean(sentryDsn),
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  // Tier gratuito: valores conservadores
  tracesSampleRate: 0.2, // 20% de transacciones (suficiente para métricas)
  replaysSessionSampleRate: 0.05, // 5% de sesiones grabadas
  replaysOnErrorSampleRate: 1.0, // 100% de sesiones CON error se graban
})

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found')
}

const bootstrap = async () => {
  const persistedTheme = await getPersistedTheme()
  applyThemeToDocument(persistedTheme)
  await initializeI18n()

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary
        FallbackComponent={GlobalErrorFallback}
        onError={(error, info) => {
          Sentry.captureException(error, {
            extra: { componentStack: info.componentStack },
          })
        }}
      >
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={persistOptions}
          onSuccess={() => {
            queryClient.resumePausedMutations().catch(() => undefined)
          }}
        >
          <BrowserRouter>
            <InstallPwaPrompt />
            <AuthProvider>
              <App />
            </AuthProvider>
          </BrowserRouter>
        </PersistQueryClientProvider>
      </ErrorBoundary>
    </React.StrictMode>
  )
}

void bootstrap()
