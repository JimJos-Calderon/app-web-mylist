import React, { Suspense, lazy, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ErrorBoundary } from 'react-error-boundary'
import { Film, Tv, Users, Settings, ArrowRight, Sparkles, ListChecks, Plus } from 'lucide-react'
import { useAuth } from '@/features/auth'
import { useUserProfile } from '@/features/profile'
import { CreateListDialog, ListSelector, useLists } from '@/features/lists'
import { SectionErrorFallback } from '@/features/shared'
import type { List } from '@/features/shared'

const ActivityFeedPanel = lazy(() => import('@/features/lists/components/ActivityFeed'))

const ActivityFeedSkeleton: React.FC = () => {
  const { t } = useTranslation()

  return (
    <div className="w-full">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 animate-pulse bg-accent-primary" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-accent-primary">
            SYS.{t('activity_feed.title')}
          </h3>
        </div>
        <div className="h-2 w-24 animate-pulse bg-[rgba(var(--color-accent-primary-rgb),0.2)]" />
      </div>

      <div className="space-y-3">
        {[1, 2, 3].map((line) => (
          <div
            key={line}
            className="h-10 animate-pulse border border-[rgba(var(--color-accent-primary-rgb),0.1)] bg-[rgba(var(--color-accent-primary-rgb),0.05)]"
            style={{
              clipPath:
                'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
            }}
          />
        ))}
      </div>

      <p className="mt-4 text-[10px] font-mono uppercase tracking-widest text-[var(--color-text-muted)] opacity-70">
        {'>'} {t('activity_feed.loading')}
      </p>
    </div>
  )
}

type QuickCardProps = {
  title: string
  description: string
  icon: React.ReactNode
  to?: string
  actionLabel?: string
  onClick?: () => void
  accent?: 'cyan' | 'purple' | 'neutral'
}

