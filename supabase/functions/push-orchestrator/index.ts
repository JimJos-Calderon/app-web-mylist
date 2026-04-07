import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { importPKCS8, SignJWT } from 'npm:jose@5.2.4'
import webpush from 'npm:web-push@3.6.7'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

/** URL pública de la app (sin slash final). Ej: supabase secrets set PUBLIC_APP_URL=https://tu-dominio.com */
const APP_BASE_URL = (Deno.env.get('PUBLIC_APP_URL') ?? Deno.env.get('APP_BASE_URL') ?? '').replace(/\/$/, '')

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@mylist.local'

/** JSON completo de la cuenta de servicio de Firebase (Project settings → Service accounts → Generate new private key). Secreto: supabase secrets set FIREBASE_SERVICE_ACCOUNT_JSON='...' */
const FIREBASE_SERVICE_ACCOUNT_JSON = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON')?.trim()

interface FirebaseServiceAccount {
  project_id: string
  client_email: string
  private_key: string
}

let firebaseAccessCache: { token: string; expiresAtMs: number } | null = null

function parseFirebaseServiceAccount(): FirebaseServiceAccount | null {
  if (!FIREBASE_SERVICE_ACCOUNT_JSON) return null
  try {
    const o = JSON.parse(FIREBASE_SERVICE_ACCOUNT_JSON) as Record<string, unknown>
    const project_id = typeof o.project_id === 'string' ? o.project_id.trim() : ''
    const client_email = typeof o.client_email === 'string' ? o.client_email.trim() : ''
    const private_key = typeof o.private_key === 'string' ? o.private_key.trim() : ''
    if (!project_id || !client_email || !private_key) return null
    return { project_id, client_email, private_key }
  } catch {
    return null
  }
}

