import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { XCircle } from 'lucide-react'
import { useAuth } from '@/features/auth'
import { supabase } from '@/supabaseClient'
import UsernameSetupModal from '@/features/onboarding/components/UsernameSetupModal'
import PendingInviteModal from '@/features/invites/components/PendingInviteModal'
import AppRoutes from '@/app/AppRoutes'
import AppNavbar from '@/features/navigation/components/AppNavbar'
import DesktopWidgets from '@/features/dashboard/components/DesktopWidgets'
import Login from '@pages/Login'
import JoinList from '@pages/JoinList'

type JoinListRpcResult = {
  joined: boolean
  status: string
  list_id: string | null
  membership_role: string | null
}

const AppShell: React.FC = () => {
  const { session, loading, error: authError, needsUsername } = useAuth()
  const location = useLocation()

  const [showError, setShowError] = useState(authError)
  const [pendingInvite, setPendingInvite] = useState<{
    list_id: string
    list_name: string
    list_description: string | null
    invite_code: string
  } | null>(null)
  const [inviteJoining, setInviteJoining] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)

  useEffect(() => {
    if (authError) {
      setShowError(authError)
      const timer = setTimeout(() => setShowError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [authError])

  useEffect(() => {
    if (!session?.user?.id) return

    const code = localStorage.getItem('pendingInviteCode')
    if (!code) return

    const resolvePendingInvite = async () => {
      try {
        const { data, error } = await supabase
          .from('lists')
          .select('id, name, description, invite_code')
          .eq('invite_code', code)
          .maybeSingle()

        if (error) {
          console.error('Invite resolve error:', error)
        }

        if (data) {
          const { data: membership } = await supabase
            .from('list_members')
            .select('id')
            .eq('list_id', data.id)
            .eq('user_id', session.user.id)
            .maybeSingle()

          if (!membership) {
            setPendingInvite({
              list_id: data.id,
              list_name: data.name,
              list_description: data.description,
              invite_code: data.invite_code,
            })
          }
        }
      } catch (err) {
        console.error('Error resolving pending invite:', err)
      } finally {
        localStorage.removeItem('pendingInviteCode')
      }
    }

    resolvePendingInvite()
  }, [session?.user?.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center relative">
            <div className="w-20 h-20 border-2 border-[rgba(var(--color-accent-primary-rgb),0.2)] border-t-accent-primary border-r-[var(--color-accent-secondary)] rounded-full animate-spin" />
            <div className="absolute inset-0 border-2 border-[rgba(var(--color-accent-secondary-rgb),0.1)] border-b-[var(--color-accent-secondary)] rounded-full animate-[spin_3s_linear_infinite_reverse]" />
          </div>
          <div className="space-y-2">
            <p className="text-accent-primary font-mono font-bold text-lg uppercase tracking-[0.2em] animate-pulse">
              SYS.INIT_SEQUENCE...
            </p>
            <p className="text-[var(--color-text-muted)] font-mono text-xs uppercase opacity-70">
              {'>'} AUTH_CHECK_PENDING
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (location.pathname.match(/^\/join\/[^/]+$/)) {
    return <JoinList />
  }

  if (!session) {
    return <Login />
  }

  return (
    <div className="min-h-screen text-white font-sans selection:bg-orange-500/30 bg-black">
      {needsUsername && <UsernameSetupModal />}

      <PendingInviteModal
        pendingInvite={pendingInvite}
        inviteJoining={inviteJoining}
        inviteError={inviteError}
        onClose={() => setPendingInvite(null)}
        onJoin={async () => {
          if (!session?.user?.id || !pendingInvite) return

          setInviteJoining(true)
          setInviteError(null)

          try {
            const { data, error } = await supabase.rpc('join_list_with_code', {
              p_user_id: session.user.id,
              p_invite_code: pendingInvite.invite_code,
            })

            if (error) throw error

            const result = Array.isArray(data)
              ? (data[0] as JoinListRpcResult | undefined)
              : (data as JoinListRpcResult | null)

            if (!result) throw new Error('Respuesta vacía del servidor')

            if (result.status !== 'JOINED' && result.status !== 'ALREADY_MEMBER') {
              if (result.status === 'LIST_NOT_FOUND' || result.status === 'INVALID_CODE') {
                throw new Error('El código de invitación ya no es válido')
              }
              throw new Error('No se pudo unir a la lista')
            }

            setPendingInvite(null)
            window.location.href = '/peliculas'
          } catch (err: any) {
            console.error(err)
            setInviteError(err?.message || 'Error al unirse a la lista')
          } finally {
            setInviteJoining(false)
          }
        }}
      />

      {showError && (
        <div className="fixed top-4 right-4 z-50 bg-red-500/20 border border-red-500/50 rounded-lg p-4 flex items-start gap-3 max-w-md animate-in slide-in-from-top duration-300">
          <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <span className="text-red-200 text-sm">{showError}</span>
        </div>
      )}

      <AppNavbar />

      <main className="max-w-7xl mx-auto p-4">
        <AppRoutes />
        {location.pathname === '/' && <DesktopWidgets />}
      </main>
    </div>
  )
}

export default AppShell