const QuickCard: React.FC<QuickCardProps> = ({
  title,
  description,
  icon,
  to,
  actionLabel = 'Abrir',
  onClick,
  accent = 'neutral',
}) => {
  const toneClass =
    accent === 'cyan'
      ? 'hover:border-cyan-400/40'
      : accent === 'purple'
        ? 'hover:border-purple-400/40'
        : 'hover:border-[rgba(var(--color-accent-primary-rgb),0.35)]'

  const content = (
    <div
      className={`group block border border-[rgba(var(--color-accent-primary-rgb),0.2)] bg-[rgba(0,0,0,0.6)] p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_0_24px_rgba(var(--color-accent-primary-rgb),0.12)] ${toneClass}`}
      style={{
        clipPath:
          'polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)',
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-accent-primary">
            {icon}
            <span>SYS.NODE</span>
          </div>

          <div>
            <h3 className="text-lg font-black tracking-tight text-[var(--color-text-primary)]">
              {title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
              {description}
            </p>
          </div>
        </div>

        <ArrowRight className="h-5 w-5 shrink-0 text-accent-primary opacity-70 transition-transform group-hover:translate-x-1" />
      </div>

      <div className="mt-6 inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-accent-primary">
        <span>{actionLabel}</span>
      </div>
    </div>
  )

  if (to) {
    return <Link to={to}>{content}</Link>
  }

  return (
    <button type="button" onClick={onClick} className="block w-full text-left">
      {content}
    </button>
  )
}

const Dashboard: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { profile } = useUserProfile()
  const [isCreateListOpen, setIsCreateListOpen] = useState(false)

  const { lists, currentList, setCurrentList, loading: loadingLists, createList } = useLists(user?.id)

  const displayName = profile?.username || t('navbar.myAccount')
  const hasLists = lists.length > 0
  const hasActiveList = Boolean(currentList)

  const handleListCreated = (newList: List) => {
    setCurrentList(newList)
    setIsCreateListOpen(false)
  }

  if (!user) return null

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 pb-24 md:px-6">
        <section className="space-y-6 pb-8 pt-10 md:space-y-8 md:pb-10 md:pt-14">
          <div className="animate-in fade-in duration-500 space-y-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent-primary opacity-80 md:text-xs">
              {'>'} DECISION_DASHBOARD
            </p>

            <h1
              className="text-4xl font-black tracking-tighter md:text-6xl"
              style={{
                background:
                  'linear-gradient(to right, var(--color-accent-primary), var(--color-accent-secondary))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 18px rgba(var(--color-accent-primary-rgb), 0.35))',
              }}
            >
              Decide qué ver juntos, rápido.
            </h1>

            <p className="max-w-3xl text-sm leading-relaxed text-[var(--color-text-muted)] md:text-lg">
              Bienvenido de nuevo,{' '}
              <span className="font-semibold text-[var(--color-text-primary)]">{displayName}</span>.
              El flujo principal debería empezar aquí: saber qué lista manda ahora mismo y entrar
              directo a decidir.
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div
            className="border border-[rgba(var(--color-accent-primary-rgb),0.35)] bg-[rgba(0,0,0,0.62)] p-6 shadow-[0_0_30px_rgba(var(--color-accent-primary-rgb),0.12)] md:p-8"
            style={{
              clipPath:
                'polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)',
            }}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-400/85">
                  Flujo principal
                </p>
                <h2 className="text-2xl font-black tracking-tight text-white md:text-3xl">
                  {hasActiveList
                    ? `¿Qué vemos hoy en ${currentList?.name}?`
                    : 'Empieza por elegir el contexto'}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
                  {loadingLists
                    ? 'Cargando tus listas para dejarte entrar directo al punto de decisión.'
                    : hasActiveList
                      ? `La lista activa ahora mismo es "${currentList?.name}". El camino corto es abrir películas o series y decidir desde pendientes.`
                      : hasLists
                        ? 'Ya tienes listas creadas, pero falta marcar cuál manda ahora mismo.'
                        : 'Aún no tienes una lista base. Crea una y empieza a añadir opciones.'}
                </p>
              </div>

              <Sparkles className="mt-1 hidden h-6 w-6 shrink-0 text-accent-primary sm:block" />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                to="/peliculas"
                className="inline-flex items-center justify-center rounded-2xl border border-cyan-400/40 bg-cyan-400/12 px-5 py-3 text-sm font-semibold text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-400/18 hover:text-cyan-100"
              >
                {hasActiveList ? 'Seguir con películas' : 'Ir a películas'}
              </Link>

              <Link
                to="/series"
                className="inline-flex items-center justify-center rounded-2xl border border-purple-400/40 bg-purple-400/12 px-5 py-3 text-sm font-semibold text-purple-200 transition hover:border-purple-300 hover:bg-purple-400/18 hover:text-purple-100"
              >
                {hasActiveList ? 'Seguir con series' : 'Ir a series'}
              </Link>

              <button
                type="button"
                onClick={() => setIsCreateListOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/70 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
              >
                <Plus className="h-4 w-4" />
                Crear nueva lista
              </button>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/55 p-4">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                Siguiente paso recomendado
              </p>
              <h3 className="text-lg font-semibold text-white">
                {loadingLists
                  ? 'Preparando tu contexto...'
                  : hasActiveList
                    ? `Entrar con "${currentList?.name}"`
                    : hasLists
                      ? 'Seleccionar lista activa'
                      : 'Crear la primera lista'}
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                {loadingLists
                  ? 'En cuanto estén cargadas, ya podrás seguir el camino corto.'
                  : hasActiveList
                    ? 'El dashboard ya no debería entretenerte demasiado: lo útil está dentro de pendientes.'
                    : hasLists
                      ? 'Sin lista activa el flujo pierde claridad. Elige una y luego entra a decidir.'
                      : 'Sin una lista base todavía no hay un lugar claro donde decidir juntos.'}
              </p>
            </div>
          </div>

          <div
            className="border border-[rgba(var(--color-accent-primary-rgb),0.22)] bg-[rgba(0,0,0,0.62)] p-5"
            style={{
              clipPath:
                'polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)',
            }}
          >
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
              Lista activa
            </p>

            <h2 className="text-2xl font-black tracking-tight text-white">
              {loadingLists ? 'Cargando listas...' : currentList?.name || 'Sin lista seleccionada'}
            </h2>

            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              {hasActiveList
                ? 'Esta es la lista que manda ahora mismo para decidir.'
                : 'Selecciona una lista para que todo lo demás tenga un contexto claro.'}
            </p>

            {hasLists && (
              <div className="mt-5">
                <ListSelector
                  lists={lists}
                  currentList={currentList}
                  onChange={setCurrentList}
                  loading={loadingLists}
                  label="Cambiar lista"
                  placeholder="Selecciona una lista"
                />
              </div>
            )}

            {!loadingLists && !hasLists && (
              <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <p className="text-sm text-slate-400">
                  Todavía no tienes listas. Crea una para empezar el flujo principal.
                </p>
              </div>
            )}

            <div className="mt-6 grid gap-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/55 p-4">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  Estado
                </p>
                <p className="text-lg font-semibold text-white">
                  {loadingLists
                    ? 'Preparando listas'
                    : `${lists.length} ${lists.length === 1 ? 'lista' : 'listas'}`}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/55 p-4">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  Camino corto
                </p>
                <p className="text-sm leading-relaxed text-slate-300">
                  {hasActiveList
                    ? 'Abrir películas o series y decidir desde pendientes.'
                    : 'Resolver primero la lista activa.'}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <QuickCard
            title="Películas"
            description={
              hasActiveList
                ? `Entrar con "${currentList?.name}" para añadir opciones y decidir.`
                : 'Abrir el espacio principal de películas.'
            }
            icon={<Film className="h-4 w-4" />}
            to="/peliculas"
            actionLabel={hasActiveList ? 'Seguir flujo' : 'Abrir películas'}
            accent="cyan"
          />

          <QuickCard
            title="Series"
            description={
              hasActiveList
                ? 'Usar la misma lista activa para seguir decidiendo.'
                : 'Abrir el espacio principal de series.'
            }
            icon={<Tv className="h-4 w-4" />}
            to="/series"
            actionLabel={hasActiveList ? 'Seguir flujo' : 'Abrir series'}
            accent="purple"
          />

          <QuickCard
            title="Perfil y colaboración"
            description="Gestiona tu perfil y prepara mejor la experiencia compartida."
            icon={<Users className="h-4 w-4" />}
            to="/perfil"
            actionLabel="Ver perfil"
          />

          <QuickCard
            title="Ajustes"
            description="Lo secundario sigue estando aquí, pero ya no compite con decidir."
            icon={<Settings className="h-4 w-4" />}
            to="/ajustes"
            actionLabel="Abrir ajustes"
          />
        </section>

        <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.1fr]">
          <div
            className="border border-[rgba(var(--color-accent-primary-rgb),0.22)] bg-[rgba(0,0,0,0.6)] p-5"
            style={{
              clipPath:
                'polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)',
            }}
          >
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Resumen rápido
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/55 p-4">
                <div className="mb-2 inline-flex items-center gap-2 text-slate-400">
                  <ListChecks className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em]">Listas</span>
                </div>
                <p className="text-xl font-semibold text-white">{lists.length}</p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/55 p-4">
                <div className="mb-2 inline-flex items-center gap-2 text-slate-400">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em]">
                    Contexto
                  </span>
                </div>
                <p className="text-sm font-semibold text-white">
                  {hasActiveList ? 'Lista activa resuelta' : 'Falta contexto activo'}
                </p>
              </div>
            </div>
          </div>

          <div
            className="animate-in fade-in slide-in-from-bottom-8 fill-mode-both border border-[rgba(var(--color-accent-primary-rgb),0.3)] border-l-4 border-l-accent-primary bg-[rgba(0,0,0,0.6)] p-5 text-left shadow-[0_0_30px_rgba(var(--color-accent-primary-rgb),0.1)] duration-700 delay-200 md:p-8"
            style={{
              clipPath:
                'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)',
            }}
          >
            <div className="mb-6 flex flex-col gap-1">
              <h2 className="flex items-center gap-2 font-mono text-sm font-black uppercase tracking-widest text-accent-primary md:text-base">
                SYS.{t('activity_feed.title')}
              </h2>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-muted)] opacity-80 md:text-xs">
                {'>'} GLOBAL_ACTIVITY_LOG
              </p>
            </div>

            <ErrorBoundary FallbackComponent={SectionErrorFallback}>
              <Suspense fallback={<ActivityFeedSkeleton />}>
                <ActivityFeedPanel limit={20} />
              </Suspense>
            </ErrorBoundary>
          </div>
        </section>
      </div>

      <CreateListDialog
        open={isCreateListOpen}
        onClose={() => setIsCreateListOpen(false)}
        onCreate={createList}
        onCreated={handleListCreated}
      />
    </>
  )
}

export default Dashboard