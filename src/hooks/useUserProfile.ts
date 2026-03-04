import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/supabaseClient'
import { queryKeys } from '@config/queryKeys'
import { useAuth } from './useAuth'

export interface UserProfile {
  id: string
  user_id: string
  username: string
  avatar_url?: string | null
  bio?: string | null
  created_at: string
  updated_at: string
}

interface UseUserProfileReturn {
  profile: UserProfile | null
  loading: boolean
  error: string | null
  saveProfile: (username: string) => Promise<UserProfile>
  updateAvatar: (avatarUrl: string) => Promise<UserProfile>
  uploadAvatar: (file: File) => Promise<string>
  updateBio: (bio: string) => Promise<UserProfile>
  isSavingProfile: boolean
  isUpdatingAvatar: boolean
  isUploadingAvatar: boolean
  isUpdatingBio: boolean
}

/**
 * Hook para gestionar el perfil del usuario
 * Lectura con useQuery + Mutaciones con useMutation
 */
export const useUserProfile = (): UseUserProfileReturn => {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Query para obtener el perfil del usuario
  const {
    data: profile = null,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: queryKeys.userProfile.byUser(user?.id || ''),
    queryFn: async () => {
      if (!user?.id) {
        return null
      }

      const { data, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (fetchError) throw fetchError

      return (data as UserProfile) || null
    },
    enabled: !!user?.id,
  })

  // ─── MUTACIÓN: Guardar Perfil ─────────────────────────────────
  const saveProfileMutation = useMutation({
    mutationFn: async (username: string) => {
      if (!user?.id) {
        throw new Error('Debes iniciar sesión')
      }

      if (profile) {
        // Update existing
        const { data, error: updateError } = await supabase
          .from('user_profiles')
          .update({
            username,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)
          .select()
          .maybeSingle()

        if (updateError) throw updateError
        return data as UserProfile
      } else {
        // Create new
        const { data, error: insertError } = await supabase
          .from('user_profiles')
          .insert([
            {
              user_id: user.id,
              username,
              avatar_url: null,
              bio: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ])
          .select()
          .maybeSingle()

        if (insertError) throw insertError
        return data as UserProfile
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.userProfile.byUser(user?.id || ''),
      })
    },
  })

  // ─── MUTACIÓN: Actualizar Avatar ──────────────────────────────
  const updateAvatarMutation = useMutation({
    mutationFn: async (avatarUrl: string) => {
      if (!user?.id) {
        throw new Error('Debes iniciar sesión')
      }

      if (profile) {
        // Update existing profile
        const { data, error: updateError } = await supabase
          .from('user_profiles')
          .update({
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)
          .select()
          .maybeSingle()

        if (updateError) throw updateError
        return data as UserProfile
      } else {
        // Create new profile with avatar
        const { data, error: insertError } = await supabase
          .from('user_profiles')
          .insert([
            {
              user_id: user.id,
              username: user.email?.split('@')[0] || 'Usuario',
              avatar_url: avatarUrl,
              bio: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ])
          .select()
          .maybeSingle()

        if (insertError) throw insertError
        return data as UserProfile
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.userProfile.byUser(user?.id || ''),
      })
    },
  })

  // ─── MUTACIÓN: Subir Avatar ───────────────────────────────────
  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!user?.id) {
        throw new Error('Debes iniciar sesión')
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('El archivo debe ser una imagen')
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('La imagen no puede superar 2MB')
      }

      // Create unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const publicUrl = urlData.publicUrl

      // Update profile with new avatar URL
      await updateAvatarMutation.mutateAsync(publicUrl)

      return publicUrl
    },
  })

  // ─── MUTACIÓN: Actualizar Bio ─────────────────────────────────
  const updateBioMutation = useMutation({
    mutationFn: async (bio: string) => {
      if (!user?.id) {
        throw new Error('Debes iniciar sesión')
      }

      if (profile) {
        // Update existing profile
        const { data, error: updateError } = await supabase
          .from('user_profiles')
          .update({
            bio: bio || null,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)
          .select()
          .maybeSingle()

        if (updateError) throw updateError
        return data as UserProfile
      } else {
        // Create new profile with bio
        const { data, error: insertError } = await supabase
          .from('user_profiles')
          .insert([
            {
              user_id: user.id,
              username: user.email?.split('@')[0] || 'Usuario',
              avatar_url: null,
              bio: bio || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ])
          .select()
          .maybeSingle()

        if (insertError) throw insertError
        return data as UserProfile
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.userProfile.byUser(user?.id || ''),
      })
    },
  })

  return {
    profile,
    loading,
    error: error?.message || null,
    saveProfile: (username) => saveProfileMutation.mutateAsync(username),
    updateAvatar: (url) => updateAvatarMutation.mutateAsync(url),
    uploadAvatar: (file) => uploadAvatarMutation.mutateAsync(file),
    updateBio: (bio) => updateBioMutation.mutateAsync(bio),
    isSavingProfile: saveProfileMutation.isPending,
    isUpdatingAvatar: updateAvatarMutation.isPending,
    isUploadingAvatar: uploadAvatarMutation.isPending,
    isUpdatingBio: updateBioMutation.isPending,
  }
}
