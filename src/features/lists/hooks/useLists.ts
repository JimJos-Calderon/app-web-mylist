import { useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/supabaseClient'
import { LIST_SELECT_PUBLIC } from '@/config/listSelect'
import { List, ListMember } from '@/features/shared'
import { queryKeys } from '@config/queryKeys'
import { useActiveList } from './useActiveList'

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
  deleteList: (listId: string) => Promise<void>
  leaveList: (listId: string) => Promise<void>
  isCreatingList: boolean
  isJoiningList: boolean
  isDeletingList: boolean
  isLeavingList: boolean
}

type JoinListRpcResult = {
  joined: boolean
  status: string
  list_id: string | null
  membership_role: string | null
}

/**
 * Hook para gestionar listas de usuario
 * activeList = fuente de verdad persistida
 * currentList = derivado desde lists + activeList
 */
export const useLists = (userId: string | undefined): UseListsReturn => {
  const queryClient = useQueryClient()
  const { activeList, setActiveList, clearActiveList } = useActiveList()

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
        const { data: memberData, error: memberError } = await supabase
          .from('list_members')
          .select('list_id')
          .eq('user_id', userId)

        if (memberError) throw memberError

        const listIds = memberData?.map((m) => m.list_id) || []

        if (listIds.length === 0) {
          return []
        }

        const { data: listsData, error: listsError } = await supabase
          .from('lists')
          .select(LIST_SELECT_PUBLIC)
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

  const currentList = lists.find((list) => list.id === activeList?.id) || null

  const setCurrentList = useCallback(
    (list: List) => {
      setActiveList({
        id: list.id,
        name: list.name,
      })
    },
    [setActiveList]
  )

  useEffect(() => {
    if (!lists.length) {
      if (activeList) {
        clearActiveList()
      }
      return
    }

    if (!activeList) {
      const firstList = lists[0]
      setActiveList({
        id: firstList.id,
        name: firstList.name,
      })
      return
    }

    const existingActiveList = lists.find((list) => list.id === activeList.id)

    if (!existingActiveList) {
      const firstList = lists[0]
      setActiveList({
        id: firstList.id,
        name: firstList.name,
      })
      return
    }

    if (existingActiveList.name !== activeList.name) {
      setActiveList({
        id: existingActiveList.id,
        name: existingActiveList.name,
      })
    }
  }, [lists, activeList, setActiveList, clearActiveList])

  const refreshLists = useCallback(async () => {
    await refetch()
  }, [refetch])

  const createListMutation = useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      if (!userId) {
        throw new Error('Usuario no autenticado')
      }

      const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase()

      const { data: list, error: listError } = await supabase
        .from('lists')
        .insert({
          name,
          description: description || null,
          owner_id: userId,
          invite_code: inviteCode,
          is_private: false,
        })
        .select(LIST_SELECT_PUBLIC)
        .single()

      if (listError) throw listError

      const { error: memberError } = await supabase.from('list_members').insert({
        list_id: list.id,
        user_id: userId,
        role: 'owner',
      })

      if (memberError) throw memberError

      return list as List
    },
    onSuccess: (newList) => {
      const queryKey = queryKeys.lists.byUser(userId || '')

      queryClient.setQueryData<List[]>(queryKey, (previous = []) => {
        const exists = previous.some((list) => list.id === newList.id)
        if (exists) return previous
        return [newList, ...previous]
      })

      setActiveList({
        id: newList.id,
        name: newList.name,
      })

      queryClient.invalidateQueries({
        queryKey,
      })
    },
    onError: (mutationError) => {
      console.error('Error creating list:', mutationError)
    },
  })

  const joinListMutation = useMutation({
    mutationFn: async (inviteCode: string) => {
      if (!userId) {
        throw new Error('Usuario no autenticado')
      }

      const { data, error: rpcError } = await supabase.rpc('join_list_with_code', {
        p_user_id: userId,
        p_invite_code: inviteCode.toUpperCase(),
      })

      if (rpcError) throw rpcError

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
      queryClient.invalidateQueries({
        queryKey: queryKeys.lists.byUser(userId || ''),
      })
    },
    onError: (mutationError) => {
      console.error('Error joining list:', mutationError)
    },
  })

  const deleteListMutation = useMutation({
    mutationFn: async (listId: string) => {
      if (!userId) throw new Error('Usuario no autenticado')
      const { error } = await supabase.from('lists').delete().eq('id', listId)
      if (error) throw error
    },
    onSuccess: (_, deletedListId) => {
      const queryKey = queryKeys.lists.byUser(userId || '')
      queryClient.setQueryData<List[]>(queryKey, (previous = []) => 
        previous.filter((list) => list.id !== deletedListId)
      )
      if (activeList?.id === deletedListId) {
        clearActiveList()
      }
      queryClient.invalidateQueries({ queryKey })
    },
    onError: (err) => console.error('Error deleting list:', err),
  })

  const leaveListMutation = useMutation({
    mutationFn: async (listId: string) => {
      if (!userId) throw new Error('Usuario no autenticado')
      const { error } = await supabase
        .from('list_members')
        .delete()
        .match({ list_id: listId, user_id: userId })
      if (error) throw error
    },
    onSuccess: (_, leftListId) => {
      const queryKey = queryKeys.lists.byUser(userId || '')
      queryClient.setQueryData<List[]>(queryKey, (previous = []) => 
        previous.filter((list) => list.id !== leftListId)
      )
      if (activeList?.id === leftListId) {
        clearActiveList()
      }
      queryClient.invalidateQueries({ queryKey })
    },
    onError: (err) => console.error('Error leaving list:', err),
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
    deleteList: async (id) => deleteListMutation.mutateAsync(id),
    leaveList: async (id) => leaveListMutation.mutateAsync(id),
    isCreatingList: createListMutation.isPending,
    isJoiningList: joinListMutation.isPending,
    isDeletingList: deleteListMutation.isPending,
    isLeavingList: leaveListMutation.isPending,
  }
}