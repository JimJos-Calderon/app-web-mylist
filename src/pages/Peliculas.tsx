import React from 'react'
import { useAuth } from '@hooks/useAuth'
import ListaContenido from '@components/ListaContenido'
import { useLists } from '@hooks/useLists'
import { ListSelector } from '@components/ListSelector'
import { CreateListDialog, InviteDialog } from '@components/ListDialogs'

const Peliculas: React.FC = () => {
  const { user } = useAuth()
  const { lists, currentList, setCurrentList, loading } = useLists(user?.id)
  const [showCreateDialog, setShowCreateDialog] = React.useState(false)
  const [showInviteDialog, setShowInviteDialog] = React.useState(false)

  if (!user) return null

  return (
    <ListaContenido
      tipo="pelicula"
      icono="🎬"
      listId={currentList?.id}
      lists={lists}
      currentList={currentList}
      setCurrentList={setCurrentList}
      loadingLists={loading}
    />
  )
}

export default Peliculas
