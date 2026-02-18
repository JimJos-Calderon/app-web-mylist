import React from 'react'
import { ListItem } from '@/types'

interface ItemCardProps {
  item: ListItem
  isOwn: boolean
  onDelete: (id: string) => Promise<void>
  onToggleVisto: (id: string, currentState: boolean) => Promise<void>
}

const ItemCard: React.FC<ItemCardProps> = ({
  item,
  isOwn,
  onDelete,
  onToggleVisto,
}) => {
  const [deleting, setDeleting] = React.useState(false)

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar "${item.titulo}"?`)) return

    setDeleting(true)
    try {
      await onDelete(item.id)
    } catch (err) {
      console.error('Delete error:', err)
    } finally {
      setDeleting(false)
    }
  }

  const handleToggle = async () => {
    try {
      await onToggleVisto(item.id, item.visto)
    } catch (err) {
      console.error('Toggle error:', err)
    }
  }

  return (
    <div
      className={`group relative flex flex-col rounded-[2rem] border-2 transition-all duration-500 overflow-hidden bg-black/60 backdrop-blur-md ${
        item.visto
          ? 'border-purple-900/20 opacity-30 scale-95'
          : isOwn
            ? 'border-cyan-500/20 hover:border-cyan-400 hover:shadow-[0_0_30px_rgba(0,255,255,0.4)] hover:-translate-y-2'
            : 'border-pink-500/20 hover:border-pink-500 hover:shadow-[0_0_30px_rgba(255,0,255,0.4)] hover:-translate-y-2'
      }`}
    >
      {/* Image */}
      <div className="relative aspect-[2/3] w-full overflow-hidden">
        {item.poster_url ? (
          <img
            src={item.poster_url}
            alt={item.titulo}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x450?text=No+Image'
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center text-center px-4">
            <div>
              <div className="text-4xl mb-2">🎬</div>
              <div className="text-[10px] text-zinc-500 font-black uppercase">
                {item.tipo === 'pelicula' ? 'Película' : 'Serie'}
              </div>
            </div>
          </div>
        )}

        {/* Checkbox overlay */}
        <div
          className={`absolute top-4 right-4 transition-all duration-300 ${
            item.visto ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <label className="relative flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={item.visto}
              onChange={handleToggle}
              className="w-6 h-6 appearance-none border-2 border-white bg-black/60 rounded-full checked:bg-cyan-400 checked:border-cyan-400 cursor-pointer transition-all"
            />
            {item.visto && (
              <svg
                className="absolute w-4 h-4 text-black pointer-events-none left-1 top-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </label>
        </div>
      </div>

      {/* Info */}
      <div className="p-5 flex flex-col flex-1 justify-between">
        <div>
          <h3
            className={`text-[15px] font-black italic tracking-tighter leading-tight mb-3 uppercase break-words line-clamp-3 ${
              item.visto ? 'text-zinc-700 line-through' : 'text-white'
            }`}
          >
            {item.titulo}
          </h3>
          <div
            className={`inline-block text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-md border ${
              isOwn
                ? 'border-cyan-400/30 text-cyan-400 bg-cyan-400/5'
                : 'border-pink-500/30 text-pink-500 bg-pink-500/5'
            }`}
          >
            {isOwn ? 'TUYO' : item.user_email?.split('@')[0]}
          </div>
        </div>

        {/* Delete button */}
        <div className="flex justify-end mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-zinc-600 hover:text-red-500 transition-all p-2 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Eliminar"
          >
            {deleting ? (
              <svg className="animate-spin h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ItemCard
