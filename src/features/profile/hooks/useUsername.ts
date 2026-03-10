import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/supabaseClient'

/**
 * Hook para obtener el nombre de usuario
 * Usa useQuery para cachear el resultado
 */
export const useUsername = (userId: string) => {
  const { data: username = null, isLoading: loading } = useQuery({
    queryKey: ['username', userId],
    queryFn: async () => {
      if (!userId) {
        return null
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('username')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) {
        console.error('Error fetching username:', error)
        return null
      }

      return data?.username || null
    },
    enabled: !!userId,
  })

  return { username, loading }
}
