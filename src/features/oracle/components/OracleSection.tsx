import React, { useMemo } from 'react'
import { BrainCircuit, Star, AlertTriangle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/supabaseClient'
import { useAuth } from '@/features/auth'
import { useOracleRecommendations } from '@/hooks/useOracleRecommendations'

interface OracleSectionProps {
  items?: unknown // kept for API compatibility, no longer used
}

export const OracleSection: React.FC<OracleSectionProps> = () => {
  const { user } = useAuth()
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
        item: Array.isArray(r.items) ? r.items[0] as { id: string; titulo: string } | undefined : r.items as { id: string; titulo: string } | null,
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

  return (
    <div className="rounded-2xl border border-cyan-500/30 bg-black p-6 md:p-8 shadow-[0_0_30px_rgba(6,182,212,0.05)] relative overflow-hidden">
      {/* Grid cyber punk background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
      
      <div className="relative z-10 flex flex-col items-start w-full">
        <div className="mb-6 flex flex-col">
          <h2 className="font-mono text-xl md:text-2xl font-black uppercase tracking-[0.15em] text-cyan-400 flex items-center gap-3 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">
            <BrainCircuit className="h-6 w-6 md:h-8 md:w-8" />
            EL ORÁCULO AI
          </h2>
          <p className="font-mono text-[10px] md:text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)] mt-2 opacity-70">
            {'>'} PREDICCIÓN_NEURONAL_BASADA_EN_AFINIDAD
          </p>
        </div>

        {/* Estado: sin ratings suficientes */}
        {!hasTopItems && !recomendaciones && !error && (
          <div className="mb-8 p-4 border border-cyan-500/15 bg-cyan-500/5 rounded-xl w-full">
            <p className="font-mono text-sm text-[var(--color-text-muted)] leading-relaxed">
              {'>'} <span className="text-cyan-400">MEMORIA_INSUFICIENTE.</span> El Oráculo necesita datos de afinidad.<br />
              <span className="opacity-70 text-xs mt-1 block">Califica películas con <strong className="text-white">4–5 ⭐</strong> o dale <strong className="text-white">❤️ like</strong> para activar las predicciones.</span>
            </p>
          </div>
        )}

        {/* Estado: con datos disponibles */}
        {hasTopItems && !recomendaciones && !error && (
          <div className="mb-8 p-4 border border-white/5 bg-white/5 rounded-xl w-full">
            <p className="font-mono text-sm text-[var(--color-text-muted)]">
              Sistema calibrado con <span className="text-cyan-400 font-bold">{topItems.length} memorias estelares</span>. Listo para cruzar datos con la colmena.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-8 w-full border border-red-500/50 bg-red-500/10 p-5 rounded-xl flex items-start gap-4 animate-in fade-in duration-300">
             <AlertTriangle className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
             <p className="font-mono text-red-400 text-sm md:text-base leading-relaxed">{error}</p>
          </div>
        )}

        {recomendaciones && (
          <div className="mb-8 w-full grid grid-cols-1 gap-4 animate-in slide-in-from-bottom-4 fade-in duration-500">
            {recomendaciones.length === 0 && (
              <div className="p-4 border border-cyan-500/15 bg-cyan-500/5 rounded-xl w-full">
                <p className="font-mono text-sm text-[var(--color-text-muted)] leading-relaxed">
                  {'>'} No hay recomendaciones nuevas fuera de tus calificaciones actuales. Prueba con mÃ¡s valoraciones para ampliar el espectro.
                </p>
              </div>
            )}
            {recomendaciones.map((rec, idx) => (
              <div key={idx} className="border-l-2 border-cyan-500 pl-4 py-2 hover:bg-cyan-500/5 transition-colors duration-300">
                <h3 className="font-mono font-bold text-cyan-400 text-lg md:text-xl drop-shadow-[0_0_5px_rgba(6,182,212,0.3)]">{rec.titulo}</h3>
                <p className="font-mono text-sm md:text-base text-slate-300 mt-2 opacity-90 leading-relaxed">
                  {rec.justificacion}
                </p>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleConsult}
          disabled={isLoading || !hasTopItems || ratingsLoading}
          className="group relative flex w-full md:w-auto items-center justify-center gap-3 overflow-hidden rounded-xl border border-cyan-500 bg-cyan-500/10 px-8 py-4 font-mono text-sm md:text-base font-black uppercase tracking-[0.15em] text-cyan-400 transition-all hover:bg-cyan-500 hover:text-black hover:shadow-[0_0_25px_rgba(6,182,212,0.4)] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-cyan-500/10 disabled:hover:text-cyan-400 disabled:hover:shadow-none"
        >
          {isLoading ? (
            <>
               <div className="h-5 w-5 border-2 border-cyan-400 group-hover:border-black border-t-transparent group-hover:border-t-transparent rounded-full animate-spin transition-colors" />
               ANALIZANDO CEREBRO...
            </>
          ) : (
             <>
               <Star className="h-5 w-5 fill-current" />
               {recomendaciones ? 'RECALCULAR' : 'CONSULTAR AL ORÁCULO'}
             </>
          )}
        </button>
      </div>
    </div>
  )
}
