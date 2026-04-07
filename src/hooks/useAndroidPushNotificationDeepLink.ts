import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'

/**
 * Navega dentro de la SPA cuando el usuario abre una notificación push en Android
 * y el payload incluye `data.url` (ruta relativa o URL absoluta del mismo origen).
 */
function pathFromNotificationData(raw: unknown): string | null {
  if (typeof raw !== 'string' || !raw.trim()) return null
  const t = raw.trim()
  try {
    if (t.startsWith('http://') || t.startsWith('https://')) {
      const u = new URL(t)
      return `${u.pathname}${u.search}${u.hash}`
    }
  } catch {
    return null
  }
  return t.startsWith('/') ? t : `/${t}`
}

export function useAndroidPushNotificationDeepLink(): void {
  const navigate = useNavigate()

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
      return
    }

    let removeListener: (() => Promise<void>) | undefined

    void PushNotifications.addListener('pushNotificationActionPerformed', (event) => {
      const data = event.notification?.data as Record<string, unknown> | undefined
      const urlRaw = data?.url ?? data?.['url']
      const path = pathFromNotificationData(urlRaw)
      if (path) {
        navigate(path)
      }
    }).then((h) => {
      removeListener = () => h.remove()
    })

    return () => {
      void removeListener?.()
    }
  }, [navigate])
}
