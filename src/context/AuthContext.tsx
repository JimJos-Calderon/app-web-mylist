import React, { createContext, useEffect, useState, ReactNode } from 'react'
import { Session, User } from '@/types'
import { supabase } from '@/supabaseClient'

interface AuthContextType {
  session: Session | null
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  error: string | null
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

  useEffect(() => {
    // Use only onAuthStateChange (fires INITIAL_SESSION on first call in Supabase v2)
    // This avoids the race condition where getInitialSession sets loading=false
    // before onAuthStateChange has fired with the actual session.
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
      } else {
        setUser(null)
      }
      setError(null)
      // Always mark loading as done once we get any auth event
      setLoading(false)
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setSession(null)
      setUser(null)
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cerrar sesión'
      setError(message)
      console.error('Sign out error:', err)
    }
  }

  return (
    <AuthContext.Provider
      value={{ session, user, loading, signOut, error }}
    >
      {children}
    </AuthContext.Provider>
  )
}
