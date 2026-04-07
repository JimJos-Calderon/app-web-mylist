import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'
import { PushNotifications, type PermissionStatus, type PluginListenerHandle } from '@capacitor/push-notifications'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/supabaseClient'

export type PushPermissionState = NotificationPermission | 'unsupported'

/** Éxito en web (PushSubscription) o en Android nativo (marcador). */
export type PushSubscribeResult = PushSubscription | { mode: 'native' }

export interface UsePushNotificationsReturn {
  supported: boolean
  permission: PushPermissionState
  loading: boolean
  isSubscribed: boolean
  error: string | null
  subscribe: () => Promise<PushSubscribeResult | null>
  unsubscribe: () => Promise<boolean>
  refresh: () => Promise<void>
  subscribeCurrentUser: (userId: string) => Promise<PushSubscribeResult | null>
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

const readWebPermission = (): PushPermissionState => {
  if (typeof window === 'undefined') return 'unsupported'
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission
}

const mapNativePermission = (status: PermissionStatus): PushPermissionState => {
  if (status.receive === 'granted') return 'granted'
  if (status.receive === 'denied') return 'denied'
  return 'default'
}

const ensureServiceWorkerRegistration = async (): Promise<ServiceWorkerRegistration> => {
  const existing = await navigator.serviceWorker.getRegistration()
  if (existing) return existing
  return navigator.serviceWorker.register('/sw.js')
}

function isAndroidNative(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'
}

const FCM_TOKEN_PREF_KEY = 'mylist_push_fcm_token'

function errorMessageFromUnknown(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'object' && err !== null) {
    const o = err as Record<string, unknown>
    const msg = o.message
    const details = o.details ?? o.hint
    if (typeof msg === 'string' && msg.length > 0) {
      return typeof details === 'string' && details.length > 0 ? `${msg} — ${details}` : msg
    }
  }
  return String(err)
}

/**
 * Importante: hay que await de addListener ANTES de register(); si no, el token puede
 * emitirse antes de que los listeners existan y la promesa nunca resuelve.
 */
async function waitForAndroidFcmToken(): Promise<string> {
  let regHandle: PluginListenerHandle | undefined
  let errHandle: PluginListenerHandle | undefined

  const removeListeners = async () => {
    await regHandle?.remove().catch(() => undefined)
    await errHandle?.remove().catch(() => undefined)
    regHandle = undefined
    errHandle = undefined
  }

  const tokenPromise = new Promise<string>((resolve, reject) => {
    void (async () => {
      try {
        regHandle = await PushNotifications.addListener('registration', async (token) => {
          await removeListeners()
          const v = token.value?.trim()
          if (!v) {
            reject(new Error('FCM devolvió un token vacío'))
            return
          }
          resolve(v)
        })

        errHandle = await PushNotifications.addListener('registrationError', async (err) => {
          await removeListeners()
          const raw = err.error?.trim()
          const msg =
            raw ||
            'FCM no pudo registrar el dispositivo. Comprueba google-services.json, que Cloud Messaging esté activo en Firebase y que Google Play Services esté actualizado.'
          console.error('[usePushNotifications] registrationError:', err)
          if (typeof window !== 'undefined' && typeof window.alert === 'function') {
            window.alert(`[Push] registrationError\n\n${msg}`)
          }
          reject(new Error(msg))
        })

        console.log('--- PASO 2: Llamando a register() ---')
        await PushNotifications.register()
      } catch (e) {
        await removeListeners()
        reject(e instanceof Error ? e : new Error(String(e)))
      }
    })()
  })

  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => {
      void removeListeners()
      reject(
        new Error(
          'Tiempo de espera al obtener el token FCM. Revisa conexión, Google Play Services y que la app tenga el google-services.json correcto.'
        )
      )
    }, 25_000)
  })

  try {
    return await Promise.race([tokenPromise, timeout])
  } catch (e) {
    await removeListeners()
    throw e
  }
}

