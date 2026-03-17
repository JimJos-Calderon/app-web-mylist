import React, { Suspense, lazy } from 'react'
import { useTranslation } from 'react-i18next'
import { ErrorBoundary } from 'react-error-boundary'
import { useUserProfile } from '@/features/profile'
import { SectionErrorFallback } from '@/features/shared'

const ActivityFeedPanel = lazy(() => import('@/features/lists/components/ActivityFeed'))

const ActivityFeedSkeleton: React.FC = () => {
  const { t } = useTranslation()

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-accent-primary animate-pulse" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-accent-primary">
            SYS.{t('activity_feed.title')}
          </h3>
        </div>
        <div className="w-24 h-2 bg-[rgba(var(--color-accent-primary-rgb),0.2)] animate-pulse" />
      </div>

      <div className="space-y-3">
        {[1, 2, 3].map((line) => (
          <div
            key={line}
            className="h-10 bg-[rgba(var(--color-accent-primary-rgb),0.05)] border border-[rgba(var(--color-accent-primary-rgb),0.1)] animate-pulse"
            style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
          />
        ))}
      </div>

      <p className="mt-4 text-[10px] font-mono uppercase tracking-widest text-[var(--color-text-muted)] opacity-70">
        {'>'} {t('activity_feed.loading')}
      </p>
    </div>
  )
}

const Dashboard: React.FC = () => {
  const { t } = useTranslation()
  const { profile } = useUserProfile()

  const displayName = profile?.username || t('navbar.myAccount')

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-24">
      <div className="text-center mt-12 animate-in fade-in zoom-in duration-700 space-y-6">
        <div>
          <h2
            className="text-5xl font-black mb-4 font-mono tracking-tighter"
            style={{
              background: 'linear-gradient(to right, var(--color-accent-primary), var(--color-accent-secondary))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 15px rgba(var(--color-accent-primary-rgb), 0.5))',
            }}
          >
            {t('greeting.welcome_back')}
          </h2>
          <p className="text-[var(--color-text-muted)] text-lg">
            {t('greeting.what_to_watch', { name: displayName })}
          </p>
        </div>
      </div>

      <div className="grid gap-6 px-4 md:grid-cols-2">
        <section className="border border-[rgba(var(--color-accent-primary-rgb),0.3)] bg-[rgba(0,0,0,0.6)] p-5 shadow-[0_0_30px_rgba(var(--color-accent-primary-rgb),0.1)] border-l-4 border-l-accent-primary text-left">
          <h3 className="text-sm font-black uppercase tracking-widest text-accent-primary font-mono mb-3">
            ¿Qué vemos hoy?
          </h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            Punto de entrada principal para decidir juntos, rápido.
          </p>
        </section>

        <section className="border border-[rgba(var(--color-accent-primary-rgb),0.3)] bg-[rgba(0,0,0,0.6)] p-5 shadow-[0_0_30px_rgba(var(--color-accent-primary-rgb),0.1)] text-left">
          <h3 className="text-sm font-black uppercase tracking-widest text-accent-primary font-mono mb-3">
            Mi lista
          </h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            Acceso rápido a tu lista compartida activa.
          </p>
        </section>

        <section className="border border-[rgba(var(--color-accent-primary-rgb),0.3)] bg-[rgba(0,0,0,0.6)] p-5 shadow-[0_0_30px_rgba(var(--color-accent-primary-rgb),0.1)] text-left">
          <h3 className="text-sm font-black uppercase tracking-widest text-accent-primary font-mono mb-3">
            Pendientes
          </h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            Lo que aún no habéis visto.
          </p>
        </section>

        <section className="border border-[rgba(var(--color-accent-primary-rgb),0.3)] bg-[rgba(0,0,0,0.6)] p-5 shadow-[0_0_30px_rgba(var(--color-accent-primary-rgb),0.1)] text-left">
          <h3 className="text-sm font-black uppercase tracking-widest text-accent-primary font-mono mb-3">
            Invitar
          </h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            Gestión de colaboración y acceso compartido.
          </p>
        </section>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both px-4">
        <section
          className="border border-[rgba(var(--color-accent-primary-rgb),0.3)] bg-[rgba(0,0,0,0.6)] p-5 md:p-8 shadow-[0_0_30px_rgba(var(--color-accent-primary-rgb),0.1)] border-l-4 border-l-accent-primary text-left"
          style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}
        >
          <div className="flex flex-col gap-1 mb-6">
            <h3 className="text-sm md:text-base font-black uppercase tracking-widest text-accent-primary font-mono flex items-center gap-2">
              SYS.{t('activity_feed.title')}
            </h3>
            <p className="text-[10px] md:text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)] font-mono opacity-80">
              {'>'} GLOBAL_ACTIVITY_LOG
            </p>
          </div>

          <ErrorBoundary FallbackComponent={SectionErrorFallback}>
            <Suspense fallback={<ActivityFeedSkeleton />}>
              <ActivityFeedPanel limit={20} />
            </Suspense>
          </ErrorBoundary>
        </section>
      </div>
    </div>
  )
}

export default Dashboard