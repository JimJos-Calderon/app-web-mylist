import React, { Suspense, lazy, ErrorInfo } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ErrorBoundary } from 'react-error-boundary'
import * as Sentry from '@sentry/react'
import { useTranslation } from 'react-i18next'
import { SectionErrorFallback } from '@/features/shared'
const Dashboard = lazy(() => import('@pages/Dashboard'))
const Peliculas = lazy(() => import('@pages/Peliculas'))
const Series = lazy(() => import('@pages/Series'))
const Perfil = lazy(() => import('@pages/Perfil'))
const Ajustes = lazy(() => import('@pages/Ajustes'))

const handleSectionError = (error: unknown, info: ErrorInfo) => {
  Sentry.captureException(error, {
    extra: { componentStack: info.componentStack },
  })
}

const PageLoadingSkeleton: React.FC = () => {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="inline-flex items-center justify-center relative">
          <div className="w-20 h-20 border-2 border-[rgba(var(--color-accent-primary-rgb),0.2)] border-t-accent-primary border-r-[var(--color-accent-secondary)] rounded-full animate-spin" />
          <div className="absolute inset-0 border-2 border-[rgba(var(--color-accent-secondary-rgb),0.1)] border-b-[var(--color-accent-secondary)] rounded-full animate-[spin_3s_linear_infinite_reverse]" />
        </div>
        <div className="space-y-2">
          <p className="text-accent-primary font-mono font-bold text-lg uppercase tracking-[0.2em] animate-pulse">
            SYS.{t('status.loading')}...
          </p>
          <p className="text-[var(--color-text-muted)] font-mono text-xs uppercase opacity-70">
            {'>'} {t('states.optimizing')}
          </p>
        </div>
      </div>
    </div>
  )
}

const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<PageLoadingSkeleton />}>
      <Routes>
        <Route
          path="/"
          element={
            <ErrorBoundary
              FallbackComponent={SectionErrorFallback}
              onError={handleSectionError}
              onReset={() => window.location.reload()}
            >
              <Dashboard />
            </ErrorBoundary>
          }
        />
        <Route
          path="/peliculas"
          element={
            <ErrorBoundary
              FallbackComponent={SectionErrorFallback}
              onError={handleSectionError}
              onReset={() => window.location.reload()}
            >
              <Peliculas />
            </ErrorBoundary>
          }
        />
        <Route
          path="/series"
          element={
            <ErrorBoundary
              FallbackComponent={SectionErrorFallback}
              onError={handleSectionError}
              onReset={() => window.location.reload()}
            >
              <Series />
            </ErrorBoundary>
          }
        />
        <Route
          path="/perfil"
          element={
            <ErrorBoundary
              FallbackComponent={SectionErrorFallback}
              onError={handleSectionError}
              onReset={() => window.location.reload()}
            >
              <Perfil />
            </ErrorBoundary>
          }
        />
        <Route
          path="/ajustes"
          element={
            <ErrorBoundary
              FallbackComponent={SectionErrorFallback}
              onError={handleSectionError}
              onReset={() => window.location.reload()}
            >
              <Ajustes />
            </ErrorBoundary>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Suspense>
  )
}

export default AppRoutes