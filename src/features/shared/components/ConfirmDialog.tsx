import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle } from 'lucide-react'
import TechLabel from './TechLabel'
import { useTheme } from '../hooks/useTheme'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
}) => {
  const { theme } = useTheme()
  const isRetroCartoon = theme === 'retro-cartoon'

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const panelClass = isRetroCartoon
    ? 'retro-fx w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl border-[4px] border-black bg-white text-black shadow-[10px_10px_0px_0px_#000000]'
    : 'w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-[rgba(var(--color-accent-primary-rgb),0.25)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] shadow-2xl'

  const titleClass = isRetroCartoon
    ? 'theme-heading-font mt-2 text-center uppercase tracking-[0.15em] font-black text-black'
    : 'mt-2 text-center uppercase tracking-[0.15em] font-mono text-xl font-black text-[var(--color-text-primary)]'

  const messageClass = isRetroCartoon
    ? 'mx-auto mb-8 max-w-[90%] text-center text-sm leading-relaxed font-medium text-black'
    : 'mx-auto mb-8 max-w-[90%] text-center text-sm leading-relaxed font-mono text-[var(--color-text-muted)] opacity-90'

  const cancelButtonClass = isRetroCartoon
    ? 'theme-heading-font flex-1 px-4 py-3 font-bold uppercase transition-all bg-white text-black border-[3px] border-black shadow-[5px_5px_0px_0px_#000000] rounded-xl hover:-translate-y-[2px] hover:shadow-[7px_7px_0px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
    : 'flex-1 rounded-xl border border-[rgba(var(--color-accent-primary-rgb),0.3)] bg-[var(--color-bg-elevated)] px-4 py-3 font-mono text-xs font-bold uppercase tracking-widest text-[var(--color-text-primary)] transition hover:border-[rgba(var(--color-accent-primary-rgb),0.5)] hover:bg-[var(--color-bg-primary)]'

  const confirmButtonClass = isRetroCartoon
    ? 'theme-heading-font flex-1 px-4 py-3 font-bold uppercase transition-all bg-white text-black border-[3px] border-black shadow-[5px_5px_0px_0px_#000000] rounded-xl hover:-translate-y-[2px] hover:shadow-[7px_7px_0px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
    : 'flex-1 rounded-xl border border-[rgba(var(--color-accent-secondary-rgb),0.45)] bg-[rgba(var(--color-accent-secondary-rgb),0.12)] px-4 py-3 font-mono text-xs font-bold uppercase tracking-widest text-[var(--color-accent-secondary)] transition hover:border-[rgba(var(--color-accent-secondary-rgb),0.65)] hover:bg-[rgba(var(--color-accent-secondary-rgb),0.18)]'

  const iconClass = isRetroCartoon
    ? 'h-8 w-8 text-black'
    : 'h-8 w-8 text-[var(--color-accent-primary)]'

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div className={panelClass} onClick={(e) => e.stopPropagation()}>
        <div className="p-8">
          {/* Header */}
          <div className="relative mb-6 flex flex-col items-center justify-center">
            <TechLabel text="SYS.ALERT" tone="secondary" blink className="absolute -top-4" />

            <div
              className={`mt-6 mb-5 flex h-16 w-16 items-center justify-center border-[3px] ${
                isRetroCartoon
                  ? 'border-black bg-white'
                  : 'border-[rgba(var(--color-accent-primary-rgb),0.3)] bg-[var(--color-bg-primary)]'
              }`}
            >
              <AlertTriangle className={iconClass} />
            </div>

            <h3 className={titleClass}>
              {title}
            </h3>
          </div>

          {/* Message */}
          <p className={messageClass}>
            {message}
          </p>

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              onClick={onCancel}
              className={cancelButtonClass}
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={confirmButtonClass}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default ConfirmDialog
