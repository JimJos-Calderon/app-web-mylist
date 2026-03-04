import { QueryClient } from '@tanstack/react-query'

/**
 * Configuración global del QueryClient
 * 
 * - staleTime: 5 minutos (datos se consideran frescos durante este tiempo)
 * - gcTime (antes cacheTime): 10 minutos (datos se mantienen en la cache incluso si se desmonta)
 * - retry: 1 intento de reintento automático para fallos
 * - refetchOnWindowFocus: true (re-valida datos al volver a la ventana)
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos (reemplaza a cacheTime en v5)
      retry: 1,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 1,
    },
  },
})
