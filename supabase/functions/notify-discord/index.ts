import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

/** URL pública de la app (sin slash final). Ej: supabase secrets set PUBLIC_APP_URL=https://tu-dominio.com */
const APP_BASE_URL = (Deno.env.get('PUBLIC_APP_URL') ?? Deno.env.get('APP_BASE_URL') ?? '').replace(/\/$/, '')

interface ItemRecord {
  id: string
  titulo: string
  title_es?: string | null
  tipo: 'pelicula' | 'serie'
  poster_url: string | null
  user_id: string
  user_email?: string | null
  list_id: string
  genero?: string
  created_at: string
  /** Si el webhook de DB envía nombre de usuario en el registro */
  user_name?: string | null
}

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record: ItemRecord
  schema: string
}

type ListTheme = 'cyberpunk' | 'terminal' | 'retro-cartoon' | 'default'

interface ListNotifyRow {
  discord_webhook_url: string | null
  theme: string | null
  name: string | null
}

function normalizeListTheme(raw: string | null | undefined): ListTheme {
  const t = (raw ?? '').trim().toLowerCase()
  if (t === 'cyberpunk' || t === 'terminal' || t === 'retro-cartoon') return t
  return 'default'
}

function hexColor(hex: string): number {
  return Number.parseInt(hex.replace(/^#/, ''), 16)
}

/** Enlace a películas/series con hint de lista (la app puede leer ?list= en el futuro). */
function buildListAppUrl(listId: string, tipo: 'pelicula' | 'serie'): string {
  if (!APP_BASE_URL) return ''
  const path = tipo === 'pelicula' ? '/peliculas' : '/series'
  return `${APP_BASE_URL}${path}?list=${encodeURIComponent(listId)}`
}

interface BuildEmbedContext {
  item: ItemRecord
  listName: string
  listId: string
  authorDisplay: string
  typeLabel: string
  listUrl: string
}

function buildThemedEmbed(theme: ListTheme, ctx: BuildEmbedContext): Record<string, unknown> {
  const { item, listName, listId, authorDisplay, typeLabel, listUrl } = ctx
  const tituloLine = item.titulo
  const titleEsPart = item.title_es?.trim() ? ` | ${item.title_es.trim()}` : ''
  const baseFields: { name: string; value: string; inline?: boolean }[] = [
    { name: 'Obra', value: tituloLine + (item.title_es?.trim() ? ` / ${item.title_es.trim()}` : ''), inline: false },
    { name: 'Tipo', value: typeLabel, inline: true },
    ...(item.genero ? [{ name: 'Género', value: item.genero, inline: true as const }] : []),
    { name: 'Añadido por', value: authorDisplay, inline: true },
    { name: 'Lista', value: listName, inline: true },
  ]
  if (listUrl) {
    baseFields.push({ name: 'Abrir app', value: `[Ir a la lista](${listUrl})`, inline: false })
  }

  switch (theme) {
    case 'cyberpunk': {
      const monoBlock = [
        '```',
        `USER     : ${authorDisplay}`,
        `TYPE     : ${typeLabel}`,
        `TITLE    : ${tituloLine}${titleEsPart}`,
        `LIST     : ${listName}`,
        `LIST_ID  : ${listId}`,
        listUrl ? `URL      : ${listUrl}` : '',
        '```',
      ]
        .filter(Boolean)
        .join('\n')

      return {
        title: 'Δ NEW_HOLO_DATA_UPLOADED',
        description: monoBlock,
        color: hexColor('#00f3ff'),
        fields: [],
        ...(item.poster_url ? { thumbnail: { url: item.poster_url } } : {}),
        footer: { text: 'MyList // holo_feed' },
        timestamp: item.created_at,
      }
    }
    case 'retro-cartoon': {
      return {
        title: '¡NUEVA EN CARTELERA! 🍿🎬',
        description: `**${tituloLine}** ha llegado a la cartelera.\n\n🍿 **${authorDisplay}** añadió una **${typeLabel.toLowerCase()}** a **${listName}**${item.title_es?.trim() ? `\n📼 También: *${item.title_es.trim()}*` : ''}${listUrl ? `\n\n👉 [Ver en la app](${listUrl})` : ''}`,
        color: hexColor('#ffcc00'),
        fields: baseFields,
        ...(item.poster_url ? { thumbnail: { url: item.poster_url } } : {}),
        footer: { text: 'MyList • Cine casero ♥' },
        timestamp: item.created_at,
      }
    }
    case 'terminal': {
      const termBlock = [
        '```',
        '[ + ] ENTRY_OK',
        `[ + ] TITLE    :: ${tituloLine}`,
        ...(item.title_es?.trim() ? [`[ + ] TITLE_ES :: ${item.title_es.trim()}`] : []),
        `[ + ] OPERATOR :: ${authorDisplay}`,
        `[ + ] CLASS    :: ${typeLabel}`,
        `[ + ] TARGET   :: ${listName}`,
        ...(listUrl ? [`[ + ] URI      :: ${listUrl}`] : []),
        '```',
      ].join('\n')

      return {
        title: '[LOG_SYSTEM] > NEW_ENTRY',
        description: termBlock,
        color: hexColor('#00ff00'),
        fields: [],
        ...(item.poster_url ? { thumbnail: { url: item.poster_url } } : {}),
        footer: { text: 'mylist.sys // log_stream' },
        timestamp: item.created_at,
      }
    }
    default: {
      const isMovie = item.tipo === 'pelicula'
      const emoji = isMovie ? '🎬' : '📺'
      const color = isMovie ? 0xec4899 : 0xa855f7
      const sub = item.title_es?.trim() ? `\n_${item.title_es.trim()}_` : ''
      return {
        title: `${emoji} ${tituloLine}`,
        description: `**${authorDisplay}** ha añadido una nueva ${typeLabel.toLowerCase()} a **${listName}**${sub}${listUrl ? `\n\n[Abrir en MyList](${listUrl})` : ''}`,
        color,
        fields: baseFields.filter((f) => f.name !== 'Obra'),
        ...(item.poster_url ? { thumbnail: { url: item.poster_url } } : {}),
        footer: { text: 'MyList • Nuestra Lista ♥' },
        timestamp: item.created_at,
      }
    }
  }
}

async function fetchListNotifyRow(
  supabase: SupabaseClient,
  listId: string
): Promise<{ row: ListNotifyRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from('lists')
    .select('discord_webhook_url, theme, name')
    .eq('id', listId)
    .maybeSingle()

  if (error) {
    console.error('Supabase fetch list notify row:', error.message)
    return { row: null, error: error.message }
  }

  return { row: data as ListNotifyRow | null, error: null }
}

/**
 * Lee webhook + theme en una sola consulta. Si no hay URL, no envía a Discord.
 */
Deno.serve(async (req: Request) => {
  try {
    const payload: WebhookPayload = await req.json()

    if (payload.type !== 'INSERT' || payload.table !== 'items') {
      return new Response('OK', { status: 200 })
    }

    const item = payload.record
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { row: listRow, error: listErr } = await fetchListNotifyRow(supabase, item.list_id)
    if (listErr) {
      return new Response('Internal error', { status: 500 })
    }

    const webhookUrl = typeof listRow?.discord_webhook_url === 'string' ? listRow.discord_webhook_url.trim() : ''
    if (!webhookUrl) {
      return new Response('OK', { status: 200 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('username')
      .eq('user_id', item.user_id)
      .maybeSingle()

    const authorDisplay =
      (typeof item.user_name === 'string' && item.user_name.trim()) ||
      profile?.username ||
      (typeof item.user_email === 'string' && item.user_email.trim()) ||
      'Alguien'

    const listName = listRow?.name ?? 'una lista'
    const listTheme = normalizeListTheme(listRow?.theme)
    const isMovie = item.tipo === 'pelicula'
    const typeLabel = isMovie ? 'Película' : 'Serie'
    const listUrl = buildListAppUrl(item.list_id, item.tipo)

    const embed = buildThemedEmbed(listTheme, {
      item,
      listName,
      listId: item.list_id,
      authorDisplay,
      typeLabel,
      listUrl,
    })

    const discordPayload = { embeds: [embed] }

    const discordRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(discordPayload),
    })

    if (!discordRes.ok) {
      const errorText = await discordRes.text()
      console.error('Discord error:', discordRes.status, errorText)
      return new Response('Discord error', { status: 502 })
    }

    return new Response('OK', { status: 200 })
  } catch (err) {
    console.error('Edge function error:', err)
    return new Response('Internal error', { status: 500 })
  }
})
