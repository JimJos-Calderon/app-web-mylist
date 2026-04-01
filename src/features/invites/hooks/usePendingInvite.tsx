import { useEffect, useState } from 'react'
import { supabase } from '@/supabaseClient'

type PendingInvite = {
  list_id: string
  list_name: string
  list_description: string | null
  invite_code: string
}

type JoinListRpcResult = {
  joined: boolean
  status: string
  list_id: string | null
  membership_role: string | null
}

type UsePendingInviteParams = {
  userId?: string
}

type UsePendingInviteReturn = {
  pendingInvite: PendingInvite | null
  inviteJoining: boolean
  inviteError: string | null
  clearPendingInvite: () => void
  joinPendingInvite: () => Promise<void>
}

export const usePendingInvite = ({
  userId,
}: UsePendingInviteParams): UsePendingInviteReturn => {
  const [pendingInvite, setPendingInvite] = useState<PendingInvite | null>(null)
  const [inviteJoining, setInviteJoining] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

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
            .eq('user_id', userId)
            .maybeSingle()

          if (!membership) {
            setPendingInvite({
              list_id: data.id,
              list_name: data.name,
              list_description: data.description,
              invite_code: data.invite_code,
            })
          }
        } else {
          setPendingInvite({
            list_id: '',
            list_name: 'Invitacion pendiente',
            list_description: 'Se validara al confirmar la union a la lista.',
            invite_code: code,
          })
        }
      } catch (err) {
        console.error('Error resolving pending invite:', err)
        setPendingInvite({
          list_id: '',
          list_name: 'Invitacion pendiente',
          list_description: 'Se validara al confirmar la union a la lista.',
          invite_code: code,
        })
      } finally {
        localStorage.removeItem('pendingInviteCode')
      }
    }

    resolvePendingInvite()
  }, [userId])

  const clearPendingInvite = () => {
    setPendingInvite(null)
    setInviteError(null)
  }

  const joinPendingInvite = async () => {
    if (!userId || !pendingInvite) return

    setInviteJoining(true)
    setInviteError(null)

    try {
      const { data, error } = await supabase.rpc('join_list_with_code', {
        p_user_id: userId,
        p_invite_code: pendingInvite.invite_code,
      })

      if (error) throw error

      const result = Array.isArray(data)
        ? (data[0] as JoinListRpcResult | undefined)
        : (data as JoinListRpcResult | null)

      if (!result) {
        throw new Error('Respuesta vacía del servidor')
      }

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
  }

  return {
    pendingInvite,
    inviteJoining,
    inviteError,
    clearPendingInvite,
    joinPendingInvite,
  }
}