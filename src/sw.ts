/// <reference lib="webworker" />

import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { StaleWhileRevalidate } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'

export {}

type PrecacheManifestEntry = {
  url: string
  revision?: string | null
  integrity?: string
}

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: PrecacheManifestEntry[]
}

type PushPayload = {
  title?: string
  body?: string
  message?: string
  icon?: string
  badge?: string
  tag?: string
  url?: string
  data?: {
    url?: string
    [key: string]: unknown
  }
}

const DEFAULT_TITLE = 'MyList'
const DEFAULT_BODY = 'Tienes una nueva notificacion'
/** Ruta al abrir la notificación si el payload no trae `url` / `data.url` */
const DEFAULT_URL = '/'
const DEFAULT_ICON = '/pwa-192x192.png'
const DEFAULT_IMAGE = '/logo-navbar.webp'
const DEFAULT_TAG = 'mylist-activity'

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

registerRoute(
  ({ request }) => request.destination === 'image',
  new StaleWhileRevalidate({
    cacheName: 'image-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 150,
        maxAgeSeconds: 60 * 60 * 24 * 30,
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
)

const parsePushPayload = (event: PushEvent): PushPayload => {
  if (!event.data) {
    return {}
  }

  try {
    return event.data.json() as PushPayload
  } catch {
    try {
      return { body: event.data.text() }
    } catch {
      return {}
    }
  }
}

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  const payload = parsePushPayload(event)
  const targetUrl = payload.data?.url || payload.url || DEFAULT_URL

  const title = payload.title || DEFAULT_TITLE
  const body = payload.body || payload.message || DEFAULT_BODY

  const notificationOptions: NotificationOptions = {
    body,
    icon: payload.icon || DEFAULT_ICON,
    image: DEFAULT_IMAGE,
    badge: payload.badge || DEFAULT_ICON,
    tag: payload.tag || DEFAULT_TAG,
    data: {
      url: targetUrl,
      ...(payload.data || {}),
    },
  }

  event.waitUntil(self.registration.showNotification(title, notificationOptions))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const data = (event.notification.data || {}) as { url?: string }
  const targetUrl = new URL(data.url || DEFAULT_URL, self.location.origin).href

  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      })

      for (const client of clientList) {
        const clientOrigin = new URL(client.url).origin

        if (clientOrigin !== self.location.origin) {
          continue
        }

        await client.focus()

        const windowClient = client as WindowClient
        if (typeof windowClient.navigate === 'function' && windowClient.url !== targetUrl) {
          await windowClient.navigate(targetUrl)
        }

        return
      }

      await self.clients.openWindow(targetUrl)
    })()
  )
})
