import React from 'react'
import { X, Shuffle, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useMediaQuery, useTheme } from '@/features/shared'
import type { ListItem } from '@/features/shared'
import { useRandomSelection } from '../hooks/useRandomSelection'
import RandomWinnerContent from './RandomWinnerContent'

interface RandomPickManagerProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  items: ListItem[]
  loading?: boolean
  onViewDetails?: (item: ListItem) => void | Promise<void>
}

const RandomPickManager: React.FC<RandomPickManagerProps> = ({
  isOpen,
  onOpenChange,
  items,
  onViewDetails,
}) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const isRetroCartoon = theme === 'retro-cartoon'
  const isTerminal = theme === 'terminal'
  const isCyberpunk = theme === 'cyberpunk'
  const isDesktop = useMediaQuery('(min-width: 768px)')

  // Solo consideramos items no vistos por defecto para la recomendación
  const { selectedItem, selectRandom, resetSelection } = useRandomSelection<ListItem>(
    (item) => !item.visto
  )

  // Disparar la primera selección cuando se abre el modal
  React.useEffect(() => {
    if (isOpen && !selectedItem && items.length > 0) {
      selectRandom(items)
    }
    if (!isOpen) {
      resetSelection()
    }
  }, [isOpen, items, selectRandom, selectedItem, resetSelection])

  const handleReRoll = () => selectRandom(items)

  const handleViewDetails = (item: ListItem) => {
    onOpenChange(false)
    onViewDetails?.(item)
  }

  const titleText = t('random_picker.title', '¿QUÉ VER HOY?')
  const descriptionText = t(
    'random_picker.description',
    'Selecciona una recomendación aleatoria y abre su ficha sin salir del flujo actual.'
  )

  if (!isOpen) {
    return null
  }

  const overlayClass = 'fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm'
  const panelClass = isRetroCartoon
    ? 'bg-white border-[4px] border-black rounded-xl shadow-[10px_10px_0px_0px_#000000]'
    : isTerminal
      ? 'terminal-surface rounded-none border-[rgba(var(--color-accent-primary-rgb),0.85)] bg-[var(--color-bg-base)] shadow-[0_0_12px_var(--color-glow)]'
      : isCyberpunk
        ? 'cyberpunk-surface'
        : 'border border-[rgba(var(--color-accent-primary-rgb),0.3)] bg-black/95 shadow-2xl rounded-2xl'

  const closeButtonClass = isRetroCartoon
    ? 'rounded-full text-black/70 hover:bg-black/10 hover:text-black'
    : isTerminal
      ? 'terminal-button rounded-none'
      : isCyberpunk
        ? 'cyberpunk-button cyberpunk-button--ghost theme-heading-font !rounded-full px-2'
        : 'rounded-full text-white/50 hover:bg-white/10 hover:text-white'

  const titleClass = isRetroCartoon
    ? 'theme-heading-font text-black'
    : isTerminal
      ? 'theme-heading-font text-[var(--color-text-primary)]'
      : isCyberpunk
        ? 'theme-heading-font text-[var(--color-text-primary)] cyberpunk-text-glow'
        : 'text-white'

  const loadingHeightClass = isDesktop ? 'h-[400px]' : 'h-[350px]'

  return (
    <div data-theme={theme} className="fixed inset-0 z-[90]">
      <button
        type="button"
        aria-label={descriptionText}
        className={overlayClass}
        onClick={() => onOpenChange(false)}
      />

      {isDesktop ? (
        <div className="fixed inset-0 z-[91] overflow-y-auto p-4 md:flex md:items-start md:justify-center md:pt-6 md:pb-6">
          <div className={`mx-auto my-0 grid w-full max-w-lg gap-4 p-6 max-h-[calc(100vh-3rem)] overflow-y-auto md:my-0 md:max-h-[calc(100vh-3rem)] ${panelClass}`}>
            <div className="flex items-center justify-between border-b border-[rgba(var(--color-accent-primary-rgb),0.2)] pb-4">
              <div className="flex items-center gap-3">
                <Shuffle className={`h-5 w-5 ${isRetroCartoon ? 'text-black' : 'text-[var(--color-accent-primary)]'}`} />
                <h2 className={`text-xl font-black uppercase tracking-tight ${titleClass}`}>{titleText}</h2>
              </div>
              <button type="button" onClick={() => onOpenChange(false)} className={`p-2 transition ${closeButtonClass}`}>
                <X className="h-5 w-5" />
              </button>
            </div>

            {selectedItem ? (
              <RandomWinnerContent
                item={selectedItem}
                pool={items}
                onReRoll={handleReRoll}
                onClose={() => handleViewDetails(selectedItem)}
              />
            ) : (
              <div className={`flex ${loadingHeightClass} flex-col items-center justify-center gap-4 p-8 text-center`}>
                <Loader2 className="h-10 w-10 animate-spin text-[var(--color-accent-primary)]" />
                <p className="font-mono text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                  {items.length > 0
                    ? 'Analizando patrones de usuario...'
                    : t('random_picker.empty', 'No hay items pendientes en esta lista.')}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="fixed inset-x-0 bottom-0 z-[91]">
          <div className={`flex h-auto flex-col pb-10 outline-none ${isRetroCartoon ? 'rounded-t-3xl border-[4px] border-black border-b-0 bg-white' : isTerminal ? 'rounded-t-none border-t border-[rgba(var(--color-accent-primary-rgb),0.85)] bg-[var(--color-bg-base)]' : isCyberpunk ? 'cyberpunk-surface rounded-t-3xl' : 'rounded-t-3xl border-t border-[rgba(var(--color-accent-primary-rgb),0.3)] bg-black/95'}`}>
            <div className={`mx-auto mt-4 h-1.5 w-12 flex-shrink-0 ${isRetroCartoon ? 'rounded-full bg-black/30' : isTerminal ? 'bg-[var(--color-accent-primary)]' : 'rounded-full bg-white/20'}`} />

            <div className="px-6 pt-6">
              <div className="mb-6 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Shuffle className={`h-5 w-5 ${isRetroCartoon ? 'text-black' : 'text-[var(--color-accent-primary)]'}`} />
                  <h2 className={`text-xl font-black uppercase tracking-tight ${titleClass}`}>{titleText}</h2>
                </div>
                <button type="button" onClick={() => onOpenChange(false)} className={`p-2 transition ${closeButtonClass}`}>
                  <X className="h-5 w-5" />
                </button>
              </div>

              {selectedItem ? (
                <RandomWinnerContent
                  item={selectedItem}
                  pool={items}
                  onReRoll={handleReRoll}
                  onClose={() => handleViewDetails(selectedItem)}
                />
              ) : (
                <div className={`flex ${loadingHeightClass} flex-col items-center justify-center gap-4 p-8 text-center`}>
                  <Loader2 className="h-10 w-10 animate-spin text-[var(--color-accent-primary)]" />
                  <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                    {items.length > 0 ? 'Sincronizando con el destino...' : t('random_picker.empty')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RandomPickManager
