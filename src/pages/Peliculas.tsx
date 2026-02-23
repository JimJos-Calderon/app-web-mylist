import React from 'react'
import { useAuth } from '@hooks/useAuth'
import ListaContenido from '@components/ListaContenido'
import { useLists } from '@hooks/useLists'

const Peliculas: React.FC = () => {
  const { user } = useAuth()
  const { lists, currentList, setCurrentList, loading } = useLists(user?.id)

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
    />
  )
}

export default Peliculas
