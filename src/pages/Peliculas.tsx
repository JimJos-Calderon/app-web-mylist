import React from 'react'
import { useAuth } from '@hooks/useAuth'
import ListaContenido from '@components/ListaContenido'

const Peliculas: React.FC = () => {
  const { user } = useAuth()

  if (!user) return null

  return <ListaContenido tipo="pelicula" icono="🎬" />
}

export default Peliculas
