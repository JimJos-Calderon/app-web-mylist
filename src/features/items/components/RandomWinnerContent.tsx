import React from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshCw, Play } from 'lucide-react'
import { OptimizedImage, TechLabel } from '@/features/shared'
import type { ListItem } from '@/features/shared'

interface RandomWinnerContentProps {
  item: ListItem
  onReRoll: () => void
  onClose: () => void
}

const RandomWinnerContent: React.FC<RandomWinnerContentProps> = ({ item, onReRoll, onClose }) => {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center gap-6 p-2 md:p-6">
      <div className="relative w-full max-w-[280px] overflow-hidden rounded-2xl border-2 border-[rgba(var(--color-accent-primary-rgb),0.3)] shadow-[0_0_30px_rgba(var(--color-accent-primary-rgb),0.2)] aspect-[2/3]">
        <OptimizedImage
          src={item.poster_url ?? undefined}
          alt={item.titulo}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4">
          <TechLabel
            text={item.tipo === 'pelicula' ? 'PÉLICULA' : 'SERIE'}
            tone="primary"
            className="mb-2"
          />
          <h3 className="text-xl font-black uppercase tracking-tight text-white leading-tight">
            {item.titulo}
          </h3>
        </div>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-[var(--color-accent-primary)] py-4 font-mono text-sm font-black uppercase tracking-widest text-black transition hover:scale-[1.02] hover:brightness-110 active:scale-95"
        >
          <Play className="h-5 w-5 fill-current" />
          {t('action.view_details', 'VER DETALLES')}
        </button>

        <button
          type="button"
          onClick={onReRoll}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-[rgba(var(--color-accent-primary-rgb),0.4)] bg-[rgba(var(--color-accent-primary-rgb),0.1)] py-4 font-mono text-sm font-bold uppercase tracking-widest text-[var(--color-accent-primary)] transition hover:bg-[rgba(var(--color-accent-primary-rgb),0.15)] active:scale-95"
        >
          <RefreshCw className="h-5 w-5" />
          {t('action.roll_again', 'TIRAR DE NUEVO')}
        </button>
      </div>
    </div>
  )
}

export default RandomWinnerContent
