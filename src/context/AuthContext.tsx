import React, { createContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { Session, User } from '@/types'
import { supabase } from '@/supabaseClient'

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
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setSession(null)
      setUser(null)
      setError(null)
      setNeedsUsername(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cerrar sesión'
      setError(message)
      console.error('Sign out error:', err)
    }
  }

  const completeGoogleProfile = async (username: string) => {
    if (!user) throw new Error('No user')
    await supabase.from('user_profiles').insert([{
      user_id: user.id,
      username: username.trim().toLowerCase(),
      avatar_url: user.user_metadata?.avatar_url || null,
      bio: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }])
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
