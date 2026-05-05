/**
 * Cliente TMDB v3 con Bearer (VITE_TMDB_ACCESS_TOKEN).
 * Búsqueda por título y detalles en es-ES; el póster guardado usa assets en inglés (en-US) cuando existan.
 */

import type { ListItem, OmdbSuggestion } from '@/features/shared'

const TMDB_BASE = 'https://api.themoviedb.org/3'
const TMDB_IMAGE_W500 = 'https://image.tmdb.org/t/p/w500'
/** Logos de proveedores (streaming / alquiler / compra). */
export const TMDB_LOGO_W45 = 'https://image.tmdb.org/t/p/w45'

function getBearerHeaders(): HeadersInit {
  const token = import.meta.env.VITE_TMDB_ACCESS_TOKEN
  if (!token?.trim()) {
    throw new Error('Falta VITE_TMDB_ACCESS_TOKEN en el entorno.')
  }
  return {
    Authorization: `Bearer ${token.trim()}`,
    Accept: 'application/json',
  }
}

async function tmdbFetch(path: string): Promise<Response> {
  const url = path.startsWith('http') ? path : `${TMDB_BASE}${path}`
  return fetch(url, { headers: getBearerHeaders() })
}

export function tmdbPosterUrl(posterPath: string | null | undefined): string | null {
  if (!posterPath) return null
  return `${TMDB_IMAGE_W500}${posterPath}`
}

interface TmdbMovieSearchResult {
  id: number
  original_title?: string
  title?: string
  release_date?: string
  poster_path?: string | null
}

interface TmdbTvSearchResult {
  id: number
  original_name?: string
  name?: string
  first_air_date?: string
  poster_path?: string | null
}

interface TmdbSearchMovieResponse {
  results?: TmdbMovieSearchResult[]
}

interface TmdbSearchTvResponse {
  results?: TmdbTvSearchResult[]
}

interface TmdbMovieDetailsEs {
  id: number
  original_title?: string
  title?: string
  overview?: string
  poster_path?: string | null
  genres?: { name: string }[]
}

interface TmdbTvDetailsEs {
  id: number
  original_name?: string
  name?: string
  overview?: string
  poster_path?: string | null
  genres?: { name: string }[]
}

/**
 * Busca la primera coincidencia de película o serie por título (incluye título original en índice de TMDB).
 */
export async function searchTmdbFirstId(
  title: string,
  tipo: 'pelicula' | 'serie'
): Promise<number | null> {
  const q = title.trim()
  if (!q) return null

  const path =
    tipo === 'pelicula'
      ? `/search/movie?query=${encodeURIComponent(q)}`
      : `/search/tv?query=${encodeURIComponent(q)}`

  const res = await tmdbFetch(path)
  if (!res.ok) {
    console.warn('TMDB search error', res.status)
    return null
  }

  if (tipo === 'pelicula') {
    const data = (await res.json()) as TmdbSearchMovieResponse
    const id = data.results?.[0]?.id
    return typeof id === 'number' ? id : null
  }

  const data = (await res.json()) as TmdbSearchTvResponse
  const id = data.results?.[0]?.id
  return typeof id === 'number' ? id : null
}

/**
 * Detalles en español (es-ES): título localizado, sinopsis, géneros.
 * El póster se toma de la variante en-US (arte habitual en inglés); si no hay, se usa el de es-ES.
 */
