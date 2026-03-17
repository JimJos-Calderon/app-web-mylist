import React from 'react'
import { useAuth } from '@/features/auth'
import { ListaContenido, useLists } from '@/features/lists'

const Peliculas: React.FC = () => {
  const { user } = useAuth()
  const { lists, currentList, setCurrentList, loading, createList } = useLists(user?.id)

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