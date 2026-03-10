import React from 'react'
import { useAuth } from '@/features/auth'
import { ListaContenido, useLists } from '@/features/lists'

const Series: React.FC = () => {
  const { user } = useAuth()
  const { lists, currentList, setCurrentList, loading } = useLists(user?.id)

  if (!user) return null

  return (
    <ListaContenido
      tipo="serie"
      icono="📺"
      listId={currentList?.id}
      lists={lists}
      currentList={currentList ?? undefined}
      setCurrentList={setCurrentList}
      loadingLists={loading}
    />
  )
}

export default Series
