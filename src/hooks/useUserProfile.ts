import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/supabaseClient'
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

export const useUserProfile = () => {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        if (error) throw error

        setProfile(data)
        setError(null)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al cargar perfil'
        setError(message)
        console.error('Fetch profile error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user?.id])

  // Create or update profile
  const saveProfile = useCallback(
    async (username: string) => {
      if (!user?.id) {
        setError('Debes iniciar sesión')
        return
      }

      try {
        setError(null)

        if (profile) {
          // Update existing (only username)
          const { data, error } = await supabase
            .from('user_profiles')
            .update({
              username,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id)
            .select()
            .maybeSingle()

          if (error) throw error
          setProfile(data)
        } else {
          // Insert new
          const { data, error } = await supabase
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

          if (error) throw error
          setProfile(data)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al guardar perfil'
        setError(message)
        console.error('Save profile error:', err)
        throw err
      }
    },
    [user?.id, profile]
  )

  const updateAvatar = useCallback(
    async (avatarUrl: string) => {
      if (!user?.id) {
        setError('Debes iniciar sesión')
        return
      }

      try {
        setError(null)

        if (profile) {
          // Update existing profile
          const { data, error } = await supabase
            .from('user_profiles')
            .update({
              avatar_url: avatarUrl,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id)
            .select()
            .maybeSingle()

          if (error) throw error
          setProfile(data)
        } else {
          // Create new profile with avatar
          const { data, error } = await supabase
            .from('user_profiles')
            .insert([{
              user_id: user.id,
              username: user.email?.split('@')[0] || 'Usuario',
              avatar_url: avatarUrl,
              bio: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }])
            .select()
            .maybeSingle()

          if (error) throw error
          setProfile(data)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al guardar avatar'
        setError(message)
        console.error('Update avatar error:', err)
        throw err
      }
    },
    [user?.id, user?.email, profile]
  )

  const uploadAvatar = useCallback(
    async (file: File) => {
      if (!user?.id) {
        setError('Debes iniciar sesión')
        throw new Error('Debes iniciar sesión')
      }

      try {
        setError(null)

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
        await updateAvatar(publicUrl)

        return publicUrl
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al subir imagen'
        setError(message)
        console.error('Upload avatar error:', err)
        throw err
      }
    },
    [user?.id, updateAvatar]
  )

  const updateBio = useCallback(
    async (bio: string) => {
      if (!user?.id) {
        setError('Debes iniciar sesión')
        return
      }

      try {
        setError(null)

        if (profile) {
          // Update existing profile
          const { data, error } = await supabase
            .from('user_profiles')
            .update({
              bio: bio || null,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id)
            .select()
            .maybeSingle()

          if (error) throw error
          setProfile(data)
        } else {
          // Create new profile with bio
          const { data, error } = await supabase
            .from('user_profiles')
            .insert([{
              user_id: user.id,
              username: user.email?.split('@')[0] || 'Usuario',
              avatar_url: null,
              bio: bio || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }])
            .select()
            .maybeSingle()

          if (error) throw error
          setProfile(data)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al guardar bio'
        setError(message)
        console.error('Update bio error:', err)
        throw err
      }
    },
    [user?.id, user?.email, profile]
  )

  return {
    profile,
    loading,
    error,
    saveProfile,
    updateAvatar,
    uploadAvatar,
    updateBio,
  }
}