export const usePushNotifications = (): UsePushNotificationsReturn => {
  const [permission, setPermission] = useState<PushPermissionState>(() =>
    isAndroidNative() ? 'default' : readWebPermission()
  )
  const [loading, setLoading] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastFcmTokenRef = useRef<string | null>(null)

  const supported = useMemo(() => {
    if (typeof window === 'undefined') return false
    if (isAndroidNative()) return true
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
  }, [])

  const refresh = useCallback(async () => {
    if (isAndroidNative()) {
      try {
        const perm = await PushNotifications.checkPermissions()
        setPermission(mapNativePermission(perm))
      } catch {
        setPermission('unsupported')
      }
      const { value: prefToken } = await Preferences.get({ key: FCM_TOKEN_PREF_KEY })
      lastFcmTokenRef.current = prefToken ?? null

      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user || !prefToken) {
        setIsSubscribed(false)
        return
      }

      const { data: row } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('user_id', auth.user.id)
        .eq('fcm_token', prefToken)
        .eq('platform', 'android')
        .eq('is_active', true)
        .maybeSingle()

      setIsSubscribed(!!row)
      return
    }

    setPermission(readWebPermission())
    if (!supported) {
      setIsSubscribed(false)
      return
    }
    try {
      const registration = await navigator.serviceWorker.ready
      const sub = await registration.pushManager.getSubscription()
      setIsSubscribed(!!sub)
    } catch {
      setIsSubscribed(false)
    }
  }, [supported])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (isAndroidNative()) return
    const onFocus = () => setPermission(readWebPermission())
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  const subscribeNativeAndroid = useCallback(async (userId: string): Promise<PushSubscribeResult | null> => {
    setError(null)
    setLoading(true)
    try {
      console.log('--- PASO 1: Solicitando permiso nativo ---')
      const permResult = await PushNotifications.requestPermissions()
      const mapped = mapNativePermission(permResult)
      setPermission(mapped)
      console.log('[usePushNotifications] requestPermissions resultado:', permResult, '→', mapped)

      const token = await waitForAndroidFcmToken()
      if (!token?.trim()) {
        throw new Error('Token FCM vacío')
      }

      const { error: upsertError } = await supabase.from('push_subscriptions').upsert(
        {
          user_id: userId,
          platform: 'android',
          fcm_token: token.trim(),
          endpoint: null,
          p256dh: null,
          auth: null,
          subscription: null,
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Capacitor-Android',
          is_active: true,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: 'fcm_token' }
      )

      if (upsertError) {
        throw upsertError
      }

      const trimmed = token.trim()
      lastFcmTokenRef.current = trimmed
      await Preferences.set({ key: FCM_TOKEN_PREF_KEY, value: trimmed })
      setIsSubscribed(true)
      return { mode: 'native' as const }
    } catch (err) {
      console.error('[usePushNotifications] Android:', err)
      const message = errorMessageFromUnknown(err) || 'Error al registrar notificaciones en Android'
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const subscribeWithUserId = useCallback(
    async (userId: string): Promise<PushSubscribeResult | null> => {
      setError(null)

      if (!userId) {
        setError('Usuario no autenticado')
        return null
      }

      const { data: authData, error: authErr } = await supabase.auth.getUser()
      if (authErr || !authData.user) {
        setError('Sesión no válida')
        return null
      }
      if (authData.user.id !== userId) {
        setError('El usuario no coincide con la sesión actual')
        return null
      }

      if (isAndroidNative()) {
        return subscribeNativeAndroid(userId)
      }

      if (!supported) {
        setPermission('unsupported')
        setError('Este navegador no soporta notificaciones push')
        return null
      }

      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY?.trim()
      if (!vapidPublicKey) {
        setError('Falta VITE_VAPID_PUBLIC_KEY en el archivo .env')
        return null
      }

      setLoading(true)

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
            const stale = await registration.pushManager.getSubscription()
            if (stale) {
              await stale.unsubscribe().catch(() => undefined)
            }
            subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey,
            })
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
          throw new Error('Suscripción inválida: faltan endpoint o claves')
        }

        const { error: upsertError } = await supabase.from('push_subscriptions').upsert(
          {
            user_id: userId,
            platform: 'web',
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

        setIsSubscribed(true)
        return subscription
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al suscribir notificaciones push'

        if (message.includes('Registration failed - push service error')) {
          setError(
            'No se pudo crear la suscripción push. Revisa permisos del sitio, borra datos del sitio si hace falta y vuelve a intentar.'
          )
          return null
        }

        setError(message)
        return null
      } finally {
        setLoading(false)
      }
    },
    [supported, subscribeNativeAndroid]
  )

  const subscribe = useCallback(async () => {
    const { data, error: uErr } = await supabase.auth.getUser()
    if (uErr || !data.user) {
      setError('Debes iniciar sesión para activar notificaciones')
      return null
    }
    return subscribeWithUserId(data.user.id)
  }, [subscribeWithUserId])

  const subscribeCurrentUser = useCallback(
    async (userId: string) => subscribeWithUserId(userId),
    [subscribeWithUserId]
  )

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setError(null)
    setLoading(true)
    try {
      if (isAndroidNative()) {
        const { value: storedToken } = await Preferences.get({ key: FCM_TOKEN_PREF_KEY })
        const token = lastFcmTokenRef.current ?? storedToken ?? null
        await PushNotifications.unregister()
        if (token) {
          const { error: delErr } = await supabase.from('push_subscriptions').delete().eq('fcm_token', token)
          if (delErr) {
            const message = delErr.message || 'No se pudo eliminar el token en el servidor'
            setError(message)
            throw new Error(message)
          }
        }
        lastFcmTokenRef.current = null
        await Preferences.remove({ key: FCM_TOKEN_PREF_KEY })
        setIsSubscribed(false)
        return Boolean(token)
      }

      if (!supported) return false

      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      if (!subscription) {
        setIsSubscribed(false)
        return false
      }
      const endpoint = subscription.endpoint
      await subscription.unsubscribe()
      const { error: delErr } = await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
      if (delErr) {
        const message = delErr.message || 'No se pudo eliminar la suscripción en el servidor'
        setError(message)
        throw new Error(message)
      }
      setIsSubscribed(false)
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cancelar la suscripción push'
      setError(message)
      throw err instanceof Error ? err : new Error(message)
    } finally {
      setLoading(false)
    }
  }, [supported])

  return {
    supported,
    permission,
    loading,
    isSubscribed,
    error,
    subscribe,
    unsubscribe,
    refresh,
    subscribeCurrentUser,
  }
}
