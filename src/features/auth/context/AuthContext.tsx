import React, { createContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { Session, User } from '@/features/shared'
import { supabase } from '@/supabaseClient'
import { queryClient } from '@config/queryClient'
import { queryKeys } from '@config/queryKeys'
import { clearPersistedQueryCache } from '@config/queryPersistence'
import { DEFAULT_THEME, applyThemeToDocument, getPersistedTheme, persistTheme } from '@config/appPreferences'

interface AuthContextType {
  session: Session | null
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  error: string | null
  needsUsername: boolean
  completeGoogleProfile: (username: string) => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [needsUsername, setNeedsUsername] = useState(false)

  const checkNeedsUsername = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()
      setNeedsUsername(!data)
    } catch {
      setNeedsUsername(false)
    }
  }, [])

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session as any)
      if (session?.user) {
        const mappedUser: User = {
          id: session.user.id,
          email: session.user.email || '',
          user_metadata: session.user.user_metadata,
        }
        setUser(mappedUser)
        checkNeedsUsername(session.user.id)
      } else {
        setUser(null)
        setNeedsUsername(false)
      }
      setError(null)
      setLoading(false)
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [checkNeedsUsername])

  const signOut = async () => {
    try {
      const persistedTheme = await getPersistedTheme()

      const { error } = await supabase.auth.signOut()
      if (error) throw error

      queryClient.clear()
      await clearPersistedQueryCache()
      setSession(null)
      setUser(null)
      setError(null)
      setNeedsUsername(false)

      await persistTheme(persistedTheme || DEFAULT_THEME)
      applyThemeToDocument(persistedTheme || DEFAULT_THEME)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cerrar sesión'
      setError(message)
      console.error('Sign out error:', err)
    }
  }

  const completeGoogleProfile = async (username: string) => {
    if (!user) throw new Error('No user')
    const { error: profileError } = await supabase.from('user_profiles').insert([{
      user_id: user.id,
      username: username.trim().toLowerCase(),
      avatar_url: user.user_metadata?.avatar_url || null,
      bio: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }])

    if (profileError) {
      throw profileError
    }

    const pendingInviteCode = localStorage.getItem('pendingInviteCode')

    if (pendingInviteCode) {
      const { data, error: joinError } = await supabase.rpc('join_list_with_code', {
        p_user_id: user.id,
        p_invite_code: pendingInviteCode.toUpperCase(),
      })

      if (joinError) {
        throw joinError
      }

      const result = Array.isArray(data) ? data[0] : data

      if (result?.status === 'LIST_NOT_FOUND' || result?.status === 'INVALID_CODE') {
        throw new Error('El codigo de invitacion ya no es valido')
      }

      if (result?.status !== 'JOINED' && result?.status !== 'ALREADY_MEMBER') {
        throw new Error('No se pudo unir a la lista invitada')
      }

      localStorage.removeItem('pendingInviteCode')
      await queryClient.invalidateQueries({ queryKey: queryKeys.lists.byUser(user.id) })
    }

    setNeedsUsername(false)
  }

  return (
    <AuthContext.Provider
      value={{ session, user, loading, signOut, error, needsUsername, completeGoogleProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}
