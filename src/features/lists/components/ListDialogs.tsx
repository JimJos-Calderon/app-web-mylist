import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { useTranslation } from 'react-i18next'
import { List } from '@/features/shared'
import { X, Plus, Copy, Check, Users } from 'lucide-react'
import HudContainer from '../../shared/components/HudContainer'
import TechLabel from '../../shared/components/TechLabel'

// ─── Hook para cerrar con Escape ─────────────────────────────────────────────
function useEscapeKey(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])
}

// ─── CreateListDialog ────────────────────────────────────────────────────────

interface CreateListDialogProps {
  open: boolean
  onClose: () => void
  onCreated: (list: List) => void
  onCreate?: (name: string, description?: string) => Promise<List | null>
}

export const CreateListDialog: React.FC<CreateListDialogProps> = ({
  open,
  onClose,
  onCreated,
  onCreate,
}) => {
  const { t } = useTranslation()
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEscapeKey(open, onClose)

  const handleCreate = async () => {
    if (!nombre.trim()) return

    setLoading(true)
    setError(null)

    try {
      if (!onCreate) {
        throw new Error('No hay manejador para crear listas')
      }

      const newList = await onCreate(nombre.trim(), descripcion.trim() || undefined)

      if (!newList) {
        throw new Error('No se pudo crear la lista')
      }

      setNombre('')
      setDescripcion('')
      onCreated(newList)
      onClose()
    } catch (err: any) {
      console.error('Create list error message:', err?.message)
      console.error('Create list error code:', err?.code)
      console.error('Create list error details:', err?.details)
      console.error('Create list error hint:', err?.hint)
      console.error('Create list full:', JSON.stringify(err, null, 2))

      setError(err?.message || 'Error al crear la lista. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-md animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <HudContainer className="p-0 border-[rgba(var(--color-accent-primary-rgb),0.5)] shadow-[0_0_40px_rgba(var(--color-accent-primary-rgb),0.15)] bg-[rgba(0,0,0,0.6)]">
          <div className="flex items-center justify-between px-6 py-5 border-b border-[rgba(var(--color-accent-primary-rgb),0.2)]">
            <div className="flex items-center gap-4">
              <div
                className="w-10 h-10 bg-[rgba(var(--color-accent-primary-rgb),0.08)] border border-[rgba(var(--color-accent-primary-rgb),0.4)] flex items-center justify-center shrink-0"
                style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
              >
                <Plus className="w-5 h-5 text-accent-primary drop-shadow-[0_0_8px_rgba(var(--color-accent-primary-rgb),0.6)]" />
              </div>
              <div className="flex flex-col gap-1">
                <TechLabel text="SYS.CREATE_LNK" blink />
                <h2 className="text-lg font-black uppercase tracking-[0.1em] text-[var(--color-text-primary)] font-mono leading-none">
                  {t('dialog.create_list_title')}
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label={t('dialog.close_button')}
              className="w-8 h-8 flex items-center justify-center text-[var(--color-text-muted)] hover:text-accent-primary hover:bg-[rgba(var(--color-accent-primary-rgb),0.1)] transition-all"
              style={{ clipPath: 'polygon(25% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 25%)' }}
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="px-6 py-6 space-y-6">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-2 font-mono">
                {'>'} {t('dialog.list_name_label')}
              </label>
              <input
                type="text"
                placeholder={t('dialog.list_name_placeholder')}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && nombre.trim() && handleCreate()}
                autoFocus
                maxLength={60}
                className="w-full px-4 py-3 bg-[rgba(0,0,0,0.5)] border border-[rgba(var(--color-accent-primary-rgb),0.3)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] opacity-80
                           focus-visible:border-accent-primary focus-visible:ring-1 focus-visible:ring-[rgba(var(--color-accent-primary-rgb),0.5)] focus-visible:outline-none focus:opacity-100
                           transition-all font-mono text-sm"
                style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-2 font-mono">
                {'>'} {t('dialog.description_label')}{' '}
                <span className="opacity-50 tracking-normal normal-case text-[10px]">
                  ({t('dialog.description_optional')})
                </span>
              </label>
              <textarea
                placeholder={t('dialog.description_placeholder')}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                maxLength={200}
                rows={3}
                className="w-full px-4 py-3 bg-[rgba(0,0,0,0.5)] border border-[rgba(var(--color-accent-primary-rgb),0.3)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] opacity-80
                           focus-visible:border-accent-primary focus-visible:ring-1 focus-visible:ring-[rgba(var(--color-accent-primary-rgb),0.5)] focus-visible:outline-none focus:opacity-100
                           transition-all font-mono text-sm resize-none"
                style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
              />
            </div>

            {error && (
              <div
                className="px-4 py-3 bg-[rgba(var(--color-accent-secondary-rgb),0.1)] border border-[rgba(var(--color-accent-secondary-rgb),0.4)] text-accent-secondary font-mono text-xs"
                style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
              >
                {'> ERR:'} {error}
              </div>
            )}
          </div>

          <div className="flex gap-4 px-6 pb-6 mt-2">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-transparent hover:bg-[rgba(var(--color-accent-primary-rgb),0.1)] text-[var(--color-text-primary)] font-mono text-xs font-bold uppercase tracking-widest transition-all border border-[rgba(var(--color-accent-primary-rgb),0.4)] hover:border-[rgba(var(--color-accent-primary-rgb),0.8)] hover:text-accent-primary disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
            >
              {t('dialog.cancel_button')}
            </button>
            <button
              onClick={handleCreate}
              disabled={loading || !nombre.trim()}
              className="flex-1 px-4 py-3 bg-[rgba(var(--color-accent-primary-rgb),0.15)] hover:bg-[rgba(var(--color-accent-primary-rgb),0.25)] text-accent-primary font-mono text-xs font-bold uppercase tracking-widest transition-all border border-[rgba(var(--color-accent-primary-rgb),0.6)] hover:border-[rgba(var(--color-accent-primary-rgb),1)] hover:shadow-[0_0_20px_rgba(var(--color-accent-primary-rgb),0.35)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
              style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-[rgba(var(--color-accent-primary-rgb),0.3)] border-t-accent-primary rounded-full animate-spin" />
                  {t('dialog.creating_button')}
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  {t('dialog.create_button')}
                </>
              )}
            </button>
          </div>
        </HudContainer>
      </div>
    </div>,
    document.body
  )
}

