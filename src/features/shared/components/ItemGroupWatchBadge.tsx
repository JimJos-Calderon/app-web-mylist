import React from 'react'
import { Users } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'

export interface ItemGroupWatchBadgeProps {
  watched: number
  total: number
  /** Texto corto tipo "2/4" (i18n desde el padre). */
  ratioLabel: string
  /** Leyenda accesible / tooltip. */
  title: string
  /** Variante compacta para tarjetas; más aire en modal. */
  density?: 'compact' | 'comfortable'
}

/**
 * Indicador "X/Y miembros han visto" alineado con los temas HUD / retro / terminal / cyberpunk.
 */
const ItemGroupWatchBadge: React.FC<ItemGroupWatchBadgeProps> = ({
  watched,
  total,
  ratioLabel,
  title,
  density = 'compact',
}) => {
  const { theme } = useTheme()
  const isRetroCartoon = theme === 'retro-cartoon'
  const isTerminal = theme === 'terminal'
  const isCyberpunk = theme === 'cyberpunk'

  const isComplete = total > 0 && watched >= total
  const densityClass = density === 'compact' ? 'item-group-watch--compact' : 'item-group-watch--comfortable'

  return (
    <div
      className={`item-group-watch ${densityClass} ${
        isComplete ? 'item-group-watch--complete' : ''
      } ${isRetroCartoon ? 'item-group-watch--retro' : ''} ${
        isTerminal ? 'item-group-watch--terminal' : ''
      } ${isCyberpunk ? 'item-group-watch--cyberpunk' : ''}`}
      title={title}
    >
      <Users className="item-group-watch__icon" aria-hidden="true" strokeWidth={2.25} />
      <span className="item-group-watch__ratio">{ratioLabel}</span>
    </div>
  )
}

export default ItemGroupWatchBadge
