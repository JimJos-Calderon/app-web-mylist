// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'
import { corsHeaders } from '../_shared/cors.ts'

interface SendPushRequest {
  user_id: string
  message: string
  title?: string
  url?: string
  icon?: string
  tag?: string
  data?: Record<string, unknown>
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

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@mylist.local'
const PUSH_WEBHOOK_SECRET = Deno.env.get('PUSH_WEBHOOK_SECRET')

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  throw new Error('Missing required environment variables for send-push function')
}

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

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

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    if (PUSH_WEBHOOK_SECRET) {
      const provided = req.headers.get('x-push-secret')
      if (provided !== PUSH_WEBHOOK_SECRET) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    const body = (await req.json()) as SendPushRequest

    if (!body?.user_id || !body?.message) {
      return new Response(JSON.stringify({ error: 'user_id and message are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: subscriptions, error: queryError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('id, user_id, endpoint, p256dh, auth, subscription')
      .eq('user_id', body.user_id)
      .eq('is_active', true)
      .eq('platform', 'web')

    if (queryError) {
      throw queryError
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ sent: 0, failed: 0, detail: 'No active subscriptions' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const payload = JSON.stringify({
      title: body.title ?? 'Actividad en tu lista',
      body: body.message,
      icon: body.icon ?? '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: body.tag ?? 'mylist-activity',
      data: {
        url: body.url ?? '/peliculas',
        ...(body.data ?? {}),
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

        const statusCode = typeof error === 'object' && error !== null && 'statusCode' in error
          ? Number((error as { statusCode?: number }).statusCode)
          : undefined

        // If subscription is no longer valid, mark it inactive.
        if (statusCode === 404 || statusCode === 410) {
          await supabaseAdmin
            .from('push_subscriptions')
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq('id', row.id)
        }

        console.error('Push send failed', { rowId: row.id, statusCode, error })
      }
    }

    return new Response(JSON.stringify({ sent, failed, total: subscriptions.length }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('send-push function error', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
