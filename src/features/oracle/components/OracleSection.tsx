import React, { useMemo } from 'react'
import { BrainCircuit, Star, AlertTriangle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/supabaseClient'
import { useAuth } from '@/features/auth'
import { useTheme } from '@/features/shared'
import { useOracleRecommendations } from '@/hooks/useOracleRecommendations'

interface OracleSectionProps {
  items?: unknown // kept for API compatibility, no longer used
}

export const OracleSection: React.FC<OracleSectionProps> = () => {
  const { user } = useAuth()
  const { theme } = useTheme()
  const isRetroCartoon = theme === 'retro-cartoon'
  const { isLoading, error, recomendaciones, fetchRecommendations } = useOracleRecommendations()

  // Consultamos TODOS los items calificados del usuario en todas las listas
  // haciendo un join directo en Supabase para obtener el título
  const { data: ratedItems = [], isLoading: ratingsLoading } = useQuery({
    queryKey: ['itemRatings', 'oracle', 'all', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('item_ratings')
        .select(`
          rating,
          liked,
          items (
            id,
            titulo
          )
        `)
        .eq('user_id', user!.id)
        .or('rating.not.is.null,liked.not.is.null')
      if (error) throw error
      // Supabase retorna la relación como array (one-to-many), tomamos el primer elemento
      return (data ?? []).map((r: any) => ({
        rating: r.rating as number | null,
        liked: r.liked as boolean | null,
        item: Array.isArray(r.items) ? (r.items[0] as { id: string; titulo: string } | undefined) : (r.items as { id: string; titulo: string } | null),
      }))
    },
    enabled: !!user?.id,
  })

  // Construimos el array con etiquetas descriptivas para el prompt
  const topItems = useMemo(() => {
    return ratedItems
      .filter((r) => r.item != null)
      .map((r) => {
        let nota: string
        if (r.rating !== null && r.liked !== null) {
          nota = `${r.rating}/5 estrellas + ${r.liked ? 'me gustó' : 'no me gustó'}`
        } else if (r.rating !== null) {
          nota = `${r.rating}/5 estrellas`
        } else {
          nota = r.liked ? 'me gustó' : 'no me gustó'
        }
        return { titulo: r.item!.titulo, nota }
      })
      .slice(0, 10)
  }, [ratedItems])

  const ratedTitles = useMemo(
    () =>
      ratedItems
        .filter((r) => r.item?.titulo)
        .map((r) => r.item!.titulo),
    [ratedItems]
  )

  const handleConsult = () => {
    fetchRecommendations(topItems, ratedTitles)
  }

  const hasTopItems = topItems.length > 0

  const headerTitleClass = isRetroCartoon
    ? 'flex items-center gap-3 font-black text-2xl uppercase tracking-[0.12em] text-black md:text-3xl'
    : 'flex items-center gap-3 font-mono text-xl font-black uppercase tracking-[0.15em] text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)] md:text-2xl'
  const headerSubtitleClass = isRetroCartoon
    ? 'mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-black opacity-90 md:text-xs'
    : 'mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-muted)] opacity-70 md:text-xs'
  const recommendationItemClass = isRetroCartoon
    ? 'border-l-[4px] border-black pl-4 py-2 transition-colors duration-300 hover:bg-black/[0.04]'
    : 'border-l-2 border-cyan-500 pl-4 py-2 transition-colors duration-300 hover:bg-cyan-500/5'
  const recommendationTitleClass = isRetroCartoon
    ? 'font-mono text-lg font-bold text-black'
    : 'font-mono text-lg font-bold text-cyan-400 drop-shadow-[0_0_5px_rgba(6,182,212,0.3)] md:text-xl'
  const recommendationDescriptionClass = isRetroCartoon
    ? 'mt-2 font-mono text-sm font-medium leading-relaxed text-black md:text-base'
    : 'mt-2 font-mono text-sm leading-relaxed text-slate-300 opacity-90 md:text-base'
  const recalcularButtonClass = isRetroCartoon
    ? 'w-full px-4 py-3 font-bold uppercase transition-all bg-white text-black border-[3px] border-black shadow-[4px_4px_0px_0px_#000000] rounded-xl hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_#000000] active:translate-y-0 active:translate-x-0 active:shadow-none'
    : 'group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl border border-cyan-500 bg-cyan-500/10 px-8 py-4 font-mono text-sm font-black uppercase tracking-[0.15em] text-cyan-400 transition-all hover:bg-cyan-500 hover:text-black hover:shadow-[0_0_25px_rgba(6,182,212,0.4)] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-cyan-500/10 disabled:hover:text-cyan-400 disabled:hover:shadow-none md:w-auto md:text-base'

  return (
    <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-black p-6 shadow-[0_0_30px_rgba(6,182,212,0.05)] md:p-8">
      {/* Grid cyber punk background */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />

      <div className="relative z-10 flex w-full flex-col items-start">
        <div className="mb-6 flex flex-col">
          <h2 className={headerTitleClass}>
            <BrainCircuit className="h-6 w-6 md:h-8 md:w-8" />
            EL ORÁCULO AI
          </h2>
          <p className={headerSubtitleClass}>
            {'>'} PREDICCIÓN_NEURONAL_BASADA_EN_AFINIDAD
          </p>
        </div>

        {/* Estado: sin ratings suficientes */}
        {!hasTopItems && !recomendaciones && !error && (
          <div className="mb-8 w-full rounded-xl border border-cyan-500/15 bg-cyan-500/5 p-4">
            <p className="font-mono text-sm leading-relaxed text-[var(--color-text-muted)]">
              {'>'} <span className="text-cyan-400">MEMORIA_INSUFICIENTE.</span> El Oráculo necesita datos de afinidad.<br />
              <span className="mt-1 block text-xs opacity-70"><strong className="text-white">Califica películas con 4–5 ⭐</strong> o dale <strong className="text-white">❤️ like</strong> para activar las predicciones.</span>
            </p>
          </div>
        )}

        {/* Estado: con datos disponibles */}
        {hasTopItems && !recomendaciones && !error && (
          <div className="mb-8 w-full rounded-xl border border-white/5 bg-white/5 p-4">
            <p className="font-mono text-sm text-[var(--color-text-muted)]">
              Sistema calibrado con <span className="font-bold text-cyan-400">{topItems.length} memorias estelares</span>. Listo para cruzar datos con la colmena.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-8 flex w-full animate-in fade-in items-start gap-4 rounded-xl border border-red-500/50 bg-red-500/10 p-5 duration-300">
            <AlertTriangle className="mt-0.5 h-6 w-6 flex-shrink-0 text-red-500" />
            <p className="font-mono text-sm leading-relaxed text-red-400 md:text-base">{error}</p>
          </div>
        )}

        {recomendaciones && (
          <div className="mb-8 grid w-full grid-cols-1 gap-4 animate-in slide-in-from-bottom-4 fade-in duration-500">
            {recomendaciones.length === 0 && (
              <div className="w-full rounded-xl border border-cyan-500/15 bg-cyan-500/5 p-4">
                <p className="font-mono text-sm leading-relaxed text-[var(--color-text-muted)]">
                  {'>'} No hay recomendaciones nuevas fuera de tus calificaciones actuales. Prueba con más valoraciones para ampliar el espectro.
                </p>
              </div>
            )}
            {recomendaciones.map((rec, idx) => (
              <div key={idx} className={recommendationItemClass}>
                <h3 className={recommendationTitleClass}>{rec.titulo}</h3>
                <p className={recommendationDescriptionClass}>{rec.justificacion}</p>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleConsult}
          disabled={isLoading || !hasTopItems || ratingsLoading}
          className={recalcularButtonClass}
        >
          {isLoading ? (
            <>
              <div className={`h-5 w-5 rounded-full border-2 animate-spin transition-colors ${isRetroCartoon ? 'border-black border-t-transparent' : 'border-cyan-400 border-t-transparent group-hover:border-black group-hover:border-t-transparent'}`} />
              ANALIZANDO CEREBRO...
            </>
          ) : (
            <>
              <Star className={`h-5 w-5 fill-current ${isRetroCartoon ? 'text-black' : ''}`} />
              {recomendaciones ? 'RECALCULAR' : 'CONSULTAR AL ORÁCULO'}
            </>
          )}
        </button>
      </div>
    </div>
  )
}