// ─── InviteDialog ─────────────────────────────────────────────────────────────

interface InviteDialogProps {
  open: boolean
  onClose: () => void
  list: List
}

export const InviteDialog: React.FC<InviteDialogProps> = ({ open, onClose, list }) => {
  const { t } = useTranslation()
  const [copiedCode, setCopiedCode] = useState(false)

  useEscapeKey(open, onClose)

  const inviteUrl = `${window.location.origin}/join/${list.invite_code}`

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteUrl)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  if (!open) return null

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-md animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <HudContainer className="p-0 border-[rgba(var(--color-accent-secondary-rgb),0.5)] shadow-[0_0_40px_rgba(var(--color-accent-secondary-rgb),0.15)] bg-[rgba(0,0,0,0.6)]">
          <div className="flex items-center justify-between px-6 py-5 border-b border-[rgba(var(--color-accent-secondary-rgb),0.2)]">
            <div className="flex items-center gap-4">
              <div
                className="w-10 h-10 bg-[rgba(var(--color-accent-secondary-rgb),0.08)] border border-[rgba(var(--color-accent-secondary-rgb),0.4)] flex items-center justify-center shrink-0"
                style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
              >
                <Users className="w-5 h-5 text-accent-secondary drop-shadow-[0_0_8px_rgba(var(--color-accent-secondary-rgb),0.6)]" />
              </div>
              <div className="flex flex-col gap-1">
                <TechLabel text="SYS.INVITE_REQ" tone="secondary" blink />
                <h2 className="text-lg font-black uppercase tracking-[0.1em] text-[var(--color-text-primary)] font-mono leading-none">
                  {t('dialog.invite_title')}
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label={t('dialog.close_button')}
              className="w-8 h-8 flex items-center justify-center text-[var(--color-text-muted)] hover:text-accent-secondary hover:bg-[rgba(var(--color-accent-secondary-rgb),0.1)] transition-all"
              style={{ clipPath: 'polygon(25% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 25%)' }}
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="px-6 py-6 space-y-6">
            <div
              className="px-5 py-4 bg-[rgba(var(--color-accent-secondary-rgb),0.05)] border border-[rgba(var(--color-accent-secondary-rgb),0.2)]"
              style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-accent-secondary opacity-70 mb-1 font-mono">
                {'>'} TARGET: {t('dialog.list_label')}
              </p>
              <p className="text-[var(--color-text-primary)] font-mono font-bold text-sm leading-tight">
                {list.name}
              </p>
              {list.description && (
                <p className="text-[var(--color-text-muted)] text-xs mt-2 font-mono opacity-80">
                  {list.description}
                </p>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-2 font-mono">
                {'>'} {t('dialog.invite_link_label')}
              </label>
              <p className="text-[var(--color-text-muted)] text-xs font-mono mb-3 opacity-80">
                {t('dialog.invite_help_text')}
              </p>
              <div className="flex flex-col gap-3">
                <div
                  className="w-full px-4 py-3 bg-[rgba(0,0,0,0.5)] border border-[rgba(var(--color-accent-secondary-rgb),0.3)] flex items-center overflow-x-auto"
                  style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
                >
                  <span className="text-sm font-mono text-[var(--color-text-primary)] whitespace-nowrap">
                    {inviteUrl}
                  </span>
                </div>

                <button
                  onClick={handleCopyCode}
                  className={`px-4 py-3 font-mono text-xs font-bold uppercase tracking-widest transition-all border flex justify-center items-center gap-2 ${copiedCode
                      ? 'bg-[rgba(var(--color-accent-primary-rgb),0.15)] border-accent-primary text-accent-primary shadow-[0_0_15px_rgba(var(--color-accent-primary-rgb),0.2)]'
                      : 'bg-[rgba(var(--color-accent-secondary-rgb),0.15)] border-[rgba(var(--color-accent-secondary-rgb),0.6)] text-accent-secondary hover:bg-[rgba(var(--color-accent-secondary-rgb),0.25)] hover:border-accent-secondary hover:shadow-[0_0_20px_rgba(var(--color-accent-secondary-rgb),0.35)]'
                    }`}
                  style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-4 h-4" /> {t('dialog.copied_button')}
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> {t('dialog.copy_button')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="px-6 pb-6 mt-2">
            <button
              onClick={onClose}
              className="w-full px-4 py-3 bg-transparent hover:bg-[rgba(var(--color-accent-secondary-rgb),0.1)] text-[var(--color-text-primary)] font-mono text-xs font-bold uppercase tracking-widest transition-all border border-[rgba(var(--color-accent-secondary-rgb),0.4)] hover:border-[rgba(var(--color-accent-secondary-rgb),0.8)] hover:text-accent-secondary"
              style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
            >
              {t('dialog.close_button')}
            </button>
          </div>
        </HudContainer>
      </div>
    </div>,
    document.body
  )
}