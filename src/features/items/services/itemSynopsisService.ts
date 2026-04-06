import type { ListItem, OmdbResponse } from '@/features/shared'
import { supabase } from '@/supabaseClient'
import { getTmdbDetailsEs, searchTmdbFirstId } from './tmdbService'

const GROQ_SYNOPSIS_SYSTEM_PROMPT =
  'Eres un experto en cine y series. Escribe una sinopsis breve en español (2 a 4 frases), informativa y sin spoilers fuertes. Devuelve ÚNICAMENTE el texto de la sinopsis, sin comillas, sin títulos, sin markdown ni comentarios.'

function normalizeGroqText(value: string) {
  return value
    .trim()
    .replace(/^["'`]+|["'`]+$/g, '')
    .replace(/\n{3,}/g, '\n\n')
}

async function fetchOmdbPlot(title: string, tipo: 'pelicula' | 'serie'): Promise<string | null> {
  const { data, error } = await supabase.functions.invoke('search-omdb', {
    body: {
      query: title,
      type: tipo === 'pelicula' ? 'movie' : 'series',
      mode: 'detail',
    },
  })

  if (error) {
    console.warn('OMDB synopsis:', error.message)
    return null
  }

  const omdbData = data as OmdbResponse
  const plot = omdbData.Plot
  return plot && plot !== 'N/A' ? plot : null
}

async function fetchGroqSynopsis(titulo: string, titleEs: string | null | undefined): Promise<string | null> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY
  if (!apiKey?.trim()) return null

  const userPrompt = [
    `Obra: "${titulo}"`,
    titleEs?.trim() ? `Título en español (referencia): "${titleEs.trim()}"` : '',
    '',
    'Genera la sinopsis en español.',
  ]
    .filter(Boolean)
    .join('\n')

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey.trim()}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: GROQ_SYNOPSIS_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      max_completion_tokens: 400,
    }),
  })

  if (!response.ok) return null

  const data = await response.json()
  const text = normalizeGroqText(data.choices?.[0]?.message?.content ?? '')
  return text.length > 0 ? text : null
}

async function tmdbOverviewForItem(item: ListItem): Promise<string | null> {
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
      if (id == null) continue

      const details = await getTmdbDetailsEs(id, item.tipo)
      if (details?.overviewEs) return details.overviewEs
    }
  } catch {
    return null
  }

  return null
}

/**
 * Sinopsis: TMDB (es-ES) → OMDB → Groq solo si faltan las anteriores.
 * Los títulos siempre vienen de datos del ítem / TMDB; la IA no inventa el título.
 */
export async function resolveItemSynopsis(item: ListItem): Promise<string | null> {
  const tmdb = await tmdbOverviewForItem(item)
  if (tmdb) return tmdb

  const omdb = await fetchOmdbPlot(item.titulo, item.tipo)
  if (omdb) return omdb

  if (item.title_es?.trim()) {
    const omdbEs = await fetchOmdbPlot(item.title_es.trim(), item.tipo)
    if (omdbEs) return omdbEs
  }

  return fetchGroqSynopsis(item.titulo, item.title_es)
}
