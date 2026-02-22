import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/supabaseClient'
import { List, ListMember } from '@typings/index'

interface UseListsReturn {
  lists: List[]
  currentList: List | null
  setCurrentList: (list: List) => void
  loading: boolean
  error: string | null
  refreshLists: () => Promise<void>
  createList: (name: string, description?: string) => Promise<{ list: List | null; error: string | null }>
  joinListByCode: (inviteCode: string) => Promise<{ error: string | null }>
  getListMembers: (listId: string) => Promise<{ members: ListMember[]; error: string | null }>
}

export const useLists = (userId: string | undefined): UseListsReturn => {
  const [lists, setLists] = useState<List[]>([])
  const [currentList, setCurrentList] = useState<List | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLists = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      setError(null)
      
      // Obtener todas las listas donde el usuario es miembro
      const { data: memberData, error: memberError } = await supabase
        .from('list_members')
        .select('list_id')
        .eq('user_id', userId)

      if (memberError) throw memberError

      const listIds = memberData?.map((m) => m.list_id) || []

      if (listIds.length === 0) {
        setLists([])
        setCurrentList(null)
        setLoading(false)
        return
      }

      // Obtener los detalles de las listas
      const { data: listsData, error: listsError } = await supabase
        .from('lists')
        .select('*')
        .in('id', listIds)
        .order('created_at', { ascending: false })

      if (listsError) throw listsError

      setLists(listsData || [])
      
      // Si no hay lista seleccionada, seleccionar la primera
      if (!currentList && listsData && listsData.length > 0) {
        setCurrentList(listsData[0])
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar listas'
      setError(message)
      console.error('Error fetching lists:', err)
    } finally {
      setLoading(false)
    }
  }, [userId, currentList])

  useEffect(() => {
    fetchLists()
  }, [fetchLists])

  const refreshLists = useCallback(async () => {
    await fetchLists()
  }, [fetchLists])

  const createList = useCallback(async (name: string, description?: string) => {
    if (!userId) {
      return { list: null, error: 'Usuario no autenticado' }
    }

    try {
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
          is_private: false
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
          role: 'owner'
        })

      if (memberError) throw memberError

      // Refrescar listas
      await refreshLists()

      return { list, error: null }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear lista'
      console.error('Error creating list:', err)
      return { list: null, error: message }
    }
  }, [userId, refreshLists])

  const joinListByCode = useCallback(async (inviteCode: string) => {
    if (!userId) {
      return { error: 'Usuario no autenticado' }
    }

    try {
      // Buscar la lista por código
      const { data: list, error: listError } = await supabase
        .from('lists')
        .select('id')
        .eq('invite_code', inviteCode.toUpperCase())
        .single()

      if (listError || !list) {
        return { error: 'Código de invitación inválido' }
      }

      // Verificar si ya es miembro
      const { data: existingMember } = await supabase
        .from('list_members')
        .select('id')
        .eq('list_id', list.id)
        .eq('user_id', userId)
        .single()

      if (existingMember) {
        return { error: 'Ya eres miembro de esta lista' }
      }

      // Agregar al usuario como miembro
      const { error: memberError } = await supabase
        .from('list_members')
        .insert({
          list_id: list.id,
          user_id: userId,
          role: 'member'
        })

      if (memberError) throw memberError

      // Refrescar listas
      await refreshLists()

      return { error: null }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al unirse a la lista'
      console.error('Error joining list:', err)
      return { error: message }
    }
  }, [userId, refreshLists])

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
    error,
    refreshLists,
    createList,
    joinListByCode,
    getListMembers
  }
}