export async function getTmdbDetailsEs(
  id: number,
  tipo: 'pelicula' | 'serie'
): Promise<{
  originalTitle: string
  localizedTitle: string
  overviewEs: string | null
  posterUrl: string | null
  genresCsv: string | null
} | null> {
  const pathEs =
    tipo === 'pelicula'
      ? `/movie/${id}?language=es-ES`
      : `/tv/${id}?language=es-ES`
  const pathEn =
    tipo === 'pelicula'
      ? `/movie/${id}?language=en-US`
      : `/tv/${id}?language=en-US`

  const [resEs, resEn] = await Promise.all([tmdbFetch(pathEs), tmdbFetch(pathEn)])

  if (!resEs.ok) {
    console.warn('TMDB details (es-ES) error', resEs.status)
    return null
  }

  let posterPathEn: string | null | undefined
  if (resEn.ok) {
    const dEn = (await resEn.json()) as TmdbMovieDetailsEs | TmdbTvDetailsEs
    posterPathEn = dEn.poster_path
  }

  if (tipo === 'pelicula') {
    const d = (await resEs.json()) as TmdbMovieDetailsEs
    const original = (d.original_title || d.title || '').trim()
    const localized = (d.title || d.original_title || '').trim()
    const overview = d.overview?.trim()
    const posterPath = posterPathEn ?? d.poster_path
    return {
      originalTitle: original || localized,
      localizedTitle: localized || original,
      overviewEs: overview && overview.length > 0 ? overview : null,
      posterUrl: tmdbPosterUrl(posterPath),
      genresCsv: d.genres?.map((g) => g.name).filter(Boolean).join(', ') || null,
    }
  }

  const d = (await resEs.json()) as TmdbTvDetailsEs
  const original = (d.original_name || d.name || '').trim()
  const localized = (d.name || d.original_name || '').trim()
  const overview = d.overview?.trim()
  const posterPath = posterPathEn ?? d.poster_path
  return {
    originalTitle: original || localized,
    localizedTitle: localized || original,
    overviewEs: overview && overview.length > 0 ? overview : null,
    posterUrl: tmdbPosterUrl(posterPath),
    genresCsv: d.genres?.map((g) => g.name).filter(Boolean).join(', ') || null,
  }
}

export interface TmdbEnrichment {
  /** Título original (TMDB) — se guarda en `titulo`. */
  titulo: string
  /** Título en español (TMDB es-ES) — se guarda en `title_es`. */
  title_es: string | null
  overviewEs: string | null
  posterUrl: string | null
  genresCsv: string | null
}

/**
 * Resuelve metadatos TMDB a partir del texto que introdujo el usuario (o sugerencia OMDB).
 * Sin token válido devuelve `null` sin lanzar.
 */
const TMDB_SUGGESTION_CAP = 8

/**
 * Sugerencias tipo OMDB desde la búsqueda TMDB (títulos localizados y alternativos).
 * OMDB a menudo no encuentra consultas solo en español; TMDB sí.
 */
export async function searchTmdbAsOmdbSuggestions(
  query: string,
  tipo: 'pelicula' | 'serie'
): Promise<OmdbSuggestion[]> {
  if (!import.meta.env.VITE_TMDB_ACCESS_TOKEN?.trim()) return []

  const q = query.trim()
  if (q.length < 2) return []

  const mapMovie = (r: TmdbMovieSearchResult): OmdbSuggestion | null => {
    const title = (r.title || r.original_title || '').trim()
    if (!title) return null
    const y = (r.release_date || '').slice(0, 4)
    return {
      Title: title,
      Year: y || 'N/A',
      imdbID: `tmdb-movie-${r.id}`,
      Type: 'movie',
      Poster: r.poster_path ? tmdbPosterUrl(r.poster_path) ?? 'N/A' : 'N/A',
    }
  }

  const mapTv = (r: TmdbTvSearchResult): OmdbSuggestion | null => {
    const title = (r.name || r.original_name || '').trim()
    if (!title) return null
    const y = (r.first_air_date || '').slice(0, 4)
    return {
      Title: title,
      Year: y || 'N/A',
      imdbID: `tmdb-tv-${r.id}`,
      Type: 'series',
      Poster: r.poster_path ? tmdbPosterUrl(r.poster_path) ?? 'N/A' : 'N/A',
    }
  }

  const runSearch = async (language: string): Promise<OmdbSuggestion[]> => {
    const path =
      tipo === 'pelicula'
        ? `/search/movie?query=${encodeURIComponent(q)}&language=${encodeURIComponent(language)}`
        : `/search/tv?query=${encodeURIComponent(q)}&language=${encodeURIComponent(language)}`
    const res = await tmdbFetch(path)
    if (!res.ok) return []
    if (tipo === 'pelicula') {
      const data = (await res.json()) as TmdbSearchMovieResponse
      return (data.results ?? [])
        .map(mapMovie)
        .filter((x): x is OmdbSuggestion => x != null)
        .slice(0, TMDB_SUGGESTION_CAP)
    }
    const data = (await res.json()) as TmdbSearchTvResponse
    return (data.results ?? [])
      .map(mapTv)
      .filter((x): x is OmdbSuggestion => x != null)
      .slice(0, TMDB_SUGGESTION_CAP)
  }

  try {
    let list = await runSearch('es-ES')
    if (list.length === 0) {
      list = await runSearch('es-MX')
    }
    if (list.length === 0) {
      list = await runSearch('en-US')
    }
    return list
  } catch (e) {
    console.warn('searchTmdbAsOmdbSuggestions:', e)
    return []
  }
}

