import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/supabaseClient'
import { List, ListMember } from '@/features/shared'
import { queryKeys } from '@config/queryKeys'

interface UseListsReturn {
  lists: List[]
  currentList: List | null
  setCurrentList: (list: List) => void
  loading: boolean
  error: string | null
  refreshLists: () => Promise<void>
  createList: (name: string, description?: string) => Promise<List | null>
  joinListByCode: (inviteCode: string) => Promise<void>
  getListMembers: (listId: string) => Promise<{ members: ListMember[]; error: string | null }>
  isCreatingList: boolean
  isJoiningList: boolean
}

type JoinListRpcResult = {
  joined: boolean
  status: string
  list_id: string | null
  membership_role: string | null
}

/**
 * Hook para gestionar listas de usuario
 * Lectura con useQuery + Mutaciones con useMutation
 */
export const useLists = (userId: string | undefined): UseListsReturn => {
  const [currentList, setCurrentList] = useState<List | null>(null)
  const queryClient = useQueryClient()

  // Query para obtener listas del usuario
  const {
    data: lists = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.lists.byUser(userId || ''),
    queryFn: async () => {
      if (!userId) {
        return []
      }

      try {
        // Obtener todas las listas donde el usuario es miembro
        const { data: memberData, error: memberError } = await supabase
          .from('list_members')
          .select('list_id')
          .eq('user_id', userId)

        if (memberError) throw memberError

        const listIds = memberData?.map((m) => m.list_id) || []

        if (listIds.length === 0) {
          return []
        }

        // Obtener los detalles de las listas
        const { data: listsData, error: listsError } = await supabase
          .from('lists')
          .select('*')
          .in('id', listIds)
          .order('created_at', { ascending: false })

        if (listsError) throw listsError

        return (listsData || []) as List[]
      } catch (err) {
        console.error('Error fetching lists:', err)
        throw err
      }
    },
    enabled: !!userId,
  })

  // Auto-select first list if none is selected
  useEffect(() => {
    if (!currentList && lists && lists.length > 0) {
      setCurrentList(lists[0])
    }
  }, [lists, currentList])

  const refreshLists = useCallback(async () => {
    await refetch()
  }, [refetch])

  // ─── MUTACIÓN: Crear Lista ────────────────────────────────────
  const createListMutation = useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      if (!userId) {
        throw new Error('Usuario no autenticado')
      }

      // Generar código de invitación
      const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase()

      // Crear la lista
      const { data: list, error: listError } = await supabase
        .from('lists')
        .insert({
          name,
          description: description || null,
          owner_id: userId,
          invite_code: inviteCode,
          is_private: false,
        })
        .select()
        .single()

      if (listError) throw listError

      // Agregar al usuario como owner en list_members
      const { error: memberError } = await supabase
        .from('list_members')
        .insert({
          list_id: list.id,
          user_id: userId,
          role: 'owner',
        })

      if (memberError) throw memberError

      return list as List
    },
    onSuccess: () => {
      // Invalidar y re-fetchear listas
      queryClient.invalidateQueries({
        queryKey: queryKeys.lists.byUser(userId || ''),
      })
    },
    onError: (error) => {
      console.error('Error creating list:', error)
    },
  })

  // ─── MUTACIÓN: Unirse a Lista ─────────────────────────────────
  const joinListMutation = useMutation({
    mutationFn: async (inviteCode: string) => {
      if (!userId) {
        throw new Error('Usuario no autenticado')
      }

      const { data, error } = await supabase.rpc('join_list_with_code', {
        p_user_id: userId,
        p_invite_code: inviteCode.toUpperCase(),
      })

      if (error) throw error

      const result = Array.isArray(data)
        ? (data[0] as JoinListRpcResult | undefined)
        : (data as JoinListRpcResult | null)

      if (!result) {
        throw new Error('Respuesta vacía del servidor')
      }

      if (result.status === 'ALREADY_MEMBER') {
        throw new Error('Ya eres miembro de esta lista')
      }

      if (result.status === 'LIST_NOT_FOUND' || result.status === 'INVALID_CODE') {
        throw new Error('Código de invitación inválido')
      }

      if (result.status !== 'JOINED') {
        throw new Error('No se pudo unir a la lista')
      }
    },
    onSuccess: () => {
      // Invalidar y re-fetchear listas
      queryClient.invalidateQueries({
        queryKey: queryKeys.lists.byUser(userId || ''),
      })
    },
    onError: (error) => {
      console.error('Error joining list:', error)
    },
  })

  const getListMembers = useCallback(async (listId: string) => {
    try {
      const { data, error: membersError } = await supabase
        .from('list_members')
        .select(`
          id,
          list_id,
          user_id,
          role,
          joined_at
        `)
        .eq('list_id', listId)

      if (membersError) throw membersError

      return { members: data || [], error: null }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar miembros'
      console.error('Error fetching members:', err)
      return { members: [], error: message }
    }
  }, [])

  return {
    lists,
    currentList,
    setCurrentList,
    loading,
    error: error?.message || null,
    refreshLists,
    createList: async (name, description) => {
      const list = await createListMutation.mutateAsync({ name, description })
      return list || null
    },
    joinListByCode: (code) => joinListMutation.mutateAsync(code),
    getListMembers,
    isCreatingList: createListMutation.isPending,
    isJoiningList: joinListMutation.isPending,
  }
}