async function getFirebaseMessagingAccessToken(sa: FirebaseServiceAccount): Promise<string | null> {
  const now = Date.now()
  if (firebaseAccessCache && firebaseAccessCache.expiresAtMs > now + 60_000) {
    return firebaseAccessCache.token
  }

  let key: CryptoKey
  try {
    key = await importPKCS8(sa.private_key, 'RS256')
  } catch (e) {
    console.error('[push-orchestrator] FCM: importPKCS8 failed', e)
    return null
  }

  let jwt: string
  try {
    jwt = await new SignJWT({ scope: 'https://www.googleapis.com/auth/firebase.messaging' })
      .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
      .setIssuer(sa.client_email)
      .setSubject(sa.client_email)
      .setAudience('https://oauth2.googleapis.com/token')
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(key)
  } catch (e) {
    console.error('[push-orchestrator] FCM: SignJWT failed', e)
    return null
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  const tokenJson = (await tokenRes.json()) as { access_token?: string; expires_in?: number }
  if (!tokenRes.ok || !tokenJson.access_token) {
    console.error('[push-orchestrator] FCM: oauth token error', tokenRes.status, tokenJson)
    return null
  }

  const ttlMs = Math.min((tokenJson.expires_in ?? 3600) * 1000, 3_500_000)
  firebaseAccessCache = { token: tokenJson.access_token, expiresAtMs: now + ttlMs }
  return tokenJson.access_token
}

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

interface PushSubscriptionRow {
  id: string
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
  subscription: {
    endpoint?: string
    expirationTime?: number | null
    keys?: {
      p256dh?: string
      auth?: string
    }
  } | null
}

interface FcmSubscriptionRow {
  id: string
  user_id: string
  fcm_token: string
}

function normalizeListTheme(raw: string | null | undefined): ListTheme {
  const t = (raw ?? '').trim().toLowerCase()
  if (t === 'cyberpunk' || t === 'terminal' || t === 'retro-cartoon') return t
  return 'default'
}

function hexColor(hex: string): number {
  return Number.parseInt(hex.replace(/^#/, ''), 16)
}

function buildListAppUrl(listId: string, tipo: 'pelicula' | 'serie'): string {
  if (!APP_BASE_URL) return ''
  const path = tipo === 'pelicula' ? '/peliculas' : '/series'
  return `${APP_BASE_URL}${path}?list=${encodeURIComponent(listId)}`
}

/** Título corto para la notificación push, alineado con el tono del tema de la lista */
function pushTitleForTheme(theme: ListTheme): string {
  switch (theme) {
    case 'cyberpunk':
      return 'Δ NUEVOS DATOS'
    case 'retro-cartoon':
      return '¡NUEVA EN CARTELERA!'
    case 'terminal':
      return '[LOG] NUEVO REGISTRO'
    default:
      return 'Nueva actividad'
  }
}

function buildPushBody(authorDisplay: string, titulo: string, listName: string): string {
  return `${authorDisplay} ha añadido ${titulo} a la lista ${listName}`
}

const toWebPushSubscription = (row: PushSubscriptionRow): webpush.PushSubscription => {
  if (row.subscription?.endpoint && row.subscription?.keys?.p256dh && row.subscription?.keys?.auth) {
    return {
      endpoint: row.subscription.endpoint,
      expirationTime: row.subscription.expirationTime ?? null,
      keys: {
        p256dh: row.subscription.keys.p256dh,
        auth: row.subscription.keys.auth,
      },
    }
  }
  return {
    endpoint: row.endpoint,
    expirationTime: null,
    keys: {
      p256dh: row.p256dh,
      auth: row.auth,
    },
  }
}

let vapidConfigured = false
function ensureWebPushVapid(): boolean {
  if (vapidConfigured) return true
  if (!VAPID_PUBLIC_KEY?.trim() || !VAPID_PRIVATE_KEY?.trim()) {
    return false
  }
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY.trim(), VAPID_PRIVATE_KEY.trim())
  vapidConfigured = true
  return true
}

type PushDispatchOutcome = { ok: boolean; sent: number; failed: number; skipped?: string }

/**
 * Push web (VAPID) a colaboradores de la lista excepto el autor.
 */
async function dispatchWebPush(args: {
  supabase: SupabaseClient
  item: ItemRecord
  listTheme: ListTheme
  listName: string
  authorDisplay: string
  listUrl: string
}): Promise<PushDispatchOutcome> {
  const { supabase, item, listTheme, listName, authorDisplay, listUrl } = args

  if (!ensureWebPushVapid()) {
    console.warn('[push-orchestrator] Web push omitido: faltan VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY')
    return { ok: true, sent: 0, failed: 0, skipped: 'vapid_not_configured' }
  }

  const { data: members, error: membersErr } = await supabase
    .from('list_members')
    .select('user_id')
    .eq('list_id', item.list_id)
    .neq('user_id', item.user_id)

  if (membersErr) {
    console.error('[push-orchestrator] list_members:', membersErr.message)
    return { ok: false, sent: 0, failed: 0, skipped: membersErr.message }
  }

  const memberIds = (members ?? [])
    .map((m: { user_id: string }) => m.user_id)
    .filter((id: string) => Boolean(id))

  if (memberIds.length === 0) {
    return { ok: true, sent: 0, failed: 0, skipped: 'no_other_members' }
  }

  const { data: subscriptions, error: subsErr } = await supabase
    .from('push_subscriptions')
    .select('id, user_id, endpoint, p256dh, auth, subscription')
    .in('user_id', memberIds)
    .eq('is_active', true)
    .eq('platform', 'web')

  if (subsErr) {
    console.error('[push-orchestrator] push_subscriptions:', subsErr.message)
    return { ok: false, sent: 0, failed: 0, skipped: subsErr.message }
  }

  if (!subscriptions?.length) {
    return { ok: true, sent: 0, failed: 0, skipped: 'no_active_subscriptions' }
  }

  const title = pushTitleForTheme(listTheme)
  const body = buildPushBody(authorDisplay, item.titulo, listName)
  const relativeUrl = listUrl
    ? (() => {
        try {
          return new URL(listUrl).pathname + new URL(listUrl).search
        } catch {
          return '/'
        }
      })()
    : '/'

  const payload = JSON.stringify({
    title,
    body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: `mylist-item-${item.id}`,
    data: {
      url: relativeUrl || '/',
      list_id: item.list_id,
      item_id: item.id,
    },
  })

  let sent = 0
  let failed = 0

  for (const row of subscriptions as PushSubscriptionRow[]) {
    try {
      await webpush.sendNotification(toWebPushSubscription(row), payload)
      sent += 1
    } catch (error: unknown) {
      failed += 1
      const statusCode =
        typeof error === 'object' && error !== null && 'statusCode' in error
          ? Number((error as { statusCode?: number }).statusCode)
          : undefined
      if (statusCode === 404 || statusCode === 410) {
        await supabase
          .from('push_subscriptions')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('id', row.id)
      }
      console.error('[push-orchestrator] push send failed', { rowId: row.id, statusCode, error })
    }
  }

  return { ok: true, sent, failed }
}

/**
 * FCM HTTP v1 a dispositivos Android (platform = android) en la misma lista, excepto el autor.
 */
async function dispatchAndroidFcmPush(args: {
  supabase: SupabaseClient
  item: ItemRecord
  listTheme: ListTheme
  listName: string
  authorDisplay: string
  listUrl: string
}): Promise<PushDispatchOutcome> {
  const { supabase, item, listTheme, listName, authorDisplay, listUrl } = args

  const sa = parseFirebaseServiceAccount()
  if (!sa) {
    console.warn('[push-orchestrator] FCM omitido: falta FIREBASE_SERVICE_ACCOUNT_JSON')
    return { ok: true, sent: 0, failed: 0, skipped: 'firebase_not_configured' }
  }

  const accessToken = await getFirebaseMessagingAccessToken(sa)
  if (!accessToken) {
    return { ok: false, sent: 0, failed: 0, skipped: 'firebase_oauth_failed' }
  }

  const { data: members, error: membersErr } = await supabase
    .from('list_members')
    .select('user_id')
    .eq('list_id', item.list_id)
    .neq('user_id', item.user_id)

  if (membersErr) {
    console.error('[push-orchestrator] FCM list_members:', membersErr.message)
    return { ok: false, sent: 0, failed: 0, skipped: membersErr.message }
  }

  const memberIds = (members ?? [])
    .map((m: { user_id: string }) => m.user_id)
    .filter((id: string) => Boolean(id))

  if (memberIds.length === 0) {
    return { ok: true, sent: 0, failed: 0, skipped: 'no_other_members' }
  }

  const { data: subscriptions, error: subsErr } = await supabase
    .from('push_subscriptions')
    .select('id, user_id, fcm_token')
    .in('user_id', memberIds)
    .eq('is_active', true)
    .eq('platform', 'android')

  if (subsErr) {
    console.error('[push-orchestrator] FCM push_subscriptions:', subsErr.message)
    return { ok: false, sent: 0, failed: 0, skipped: subsErr.message }
  }

  if (!subscriptions?.length) {
    return { ok: true, sent: 0, failed: 0, skipped: 'no_active_fcm_tokens' }
  }

  const seenFcmTokens = new Set<string>()
  const uniqueFcmRows = (subscriptions as FcmSubscriptionRow[]).filter((row) => {
    const t = row.fcm_token?.trim()
    if (!t) return false
    if (seenFcmTokens.has(t)) return false
    seenFcmTokens.add(t)
    return true
  })

  const title = pushTitleForTheme(listTheme)
  const body = buildPushBody(authorDisplay, item.titulo, listName)
  const relativeUrl = listUrl
    ? (() => {
        try {
          return new URL(listUrl).pathname + new URL(listUrl).search
        } catch {
          return '/'
        }
      })()
    : '/'

  // FCM HTTP v1 exige que `data` sea un mapa de string → string (nunca números).
  const dataStrings: Record<string, string> = {
    url: String(relativeUrl || '/'),
    list_id: String(item.list_id ?? ''),
    item_id: String(item.id ?? ''),
  }

  const fcmUrl = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`
  let sent = 0
  let failed = 0

  for (const row of uniqueFcmRows) {
    const token = row.fcm_token?.trim()
    if (!token) continue

    const notification: Record<string, string> = { title, body }
    if (item.poster_url?.trim()) {
      notification.image = item.poster_url.trim()
    }

    const fcmPayload = {
      message: {
        token,
        notification,
        data: dataStrings,
        android: { priority: 'HIGH' as const },
      },
    }

    try {
      console.log('DEBUG PAYLOAD FCM:', JSON.stringify(fcmPayload, null, 2))
      const res = await fetch(fcmUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fcmPayload),
      })

      if (!res.ok) {
        const errText = await res.text()
        let isUnregisteredGhost = res.status === 404 || res.status === 410
        try {
          const j = JSON.parse(errText) as { error?: { status?: string; message?: string } }
          const st = (j.error?.status ?? '').toUpperCase()
          const msg = (j.error?.message ?? '').toLowerCase()
          if (
            st === 'NOT_FOUND' ||
            st === 'UNREGISTERED' ||
            msg.includes('not found') ||
            msg.includes('unregistered') ||
            msg.includes('requested entity was not found')
          ) {
            isUnregisteredGhost = true
          }
        } catch {
          /* usar solo status HTTP */
        }

        if (isUnregisteredGhost) {
          await supabase
            .from('push_subscriptions')
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq('id', row.id)
          console.log(`[Mantenimiento] Desactivando token antiguo (UNREGISTERED): ${row.id}`)
          continue
        }

        failed += 1
        console.error('[push-orchestrator] FCM send failed', {
          rowId: row.id,
          status: res.status,
          errText: errText.slice(0, 400),
        })
        continue
      }
      sent += 1
    } catch (e) {
      failed += 1
      console.error('[push-orchestrator] FCM fetch error', row.id, e)
    }
  }

  return { ok: true, sent, failed }
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

async function sendDiscordNotification(webhookUrl: string, embed: Record<string, unknown>): Promise<{ ok: boolean; status?: number; detail?: string }> {
  try {
    const discordRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    })
    if (!discordRes.ok) {
      const errorText = await discordRes.text()
      console.error('[push-orchestrator] Discord error:', discordRes.status, errorText)
      return { ok: false, status: discordRes.status, detail: errorText.slice(0, 500) }
    }
    return { ok: true }
  } catch (err) {
    console.error('[push-orchestrator] Discord fetch failed:', err)
    return { ok: false, detail: err instanceof Error ? err.message : String(err) }
  }
}

/**
 * Orquestador: Discord (si hay webhook) + push web (VAPID) + FCM Android (cuenta de servicio Firebase).
 * Los canales no se bloquean entre sí; errores se registran y la función responde 200 si el payload era válido.
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

    const listName = (listRow?.name ?? 'una lista').trim() || 'una lista'
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

    const webhookUrl = typeof listRow?.discord_webhook_url === 'string' ? listRow.discord_webhook_url.trim() : ''

    const [discordOutcome, webPushOutcome, fcmOutcome] = await Promise.all([
      webhookUrl
        ? sendDiscordNotification(webhookUrl, embed)
        : Promise.resolve({ ok: true, skipped: true as const }),
      dispatchWebPush({
        supabase,
        item,
        listTheme,
        listName,
        authorDisplay,
        listUrl,
      }),
      dispatchAndroidFcmPush({
        supabase,
        item,
        listTheme,
        listName,
        authorDisplay,
        listUrl,
      }),
    ])

    if (webhookUrl && !discordOutcome.ok) {
      console.warn('[push-orchestrator] Discord falló; el envío push se ejecutó en paralelo.', discordOutcome)
    }
    if (!webPushOutcome.ok) {
      console.warn('[push-orchestrator] Web push: error de consulta o envío parcial.', webPushOutcome)
    }
    if (!fcmOutcome.ok) {
      console.warn('[push-orchestrator] FCM: error de consulta o envío parcial.', fcmOutcome)
    }

    const discordJson =
      webhookUrl && !('skipped' in discordOutcome && discordOutcome.skipped)
        ? {
            ok: discordOutcome.ok,
            ...(discordOutcome.status != null ? { status: discordOutcome.status } : {}),
            ...(discordOutcome.detail ? { detail: discordOutcome.detail } : {}),
          }
        : { skipped: true as const }

    return new Response(
      JSON.stringify({
        discord: discordJson,
        push: { web: webPushOutcome, fcm: fcmOutcome },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (err) {
    console.error('Edge function error:', err)
    return new Response('Internal error', { status: 500 })
  }
})
