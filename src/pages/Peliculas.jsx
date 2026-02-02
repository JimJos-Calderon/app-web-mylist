import ListaContenido from '../components/ListaContenido'

export default function Peliculas({ session }) { // <--- Recibe session
  return <ListaContenido tipo="pelicula" icono="🎬" session={session} /> // <--- La pasa
}