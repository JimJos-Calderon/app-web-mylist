import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/supabaseClient'
import { useAuth } from '@/features/auth'
import { queryKeys } from '@config/queryKeys'

export type ThemePreference = 'cyberpunk' | '2advanced' | 'terminal'

const DEFAULT_THEME: ThemePreference = 'cyberpunk'

const isThemePreference = (value: string | null | undefined): value is ThemePreference => {
  return value === 'cyberpunk' || value === '2advanced' || value === 'terminal'
}

const normalizeThemePreference = (value: string | null | undefined): ThemePreference => {
  return isThemePreference(value) ? value : DEFAULT_THEME
}

const applyThemeToDom = (theme: ThemePreference) => {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', theme)
}

interface UseThemeReturn {
  theme: ThemePreference
  loading: boolean
  error: string | null
  changeTheme: (newTheme: ThemePreference) => Promise<void>
  isChangingTheme: boolean
}

export const useTheme = (): UseThemeReturn => {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const queryKey = queryKeys.userProfile.themePreferenceByUser(user?.id || '')

  const {
    data: theme = DEFAULT_THEME,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user?.id) {
        return DEFAULT_THEME
      }

      const { data, error: fetchError } = await supabase
        .from('user_profiles')
        .select('theme_preference')
        .eq('user_id', user.id)
        .maybeSingle()

      if (fetchError) {
        throw fetchError
      }

      return normalizeThemePreference(data?.theme_preference)
    },
    enabled: !!user?.id,
  })

  useEffect(() => {
    applyThemeToDom(theme)
  }, [theme])

  const changeThemeMutation = useMutation({
    mutationFn: async (newTheme: ThemePreference) => {
      if (!user?.id) {
        throw new Error('Debes iniciar sesión para cambiar tema')
      }

      const normalizedTheme = normalizeThemePreference(newTheme)

      const { data, error: updateError } = await supabase
        .from('user_profiles')
        .update({
          theme_preference: normalizedTheme,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select('id')
        .maybeSingle()

      if (updateError) {
        throw updateError
      }

      if (!data) {
        throw new Error('No se encontró perfil de usuario para guardar el tema')
      }

      return normalizedTheme
    },
    onMutate: async (newTheme) => {
      const optimisticTheme = normalizeThemePreference(newTheme)
      await queryClient.cancelQueries({ queryKey })

      const previousTheme = queryClient.getQueryData<ThemePreference>(queryKey)

      queryClient.setQueryData(queryKey, optimisticTheme)
      applyThemeToDom(optimisticTheme)

      return { previousTheme }
    },
    onError: (_error, _newTheme, context) => {
      const rollbackTheme = context?.previousTheme ?? DEFAULT_THEME
      queryClient.setQueryData(queryKey, rollbackTheme)
      applyThemeToDom(rollbackTheme)
    },
    onSuccess: (savedTheme) => {
      queryClient.setQueryData(queryKey, savedTheme)
      applyThemeToDom(savedTheme)
    },
  })

  return {
    theme,
    loading,
    error: error?.message || null,
    changeTheme: async (newTheme) => {
      await changeThemeMutation.mutateAsync(newTheme)
    },
    isChangingTheme: changeThemeMutation.isPending,
  }
}
