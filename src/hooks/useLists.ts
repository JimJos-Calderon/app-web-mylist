import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/supabaseClient'
import { List, ListMember } from '@typings/index'
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

      // Buscar la lista por código
      const { data: list, error: listError } = await supabase
        .from('lists')
        .select('id')
        .eq('invite_code', inviteCode.toUpperCase())
        .single()

      if (listError || !list) {
        throw new Error('Código de invitación inválido')
      }

      // Verificar si ya es miembro
      const { data: existingMember } = await supabase
        .from('list_members')
        .select('id')
        .eq('list_id', list.id)
        .eq('user_id', userId)
        .single()

      if (existingMember) {
        throw new Error('Ya eres miembro de esta lista')
      }

      // Agregar al usuario como miembro
      const { error: memberError } = await supabase
        .from('list_members')
        .insert({
          list_id: list.id,
          user_id: userId,
          role: 'member',
        })

      if (memberError) throw memberError
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
