import { useSyncExternalStore, useCallback } from 'react'

/**
 * Hook para detectar media queries de CSS en JS.
 * Útil para renderizado condicional basado en el viewport (ej. Modal vs Drawer).
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (callback: () => void) => {
      const matchMedia = window.matchMedia(query)
      matchMedia.addEventListener('change', callback)
      return () => matchMedia.removeEventListener('change', callback)
    },
    [query]
  )

  const getSnapshot = () => window.matchMedia(query).matches
  const getServerSnapshot = () => false

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
