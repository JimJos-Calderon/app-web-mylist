import { useCallback, useMemo, useState } from 'react'
import { supabase } from '@/supabaseClient'

type PushPermissionState = NotificationPermission | 'unsupported'

interface UsePushNotificationsReturn {
  isSupported: boolean
  permission: PushPermissionState
  isSubscribing: boolean
  error: string | null
  subscribeCurrentUser: (userId: string) => Promise<PushSubscription | null>
}

const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}

const getPermissionState = (): PushPermissionState => {
  if (typeof window === 'undefined') return 'unsupported'
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission
}

const ensureServiceWorkerRegistration = async (): Promise<ServiceWorkerRegistration> => {
  const existing = await navigator.serviceWorker.getRegistration()
  if (existing) return existing

  return navigator.serviceWorker.register('/sw.js')
}

export const usePushNotifications = (): UsePushNotificationsReturn => {
  const [permission, setPermission] = useState<PushPermissionState>(getPermissionState)
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isSupported = useMemo(() => {
    if (typeof window === 'undefined') return false
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
  }, [])

  const subscribeCurrentUser = useCallback(async (userId: string) => {
    setError(null)

    if (!userId) {
      setError('Usuario no autenticado')
      return null
    }

    if (!isSupported) {
      setPermission('unsupported')
      setError('Este navegador no soporta Push Notifications')
      return null
    }

    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
    if (!vapidPublicKey) {
      setError('Falta VITE_VAPID_PUBLIC_KEY en el archivo .env')
      return null
    }

    setIsSubscribing(true)

    try {
      const permissionResult = await Notification.requestPermission()
      setPermission(permissionResult)

      if (permissionResult !== 'granted') {
        setError('Permiso de notificaciones denegado por el usuario')
        return null
      }

      await ensureServiceWorkerRegistration()
      const registration = await navigator.serviceWorker.ready
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey) as unknown as BufferSource

      let subscription = await registration.pushManager.getSubscription()

      if (!subscription) {
        try {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey,
          })
        } catch (firstError) {
          // Some browsers keep stale push state. Clear and retry once.
          const staleSubscription = await registration.pushManager.getSubscription()
          if (staleSubscription) {
            await staleSubscription.unsubscribe().catch(() => undefined)
          }

          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey,
          })

          // Keep first error for debugging when retry also fails.
          if (!subscription) {
            throw firstError
          }
        }
      }

      const subscriptionJson = subscription.toJSON()
      const endpoint = subscription.endpoint
      const p256dh = subscriptionJson.keys?.p256dh
      const auth = subscriptionJson.keys?.auth

      if (!endpoint || !p256dh || !auth) {
        throw new Error('Suscripción inválida: faltan endpoint/keys')
      }

      const { error: upsertError } = await supabase
        .from('push_subscriptions')
        .upsert(
          {
            user_id: userId,
            endpoint,
            p256dh,
            auth,
            subscription: subscriptionJson,
            user_agent: navigator.userAgent,
            is_active: true,
            last_seen_at: new Date().toISOString(),
          },
          { onConflict: 'endpoint' }
        )

      if (upsertError) {
        throw upsertError
      }

      return subscription
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al suscribir notificaciones push'

      if (message.includes('Registration failed - push service error')) {
        setError('No se pudo crear la suscripcion push. Verifica permisos del sitio, limpia datos del sitio y vuelve a intentar.')
        return null
      }

      setError(message)
      return null
    } finally {
      setIsSubscribing(false)
    }
  }, [isSupported])

  return {
    isSupported,
    permission,
    isSubscribing,
    error,
    subscribeCurrentUser,
  }
}