export function parseTmdbSuggestionImdbId(
  imdbID: string
): { id: number; tipo: 'pelicula' | 'serie' } | null {
  const movie = imdbID.match(/^tmdb-movie-(\d+)$/)
  if (movie) return { id: Number(movie[1]), tipo: 'pelicula' }
  const tv = imdbID.match(/^tmdb-tv-(\d+)$/)
  if (tv) return { id: Number(tv[1]), tipo: 'serie' }
  return null
}

function enrichmentFromDetails(
  details: NonNullable<Awaited<ReturnType<typeof getTmdbDetailsEs>>>,
  fallbackTitle: string
): TmdbEnrichment {
  const titulo = details.originalTitle || fallbackTitle.trim()
  const localized = details.localizedTitle?.trim() || ''
  const title_es = localized.length > 0 ? localized : null
  return {
    titulo,
    title_es,
    overviewEs: details.overviewEs,
    posterUrl: details.posterUrl,
    genresCsv: details.genresCsv,
  }
}

/** Enriquece desde el id TMDB de una sugerencia (sin segunda búsqueda por título). */
export async function enrichFromTmdbByNumericId(
  id: number,
  tipo: 'pelicula' | 'serie'
): Promise<TmdbEnrichment | null> {
  if (!import.meta.env.VITE_TMDB_ACCESS_TOKEN?.trim()) {
    return null
  }
  try {
    const details = await getTmdbDetailsEs(id, tipo)
    if (!details) return null
    return enrichmentFromDetails(details, details.originalTitle)
  } catch (e) {
    console.warn('enrichFromTmdbByNumericId:', e)
    return null
  }
}

export async function enrichFromTmdb(
  displayTitle: string,
  tipo: 'pelicula' | 'serie'
): Promise<TmdbEnrichment | null> {
  if (!import.meta.env.VITE_TMDB_ACCESS_TOKEN?.trim()) {
    return null
  }

  try {
    const id = await searchTmdbFirstId(displayTitle, tipo)
    if (id == null) return null

    const details = await getTmdbDetailsEs(id, tipo)
    if (!details) return null

    return enrichmentFromDetails(details, displayTitle)
  } catch (e) {
    console.warn('enrichFromTmdb:', e)
    return null
  }
}

/** Código de región TMDB para watch-providers (resultados por país). */
export function tmdbWatchRegionFromUiLanguage(language: string): string {
  const base = (language || 'es').split('-')[0]?.toLowerCase() ?? 'es'
  if (base === 'en') return 'US'
  if (base === 'es') return 'ES'
  if (base === 'pt') return 'BR'
  if (base === 'fr') return 'FR'
  if (base === 'de') return 'DE'
  return 'ES'
}

export interface WatchProviderEntry {
  provider_id: number
  provider_name: string
  logo_path: string | null
}

export interface ItemWatchProvidersResult {
  /** Región TMDB cuyos datos se muestran (p. ej. ES, US). */
  regionCode: string
  /** Enlace JustWatch / TMDB para la región, si viene en la API. */
  watchLink: string | null
  flatrate: WatchProviderEntry[]
  rent: WatchProviderEntry[]
  buy: WatchProviderEntry[]
}

interface TmdbProviderRaw {
  logo_path: string | null
  provider_id: number
  provider_name: string
}

interface TmdbRegionBundle {
  link?: string
  flatrate?: TmdbProviderRaw[]
  /** Gratis con anuncios / AVOD (TMDB). */
  ads?: TmdbProviderRaw[]
  free?: TmdbProviderRaw[]
  rent?: TmdbProviderRaw[]
  buy?: TmdbProviderRaw[]
}

interface TmdbWatchProvidersApi {
  results?: Record<string, TmdbRegionBundle>
}

