import React, { Suspense, lazy } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Drawer } from 'vaul'
import { X, Shuffle, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useMediaQuery, useTheme } from '@/features/shared'
import type { ListItem } from '@/features/shared'
import { useRandomSelection } from '../hooks/useRandomSelection'

// Lazy load del contenido del ganador para optimizar el bundle inicial
const RandomWinnerContent = lazy(() => import('./RandomWinnerContent'))

interface RandomPickManagerProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  items: ListItem[]
  loading?: boolean
  onViewDetails?: (item: ListItem) => void
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

  // HUD Style common classes
  const overlayClass = 'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0'
  
  if (isDesktop) {
    return (
      <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className={overlayClass} />
          <Dialog.Content className={`fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 p-6 duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] ${
            isRetroCartoon
              ? 'bg-white border-[4px] border-black rounded-xl shadow-[10px_10px_0px_0px_#000000]'
              : 'border border-[rgba(var(--color-accent-primary-rgb),0.3)] bg-black/95 shadow-2xl rounded-2xl'
          }`}>
            <div className="flex items-center justify-between border-b border-[rgba(var(--color-accent-primary-rgb),0.2)] pb-4">
              <div className="flex items-center gap-3">
                <Shuffle className={`h-5 w-5 ${isRetroCartoon ? 'text-black' : 'text-[var(--color-accent-primary)]'}`} />
                <h2 className={`text-xl font-black uppercase tracking-tight ${isRetroCartoon ? 'text-black' : 'text-white'}`}>{titleText}</h2>
              </div>
              <Dialog.Close className={`rounded-full p-2 transition ${isRetroCartoon ? 'text-black/70 hover:bg-black/10 hover:text-black' : 'text-white/50 hover:bg-white/10 hover:text-white'}`}>
                <X className="h-5 w-5" />
              </Dialog.Close>
            </div>

            <Suspense
              fallback={
                <div className="flex h-[400px] flex-col items-center justify-center gap-4">
                  <Loader2 className="h-10 w-10 animate-spin text-[var(--color-accent-primary)]" />
                  <p className="font-mono text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                    Analizando patrones de usuario...
                  </p>
                </div>
              }
            >
              {selectedItem ? (
                <RandomWinnerContent
                  item={selectedItem}
                  pool={items}
                  onReRoll={handleReRoll}
                  onClose={() => handleViewDetails(selectedItem)}
                />
              ) : (
                <div className="flex h-[400px] flex-col items-center justify-center p-8 text-center">
                  <p className="text-[var(--color-text-muted)]">{t('random_picker.empty', 'No hay items pendientes en esta lista.')}</p>
                </div>
              )}
            </Suspense>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    )
  }

  return (
    <Drawer.Root open={isOpen} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className={overlayClass} />
        <Drawer.Content className={`fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col pb-10 outline-none ${
          isRetroCartoon
            ? 'rounded-t-3xl border-[4px] border-black border-b-0 bg-white'
            : 'rounded-t-3xl border-t border-[rgba(var(--color-accent-primary-rgb),0.3)] bg-black/95'
        }`}>
          <div className={`mx-auto mt-4 h-1.5 w-12 flex-shrink-0 rounded-full ${isRetroCartoon ? 'bg-black/30' : 'bg-white/20'}`} />
          
          <div className="px-6 pt-6">
            <div className="mb-6 flex items-center gap-3">
              <Shuffle className={`h-5 w-5 ${isRetroCartoon ? 'text-black' : 'text-[var(--color-accent-primary)]'}`} />
              <Drawer.Title className={`text-xl font-black uppercase tracking-tight ${isRetroCartoon ? 'text-black' : 'text-white'}`}>
                {titleText}
              </Drawer.Title>
            </div>

            <Suspense
              fallback={
                <div className="flex h-[350px] flex-col items-center justify-center gap-4">
                  <Loader2 className="h-10 w-10 animate-spin text-[var(--color-accent-primary)]" />
                  <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                    Sincronizando con el destino...
                  </p>
                </div>
              }
            >
              {selectedItem ? (
                <RandomWinnerContent
                  item={selectedItem}
                  pool={items}
                  onReRoll={handleReRoll}
                  onClose={() => handleViewDetails(selectedItem)}
                />
              ) : (
                <div className="flex h-[350px] items-center justify-center p-8 text-center">
                   <p className="text-[var(--color-text-muted)]">{t('random_picker.empty')}</p>
                </div>
              )}
            </Suspense>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

export default RandomPickManager
