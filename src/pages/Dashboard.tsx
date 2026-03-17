import React, { Suspense, lazy } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ErrorBoundary } from 'react-error-boundary'
import { Film, Clock3, Users, ArrowRight, Sparkles } from 'lucide-react'
import { useUserProfile } from '@/features/profile'
import { SectionErrorFallback } from '@/features/shared'
import { useActiveList } from '@/features/lists/hooks/useActiveList'

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

type DashboardCardProps = {
    title: string
    description: string
    icon: React.ReactNode
    to: string
    primary?: boolean
    actionLabel?: string
}

const DashboardCard: React.FC<DashboardCardProps> = ({
    title,
    description,
    icon,
    to,
    primary = false,
    actionLabel = 'Abrir',
}) => {
    return (
        <Link
            to={to}
            className={`group block border bg-[rgba(0,0,0,0.6)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(var(--color-accent-primary-rgb),0.15)]
        ${primary
                    ? 'border-[rgba(var(--color-accent-primary-rgb),0.45)] p-6 md:p-8'
                    : 'border-[rgba(var(--color-accent-primary-rgb),0.25)] p-5'
                }`}
            style={{ clipPath: 'polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)' }}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 text-accent-primary font-mono text-[10px] uppercase tracking-[0.2em]">
                        {icon}
                        <span>SYS.NODE</span>
                    </div>

                    <div>
                        <h3 className={`${primary ? 'text-2xl md:text-3xl' : 'text-lg'} font-black tracking-tight text-[var(--color-text-primary)]`}>
                            {title}
                        </h3>
                        <p className="mt-2 text-sm text-[var(--color-text-muted)] leading-relaxed max-w-xl">
                            {description}
                        </p>
                    </div>
                </div>

                <ArrowRight className="w-5 h-5 text-accent-primary opacity-70 group-hover:translate-x-1 transition-transform shrink-0" />
            </div>

            <div className="mt-6 inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-accent-primary">
                <span>{actionLabel}</span>
            </div>
        </Link>
    )
}

const Dashboard: React.FC = () => {
    const { t } = useTranslation()
    const { profile } = useUserProfile()
    const { activeList } = useActiveList()

    const displayName = profile?.username || t('navbar.myAccount')

    return (
        <div className="max-w-6xl mx-auto pb-24 px-4 md:px-6">
            <section className="pt-10 md:pt-14 pb-10 space-y-6">
                <div className="space-y-3 animate-in fade-in duration-500">
                    <p className="text-[10px] md:text-xs uppercase tracking-[0.25em] text-accent-primary font-mono opacity-80">
                        {'>'} DECISION_DASHBOARD
                    </p>

                    <h1
                        className="text-4xl md:text-6xl font-black tracking-tighter"
                        style={{
                            background: 'linear-gradient(to right, var(--color-accent-primary), var(--color-accent-secondary))',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            filter: 'drop-shadow(0 0 18px rgba(var(--color-accent-primary-rgb), 0.35))',
                        }}
                    >
                        Decide qué ver juntos, rápido.
                    </h1>

                    <p className="max-w-2xl text-sm md:text-lg text-[var(--color-text-muted)] leading-relaxed">
                        Bienvenido de nuevo, <span className="text-[var(--color-text-primary)] font-semibold">{displayName}</span>. Todo lo importante debería empezar aquí: elegir, revisar pendientes y seguir lo que habéis hecho.
                    </p>
                </div>
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.9fr] gap-6 items-stretch">
                <DashboardCard
                    title={activeList ? `¿Qué vemos hoy en ${activeList.name}?` : '¿Qué vemos hoy?'}
                    description={
                        activeList
                            ? `Estás trabajando sobre "${activeList.name}". Entra y decide rápido.`
                            : 'Empieza por aquí. Tu entrada principal para decidir rápido qué ver.'
                    }
                    icon={<Sparkles className="w-4 h-4" />}
                    to="/peliculas"
                    primary
                    actionLabel="Ir a películas"
                />

                <div className="grid grid-cols-1 gap-6">
                    <DashboardCard
                        title="Tu lista"
                        description="Abre tu espacio principal para revisar, añadir y organizar lo que queréis ver."
                        icon={<Film className="w-4 h-4" />}
                        to="/peliculas"
                        actionLabel="Abrir lista"
                    />

                    <DashboardCard
                        title="Series"
                        description="Acceso rápido a vuestro espacio de series si queréis alternar entre formatos."
                        icon={<Clock3 className="w-4 h-4" />}
                        to="/series"
                        actionLabel="Abrir series"
                    />
                </div>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <DashboardCard
                    title="Perfil y colaboración"
                    description="Gestiona tu perfil y prepara mejor la experiencia compartida."
                    icon={<Users className="w-4 h-4" />}
                    to="/perfil"
                    actionLabel="Ver perfil"
                />

                <DashboardCard
                    title="Ajustes"
                    description="Configura lo necesario, pero mantén el foco: decidir qué ver juntos debería seguir siendo lo primero."
                    icon={<Clock3 className="w-4 h-4" />}
                    to="/ajustes"
                    actionLabel="Abrir ajustes"
                />
            </section>

            <section className="mt-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 fill-mode-both">
                <div
                    className="border border-[rgba(var(--color-accent-primary-rgb),0.3)] bg-[rgba(0,0,0,0.6)] p-5 md:p-8 shadow-[0_0_30px_rgba(var(--color-accent-primary-rgb),0.1)] border-l-4 border-l-accent-primary text-left"
                    style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}
                >
                    <div className="flex flex-col gap-1 mb-6">
                        <h2 className="text-sm md:text-base font-black uppercase tracking-widest text-accent-primary font-mono flex items-center gap-2">
                            SYS.{t('activity_feed.title')}
                        </h2>
                        <p className="text-[10px] md:text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)] font-mono opacity-80">
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
    )
}

export default Dashboard