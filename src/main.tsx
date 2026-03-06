import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ErrorBoundary } from 'react-error-boundary'
import * as Sentry from '@sentry/react'
import { AuthProvider } from '@context/AuthContext'
import { queryClient } from '@config/queryClient'
import { GlobalErrorFallback } from '@components/GlobalErrorFallback'
import App from './App'
import './index.css'
import './i18n' // ← Inicializar i18n

// ─── Sentry Initialization ─────────────────────────────────────────────────
Sentry.init({
  dsn: 'https://b6011cfdb38824a61735673b971d45b4@o4510993959878656.ingest.de.sentry.io/4510993961517136',
  environment: import.meta.env.MODE, // 'development' | 'production'
  enabled: import.meta.env.PROD, // Solo envía errores en producción
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
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
)
