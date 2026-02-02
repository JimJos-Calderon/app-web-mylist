import ListaContenido from '../components/ListaContenido'
export default function Series({ session }) {
  return <ListaContenido tipo="serie" icono="📺" session={session} />
}