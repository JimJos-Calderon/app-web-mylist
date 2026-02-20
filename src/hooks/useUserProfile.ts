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
          // Update existing
          const { data, error } = await supabase
            .from('user_profiles')
            .update({
              username,
              avatar_url: profile.avatar_url,
              bio: profile.bio,
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
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al guardar avatar'
        setError(message)
        console.error('Update avatar error:', err)
        throw err
      }
    },
    [user?.id, profile]
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
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al guardar bio'
        setError(message)
        console.error('Update bio error:', err)
        throw err
      }
    },
    [user?.id, profile]
  )

  return {
    profile,
    loading,
    error,
    saveProfile,
    updateAvatar,
    updateBio,
  }
}
