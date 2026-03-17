import React, { useEffect } from 'react'
import { useAuth } from '@/features/auth'
import { ListaContenido, useLists } from '@/features/lists'
import { useActiveList } from '@/features/lists/hooks/useActiveList'

const Peliculas: React.FC = () => {
  const { user } = useAuth()
  const { lists, currentList, setCurrentList, loading, createList } = useLists(user?.id)
  const { activeList, setActiveList } = useActiveList()

  useEffect(() => {
    if (!lists || lists.length === 0) return

    if (!activeList && currentList) {
      setActiveList({
        id: currentList.id,
        name: currentList.name,
      })
      return
    }

    if (activeList) {
      const found = lists.find((l) => l.id === activeList.id)

      if (found && currentList?.id !== found.id) {
        setCurrentList(found)
      }
    }
  }, [lists, currentList, activeList, setActiveList, setCurrentList])

  if (!user) return null

  return (
    <ListaContenido
      tipo="pelicula"
      icono="🎬"
      listId={currentList?.id}
      lists={lists}
      currentList={currentList ?? undefined}
      setCurrentList={setCurrentList}
      loadingLists={loading}
      createList={createList}
    />
  )
}

export default Peliculas