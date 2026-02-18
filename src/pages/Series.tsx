import React from 'react'
import { useAuth } from '@hooks/useAuth'
import ListaContenido from '@components/ListaContenido'

const Series: React.FC = () => {
  const { user } = useAuth()

  if (!user) return null

  return <ListaContenido tipo="serie" icono="📺" />
}

export default Series
