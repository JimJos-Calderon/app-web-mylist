import React, { useMemo } from 'react'
import { BrainCircuit, Star, AlertTriangle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/supabaseClient'
import { useAuth } from '@/features/auth'
import { useTheme } from '@/features/shared'
import { queryKeys } from '@config/queryKeys'
import { FavoriteItem, useOracleRecommendations } from '@/hooks/useOracleRecommendations'

const MAX_ORACLE_POSITIVE_ITEMS = 40
const MAX_ORACLE_NEGATIVE_ITEMS = 20

type RatedRow = {
  rating: number | null
  liked: boolean | null
  item: { id: string; titulo: string } | undefined
  comment?: string
}

function classifyOracleSignal(row: RatedRow): 'positive' | 'negative' | 'neutral' {
  if (row.liked === true) return 'positive'
  if (row.liked === false) return 'negative'
  if (row.rating != null) {
    if (row.rating >= 4) return 'positive'
    if (row.rating <= 2) return 'negative'
  }
  return 'neutral'
}

function oraclePositiveScore(row: RatedRow): number {
  let s = 0
  if (row.rating != null) s += row.rating * 10
  if (row.liked === true) s += 25
  return s
}

function oracleNegativeScore(row: RatedRow): number {
  let s = 0
  if (row.rating != null) s += (6 - row.rating) * 10
  if (row.liked === false) s += 35
  return s
}

function ratedRowToFavoriteItem(row: RatedRow): FavoriteItem {
  let nota: string
  if (row.rating !== null && row.liked !== null) {
    nota = `${row.rating}/5 estrellas + ${row.liked ? 'me gustó' : 'no me gustó'}`
  } else if (row.rating !== null) {
    nota = `${row.rating}/5 estrellas`
  } else {
    nota = row.liked ? 'me gustó' : 'no me gustó'
  }
  return {
    titulo: row.item!.titulo,
    nota,
    comment: row.comment || undefined,
  }
}

type OracleThemeId = 'retro' | 'terminal' | 'cyberpunk' | 'default'

/** Textos del Oráculo alineados con cada tema visual */
const ORACLE_COPY: Record<
  OracleThemeId,
  {
    title: string
    subtitle: string
    insufficientTag: string
    insufficientLine1: string
    hintStars: string
    hintMid: string
    hintLike: string
    hintEnd: string
    calibratedPosSuffix: string
    calibratedNegSuffix: string
    calibratedProfileLine: string
    calibratedDetailLine: string
    noRecommendations: string
    loading: string
    consult: string
    recalc: string
    errorPrefix: string
  }
> = {
  retro: {
    title: 'EL GRAN PROYECTOR',
    subtitle: '> TRES TITULOS PARA TU NOCHE DE CINE',
    insufficientTag: 'CINTA SIN MARCAS',
    insufficientLine1:
      ' Sin marca clara de lo que SI te gusta no podemos proyectar. Lo que NO te gusta tambien ayuda al archivo.',
    hintStars: '4 o 5 estrellas',
    hintMid: ' u ',
    hintLike: 'corazon',
    hintEnd: ' en favoritos; marca bajas o no me gusta en lo que rechaces.',
    calibratedPosSuffix: ' EN CARTELERA SI',
    calibratedNegSuffix: ' CORTADAS',
    calibratedProfileLine: 'ANALIZANDO TODO TU ARCHIVO (POSITIVOS Y NEGATIVOS)',
    calibratedDetailLine: ' Pulsa el boton: tres titulos respetando tu lista negra.',
    noRecommendations:
      '> Nada nuevo fuera de lo que ya votaste. Marca mas titulos y ampliamos cartel.',
    loading: 'CRUZANDO DATOS DE TUS GUSTOS...',
    consult: 'VER TRES SUGERENCIAS',
    recalc: 'OTRA FUNCION',
    errorPrefix: 'CORTE: ',
  },
  terminal: {
    title: 'CONSULTA DE DATOS',
    subtitle: '> Tres títulos según lo que valoraste',
    insufficientTag: 'SIN DATOS PARA PROCESAR',
    insufficientLine1:
      ' Necesitamos al menos un bloque positivo (4–5 o me gusta). Lo negativo refina el resultado si ya existe positivo.',
    hintStars: '4 o 5 estrellas',
    hintMid: ' o ',
    hintLike: 'me gusta',
    hintEnd: ' para positivo; 1–2 o no me gusta para excluir patrones.',
    calibratedPosSuffix: ' ENTRADAS +',
    calibratedNegSuffix: ' ENTRADAS -',
    calibratedProfileLine: 'PROCESANDO PERFIL COMPLETO: +/- DATA DETECTED',
    calibratedDetailLine: ' Listo. Pulsa para obtener tres sugerencias filtradas.',
    noRecommendations:
      '> No hay títulos nuevos con lo que ya valoraste. Añade más opiniones e inténtalo de nuevo.',
    loading: 'CALIBRANDO FILTROS DE EXCLUSIÓN...',
    consult: 'INICIAR ANÁLISIS',
    recalc: 'NUEVO ANÁLISIS',
    errorPrefix: 'No se pudo completar: ',
  },
  cyberpunk: {
    title: 'PREDICCIÓN NEURAL',
    subtitle: '> Tres opciones alineadas con tu historial',
    insufficientTag: 'SEÑAL INSUFICIENTE',
    insufficientLine1:
      ' Hace falta al menos una señal fuerte de lo que te gusta. Tus rechazos afinan el mapa cuando ya hay luz.',
    hintStars: 'Valoraciones de 4 o 5',
    hintMid: ' o ',
    hintLike: 'marcar favorito',
    hintEnd: ' para la parte luminosa; baja puntuación o no favorito para la sombra.',
    calibratedPosSuffix: ' LUZ',
    calibratedNegSuffix: ' SOMBRA',
    calibratedProfileLine: 'SINCRONIZANDO LUZ Y SOMBRA... PERFIL COMPLETO',
    calibratedDetailLine: ' Puedes generar tres recomendaciones equilibradas.',
    noRecommendations:
      '> No encontramos coincidencias nuevas fuera de tu historial. Más valoraciones amplían las sugerencias.',
    loading: 'CRUZANDO DATOS DE TUS GUSTOS...',
    consult: 'GENERAR RECOMENDACIÓN',
    recalc: 'VOLVER A GENERAR',
    errorPrefix: 'Conexión interrumpida: ',
  },
  default: {
    title: 'EL ORÁCULO AI',
    subtitle: '> Usamos lo que te gusta y lo que prefieres evitar',
    insufficientTag: 'FALTAN DATOS',
    insufficientLine1:
      ' Necesitamos al menos valoraciones altas o un me gusta. Lo que no te gusta mejora el filtro cuando ya hay gustos claros.',
    hintStars: 'Califica con 4–5 ⭐',
    hintMid: ' o ',
    hintLike: '❤️ me gusta',
    hintEnd: ' para positivo; estrellas bajas o 👎 para refinar exclusiones.',
    calibratedPosSuffix: ' gustos detectados',
    calibratedNegSuffix: ' rechazos en perfil',
    calibratedProfileLine: 'Perfil completo: cruzamos favoritos y antipatías.',
    calibratedDetailLine: ' Listo para tres recomendaciones personalizadas.',
    noRecommendations:
      '> No hay títulos nuevos con tus valoraciones actuales. Añade más opiniones para ampliar el resultado.',
    loading: 'CRUZANDO DATOS DE TUS GUSTOS...',
    consult: 'VER RECOMENDACIONES',
    recalc: 'CALCULAR DE NUEVO',
    errorPrefix: 'Algo salió mal: ',
  },
}

interface OracleSectionProps {
  items?: unknown // kept for API compatibility, no longer used
}

export const OracleSection: React.FC<OracleSectionProps> = () => {
  const { user } = useAuth()
  const { theme } = useTheme()
  const isRetroCartoon = theme === 'retro-cartoon'
  const isTerminal = theme === 'terminal'
  const isCyberpunk = theme === 'cyberpunk'
  const { isLoading, error, recomendaciones, fetchRecommendations } = useOracleRecommendations()

  // Consultamos TODOS los items calificados del usuario en todas las listas
  // haciendo un join directo en Supabase para obtener el título
  const { data: ratedItems = [], isLoading: ratingsLoading } = useQuery({
    queryKey: user?.id ? queryKeys.oracle.allRatingsForUser(user.id) : ['itemRatings', 'oracle', 'idle'],
    queryFn: async () => {
      const { data: ratingsData, error } = await supabase
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

      const normalizedRatings = (ratingsData ?? []).map((r: any) => ({
        rating: r.rating as number | null,
        liked: r.liked as boolean | null,
        item: Array.isArray(r.items)
          ? (r.items[0] as { id: string; titulo: string } | undefined)
          : (r.items as { id: string; titulo: string } | null),
      }))

      const itemIds = normalizedRatings
        .map((rating) => rating.item?.id)
        .filter((id): id is string => Boolean(id))

      if (itemIds.length === 0) {
        return normalizedRatings.map((rating) => ({
          ...rating,
          comment: undefined as string | undefined,
        }))
      }

      const { data: commentsData, error: commentsError } = await supabase
        .from('item_comments')
        .select('item_id, content')
        .eq('user_id', user!.id)
        .in('item_id', itemIds)

      if (commentsError) throw commentsError

      const commentsByItemId = new Map<string, string>()
      for (const row of commentsData ?? []) {
        commentsByItemId.set(String(row.item_id), row.content)
      }

      return normalizedRatings.map((rating) => ({
        ...rating,
        comment: rating.item?.id ? commentsByItemId.get(String(rating.item.id)) : undefined,
      }))
    },
    enabled: !!user?.id,
  })

  const positiveItems = useMemo<FavoriteItem[]>(() => {
    const rows = ratedItems.filter((r): r is RatedRow & { item: { id: string; titulo: string } } =>
      Boolean(r.item?.titulo),
    )
    const pos = rows.filter((r) => classifyOracleSignal(r) === 'positive')
    pos.sort((a, b) => oraclePositiveScore(b) - oraclePositiveScore(a))
    return pos.slice(0, MAX_ORACLE_POSITIVE_ITEMS).map(ratedRowToFavoriteItem)
  }, [ratedItems])

  const negativeItems = useMemo<FavoriteItem[]>(() => {
    const rows = ratedItems.filter((r): r is RatedRow & { item: { id: string; titulo: string } } =>
      Boolean(r.item?.titulo),
    )
    const neg = rows.filter((r) => classifyOracleSignal(r) === 'negative')
    neg.sort((a, b) => oracleNegativeScore(b) - oracleNegativeScore(a))
    return neg.slice(0, MAX_ORACLE_NEGATIVE_ITEMS).map(ratedRowToFavoriteItem)
  }, [ratedItems])

  const ratedTitles = useMemo(
    () =>
      ratedItems
        .filter((r) => r.item?.titulo)
        .map((r) => r.item!.titulo),
    [ratedItems],
  )

  const handleConsult = () => {
    fetchRecommendations(positiveItems, negativeItems, ratedTitles)
  }

  const hasPositiveSignal = positiveItems.length > 0

  const headerTitleClass = isRetroCartoon
    ? 'theme-heading-font flex items-center gap-3 font-black text-2xl uppercase tracking-[0.12em] text-black md:text-3xl'
    : isTerminal
      ? 'theme-heading-font flex items-center gap-3 text-xl font-black uppercase tracking-[0.15em] text-[var(--color-accent-primary)] md:text-2xl'
      : isCyberpunk
        ? 'theme-heading-font flex items-center gap-3 text-xl font-black uppercase tracking-[0.18em] text-[var(--color-text-primary)] md:text-2xl cyberpunk-text-glow'
        : 'flex items-center gap-3 font-mono text-xl font-black uppercase tracking-[0.15em] text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)] md:text-2xl'
  const headerSubtitleClass = isRetroCartoon
    ? 'theme-heading-font mt-2 text-[10px] uppercase tracking-[0.2em] text-black opacity-90 md:text-xs'
    : isCyberpunk
      ? 'theme-body-font mt-2 text-[10px] uppercase tracking-[0.24em] text-[var(--color-accent-secondary)] opacity-85 md:text-xs cyberpunk-text-glow-secondary'
      : 'mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-muted)] opacity-70 md:text-xs'
  const recommendationItemClass = isRetroCartoon
    ? 'border-l-[4px] border-black pl-4 py-2 transition-colors duration-300 hover:bg-black/[0.04]'
    : isTerminal
      ? 'terminal-panel rounded-none border-l-[3px] pl-4 py-3 transition-colors duration-300'
      : isCyberpunk
        ? 'cyberpunk-surface rounded-xl pl-4 py-3 transition-colors duration-300'
        : 'border-l-2 border-cyan-500 pl-4 py-2 transition-colors duration-300 hover:bg-cyan-500/5'
  const recommendationTitleClass = isRetroCartoon
    ? 'theme-heading-font text-lg font-bold text-black'
    : isTerminal
      ? 'theme-heading-font text-lg font-bold text-[var(--color-accent-primary)] md:text-xl'
      : isCyberpunk
        ? 'theme-heading-font text-lg font-bold text-[var(--color-text-primary)] md:text-xl cyberpunk-text-glow'
        : 'font-mono text-lg font-bold text-cyan-400 drop-shadow-[0_0_5px_rgba(6,182,212,0.3)] md:text-xl'
  const recommendationDescriptionClass = isRetroCartoon
    ? 'theme-heading-font mt-2 text-sm font-medium leading-relaxed text-black md:text-base'
    : isTerminal
      ? 'theme-body-font mt-2 text-sm leading-relaxed text-[var(--color-text-muted)] md:text-base'
      : isCyberpunk
        ? 'theme-body-font mt-2 text-sm leading-relaxed text-[var(--color-accent-secondary)] md:text-base cyberpunk-text-glow-secondary'
        : 'mt-2 font-mono text-sm leading-relaxed text-slate-300 opacity-90 md:text-base'
  const recalcularButtonClass = isRetroCartoon
    ? 'theme-heading-font w-full px-4 py-3 font-bold uppercase transition-all bg-white text-black border-[3px] border-black shadow-[4px_4px_0px_0px_#000000] rounded-xl hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_#000000] active:translate-y-0 active:translate-x-0 active:shadow-none'
    : isTerminal
      ? 'terminal-button theme-heading-font group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-none px-8 py-4 text-sm font-black uppercase tracking-[0.15em] disabled:cursor-not-allowed disabled:opacity-30 md:w-auto md:text-base'
      : isCyberpunk
        ? 'cyberpunk-button theme-heading-font group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-full px-8 py-4 text-sm font-black uppercase tracking-[0.18em] disabled:cursor-not-allowed disabled:opacity-30 md:w-auto md:text-base'
        : 'group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl border border-cyan-500 bg-cyan-500/10 px-8 py-4 font-mono text-sm font-black uppercase tracking-[0.15em] text-cyan-400 transition-all hover:bg-cyan-500 hover:text-black hover:shadow-[0_0_25px_rgba(6,182,212,0.4)] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-cyan-500/10 disabled:hover:text-cyan-400 disabled:hover:shadow-none md:w-auto md:text-base'

  const oracleTheme: OracleThemeId = isRetroCartoon
    ? 'retro'
    : isTerminal
      ? 'terminal'
      : isCyberpunk
        ? 'cyberpunk'
        : 'default'
  const oc = ORACLE_COPY[oracleTheme]

  const accentSpanClass = isRetroCartoon
    ? 'font-bold text-black'
    : isTerminal
      ? 'text-[var(--color-accent-primary)]'
      : isCyberpunk
        ? 'text-[var(--color-text-primary)] cyberpunk-text-glow'
        : 'text-cyan-400'

  const hintStrongClass = isRetroCartoon
    ? 'font-bold text-black'
    : isTerminal
      ? 'text-[var(--color-accent-primary)]'
      : isCyberpunk
        ? 'text-[var(--color-accent-secondary)] cyberpunk-text-glow-secondary'
        : 'text-white'

  const outerShellClass = isRetroCartoon
    ? 'relative overflow-hidden rounded-2xl border-[3px] border-black bg-[#FFF8E7] p-6 shadow-[8px_8px_0px_0px_#000000] md:p-8'
    : isTerminal
      ? 'relative overflow-hidden rounded-none p-6 terminal-panel md:p-8'
      : isCyberpunk
        ? 'relative overflow-hidden p-6 cyberpunk-surface md:p-8'
        : 'relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-black p-6 shadow-[0_0_30px_rgba(6,182,212,0.05)] md:p-8'

  const panelInsufficientVisual = isRetroCartoon
    ? 'w-full rounded-xl border-[3px] border-black bg-white p-4 shadow-[4px_4px_0px_0px_#000000]'
    : isTerminal
      ? 'terminal-panel w-full rounded-none p-4'
      : isCyberpunk
        ? 'cyberpunk-surface w-full p-4'
        : 'w-full rounded-xl border border-cyan-500/15 bg-cyan-500/5 p-4'

  const statusBoxInsufficientClass = `mb-8 ${panelInsufficientVisual}`

  const statusBoxCalibratedClass = isRetroCartoon
    ? 'mb-8 w-full rounded-xl border-[3px] border-black bg-white p-4 shadow-[4px_4px_0px_0px_#000000]'
    : isTerminal
      ? 'terminal-panel mb-8 w-full rounded-none p-4'
      : isCyberpunk
        ? 'cyberpunk-surface mb-8 w-full p-4'
        : 'mb-8 w-full rounded-xl border border-white/5 bg-white/5 p-4'

  const statusBodyClass = isRetroCartoon
    ? 'theme-heading-font text-sm leading-relaxed text-black'
    : isTerminal || isCyberpunk
      ? 'theme-body-font text-sm leading-relaxed text-[var(--color-text-muted)]'
      : 'font-mono text-sm leading-relaxed text-[var(--color-text-muted)]'

  const statusBodyMutedClass = isRetroCartoon ? 'opacity-80' : 'opacity-70'

  const errorBoxClass = isRetroCartoon
    ? 'mb-8 flex w-full animate-in fade-in items-start gap-4 rounded-xl border-[3px] border-red-800 bg-red-50 p-5 shadow-[4px_4px_0px_0px_#991b1b] duration-300'
    : isTerminal
      ? 'mb-8 flex w-full animate-in fade-in items-start gap-4 rounded-none border border-[rgba(255,0,0,0.8)] bg-[rgba(20,0,0,0.85)] p-5 text-[#ff4d4d] duration-300'
      : 'mb-8 flex w-full animate-in fade-in items-start gap-4 rounded-xl border border-red-500/50 bg-red-500/10 p-5 duration-300'

  const errorTextClass = isRetroCartoon
    ? 'theme-heading-font text-sm leading-relaxed text-red-900 md:text-base'
    : isTerminal
      ? 'theme-body-font text-sm leading-relaxed text-[#ff4d4d] md:text-base'
      : 'font-mono text-sm leading-relaxed text-red-400 md:text-base'

  const spinnerClass = isRetroCartoon
    ? 'h-5 w-5 rounded-full border-2 border-black border-t-transparent animate-spin transition-colors'
    : isTerminal
      ? 'h-5 w-5 rounded-full border-2 border-[var(--color-accent-primary)] border-t-transparent animate-spin transition-colors'
      : isCyberpunk
        ? 'h-5 w-5 rounded-full border-2 border-[var(--color-text-primary)] border-t-transparent animate-spin transition-colors'
        : 'h-5 w-5 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin transition-colors group-hover:border-black group-hover:border-t-transparent'

  return (
    <div className={outerShellClass}>
      {!isRetroCartoon && (
        <div
          className={`pointer-events-none absolute inset-0 bg-[size:20px_20px] ${
            isTerminal
              ? 'bg-[linear-gradient(rgba(0,255,65,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,65,0.035)_1px,transparent_1px)]'
              : isCyberpunk
                ? 'bg-[linear-gradient(rgba(0,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,0,255,0.035)_1px,transparent_1px)]'
                : 'bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)]'
          }`}
        />
      )}

      <div className="relative z-10 flex w-full flex-col items-start">
        <div className="mb-6 flex flex-col">
          <h2 className={headerTitleClass}>
            <BrainCircuit className="h-6 w-6 md:h-8 md:w-8" />
            {oc.title}
          </h2>
          <p className={headerSubtitleClass}>{oc.subtitle}</p>
        </div>

        {!hasPositiveSignal && !recomendaciones && !error && (
          <div className={statusBoxInsufficientClass}>
            <p className={statusBodyClass}>
              {'> '}
              <span className={accentSpanClass}>{oc.insufficientTag}</span> {oc.insufficientLine1}
              <br />
              <span className={`mt-1 block text-xs ${statusBodyMutedClass}`}>
                <strong className={hintStrongClass}>{oc.hintStars}</strong>
                {oc.hintMid}
                <strong className={hintStrongClass}>{oc.hintLike}</strong>
                {oc.hintEnd}
              </span>
            </p>
          </div>
        )}

        {hasPositiveSignal && !recomendaciones && !error && (
          <div className={statusBoxCalibratedClass}>
            <p className={statusBodyClass}>
              <span className={`font-bold ${accentSpanClass}`}>{positiveItems.length}</span>
              {oc.calibratedPosSuffix}
              <span className="mx-1.5 opacity-50">·</span>
              <span className={`font-bold ${accentSpanClass}`}>{negativeItems.length}</span>
              {oc.calibratedNegSuffix}
              <span
                className={`mt-2 block text-xs font-medium leading-snug ${statusBodyMutedClass} ${isRetroCartoon ? 'theme-heading-font tracking-wide' : ''}`}
              >
                {oc.calibratedProfileLine}
              </span>
              <span className="mt-1 block text-sm leading-relaxed">{oc.calibratedDetailLine}</span>
            </p>
          </div>
        )}

        {error && (
          <div className={errorBoxClass}>
            <AlertTriangle
              className={`mt-0.5 h-6 w-6 flex-shrink-0 ${isRetroCartoon ? 'text-red-800' : isTerminal ? 'text-[#ff0000]' : 'text-red-500'}`}
            />
            <p className={errorTextClass}>
              {oc.errorPrefix}
              {error}
            </p>
          </div>
        )}

        {recomendaciones && (
          <div className="mb-8 grid w-full grid-cols-1 gap-4 animate-in slide-in-from-bottom-4 fade-in duration-500">
            {recomendaciones.length === 0 && (
              <div className={panelInsufficientVisual}>
                <p className={statusBodyClass}>{oc.noRecommendations}</p>
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
          disabled={isLoading || !hasPositiveSignal || ratingsLoading}
          className={recalcularButtonClass}
        >
          {isLoading ? (
            <>
              <div className={spinnerClass} />
              {oc.loading}
            </>
          ) : (
            <>
              <Star className={`h-5 w-5 fill-current ${isRetroCartoon ? 'text-black' : ''}`} />
              {recomendaciones ? oc.recalc : oc.consult}
            </>
          )}
        </button>
      </div>
    </div>
  )
}