function mapProviderList(list: TmdbProviderRaw[] | undefined): WatchProviderEntry[] {
  if (!list?.length) return []
  return list.map((p) => ({
    provider_id: p.provider_id,
    provider_name: p.provider_name,
    logo_path: p.logo_path,
  }))
}

function regionBundleProviderCount(bundle: TmdbRegionBundle): number {
  return (
    (bundle.flatrate?.length ?? 0) +
    (bundle.ads?.length ?? 0) +
    (bundle.free?.length ?? 0) +
    (bundle.rent?.length ?? 0) +
    (bundle.buy?.length ?? 0)
  )
}

/** Suscripción + gratis / con anuncios, sin duplicar por `provider_id`. */
function mergeSubscriptionProviders(bundle: TmdbRegionBundle): WatchProviderEntry[] {
  const out: WatchProviderEntry[] = []
  const seen = new Set<number>()
  const push = (list: TmdbProviderRaw[] | undefined) => {
    for (const p of mapProviderList(list)) {
      if (seen.has(p.provider_id)) continue
      seen.add(p.provider_id)
      out.push(p)
    }
  }
  push(bundle.flatrate)
  push(bundle.free)
  push(bundle.ads)
  return out
}

function pickRegionBundle(
  results: Record<string, TmdbRegionBundle> | undefined,
  preferred: string
): { regionCode: string; bundle: TmdbRegionBundle } | null {
  if (!results) return null
  const order = [preferred, 'ES', 'MX', 'AR', 'US', 'GB', 'DE', 'FR', 'BR']
  const seen = new Set<string>()
  for (const code of order) {
    if (!code || seen.has(code)) continue
    seen.add(code)
    const bundle = results[code]
    if (!bundle) continue
    if (regionBundleProviderCount(bundle) > 0) return { regionCode: code, bundle }
  }
  for (const code of Object.keys(results)) {
    if (seen.has(code)) continue
    const bundle = results[code]
    if (!bundle) continue
    if (regionBundleProviderCount(bundle) > 0) return { regionCode: code, bundle }
  }
  return null
}

/**
 * Resuelve el id numérico TMDB del ítem (misma heurística que la sinopsis: títulos en orden).
 */
export async function resolveTmdbIdForItem(item: ListItem): Promise<number | null> {
  if (!import.meta.env.VITE_TMDB_ACCESS_TOKEN?.trim()) return null

  const tryTitles = [item.titulo, item.title_es].filter((t): t is string => Boolean(t?.trim()))
  const seen = new Set<string>()

  try {
    for (const raw of tryTitles) {
      const t = raw.trim()
      const key = t.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      const id = await searchTmdbFirstId(t, item.tipo)
      if (id != null) return id
    }
  } catch {
    return null
  }
  return null
}

/**
 * Proveedores de streaming / alquiler / compra (TMDB watch providers) para una región.
 * Si la región pedida no tiene datos, prueba otras en cascada.
 */
export async function resolveItemWatchProviders(
  item: ListItem,
  uiLanguage: string
): Promise<ItemWatchProvidersResult | null> {
  if (!import.meta.env.VITE_TMDB_ACCESS_TOKEN?.trim()) return null

  try {
    const id = await resolveTmdbIdForItem(item)
    if (id == null) return null

    const path =
      item.tipo === 'pelicula' ? `/movie/${id}/watch/providers` : `/tv/${id}/watch/providers`
    const res = await tmdbFetch(path)
    if (!res.ok) {
      console.warn('TMDB watch providers', res.status)
      return null
    }

    const body = (await res.json()) as TmdbWatchProvidersApi
    const preferred = tmdbWatchRegionFromUiLanguage(uiLanguage)
    const picked = pickRegionBundle(body.results, preferred)
    if (!picked) return null

    const { regionCode, bundle } = picked
    return {
      regionCode,
      watchLink: typeof bundle.link === 'string' && bundle.link.length > 0 ? bundle.link : null,
      flatrate: mergeSubscriptionProviders(bundle),
      rent: mapProviderList(bundle.rent),
      buy: mapProviderList(bundle.buy),
    }
  } catch (e) {
    console.warn('resolveItemWatchProviders:', e)
    return null
  }
}
