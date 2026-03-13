import React, { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import HudContainer from './HudContainer'
import TechLabel from './TechLabel'

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

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onCancel}
    >
      <div 
        className="max-w-md w-full mx-4 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <HudContainer
          className="p-8 border-[rgba(var(--color-accent-secondary-rgb),0.5)] shadow-[0_0_40px_rgba(var(--color-accent-secondary-rgb),0.15)] bg-[rgba(0,0,0,0.6)]"
        >
          {/* Header */}
          <div className="flex flex-col items-center justify-center mb-6 relative">
            <TechLabel text="SYS.ALERT" tone="secondary" blink className="absolute -top-4" />
            
            <div 
              className="mt-6 w-16 h-16 bg-[rgba(var(--color-accent-secondary-rgb),0.08)] border border-[rgba(var(--color-accent-secondary-rgb),0.4)] flex items-center justify-center mb-5"
              style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
            >
              <AlertTriangle className="w-8 h-8 text-accent-secondary drop-shadow-[0_0_8px_rgba(var(--color-accent-secondary-rgb),0.6)]" />
            </div>
            
            <h3 className="text-xl font-black text-[var(--color-text-primary)] text-center tracking-[0.15em] uppercase font-mono mt-2">
              {title}
            </h3>
          </div>

          {/* Message */}
          <p className="text-[var(--color-text-muted)] text-center mb-8 text-sm font-mono opacity-90 leading-relaxed max-w-[90%] mx-auto">
            {message}
          </p>

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-3 bg-transparent hover:bg-[rgba(var(--color-accent-primary-rgb),0.1)] text-[var(--color-text-primary)] font-mono text-xs font-bold uppercase tracking-widest transition-all border border-[rgba(var(--color-accent-primary-rgb),0.4)] hover:border-[rgba(var(--color-accent-primary-rgb),0.8)] hover:text-[var(--color-accent-primary)] hover:shadow-[0_0_15px_rgba(var(--color-accent-primary-rgb),0.2)]"
              style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-3 bg-[rgba(var(--color-accent-secondary-rgb),0.15)] hover:bg-[rgba(var(--color-accent-secondary-rgb),0.25)] text-accent-secondary font-mono text-xs font-bold uppercase tracking-widest transition-all border border-[rgba(var(--color-accent-secondary-rgb),0.6)] hover:border-[rgba(var(--color-accent-secondary-rgb),1)] hover:shadow-[0_0_20px_rgba(var(--color-accent-secondary-rgb),0.35)]"
              style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
            >
              {confirmText}
            </button>
          </div>
        </HudContainer>
      </div>
    </div>
  )
}

export default ConfirmDialog
