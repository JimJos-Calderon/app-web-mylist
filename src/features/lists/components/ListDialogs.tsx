import React, { useEffect, useState } from 'react'
import * as ReactDOM from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Check, Copy, Plus, Users, X } from 'lucide-react'

import { HudContainer, TechLabel, type List } from '@/features/shared'
import { useTheme } from '@/features/shared/hooks/useTheme'

interface CreateListDialogProps {
  open: boolean
  onClose: () => void
  onCreate: (name: string, description?: string) => Promise<List | null>
  onCreated: (list: List) => void
}

interface InviteDialogProps {
  open: boolean
  onClose: () => void
  list: List
}

export const CreateListDialog: React.FC<CreateListDialogProps> = ({
  open,
  onClose,
  onCreate,
  onCreated,
}) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const isRetroCartoon = theme === 'retro-cartoon'
  const isTerminal = theme === 'terminal'
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  const overlayClassName = isRetroCartoon
    ? 'absolute inset-0 bg-black/60'
    : isTerminal
      ? 'absolute inset-0 bg-black/85 backdrop-blur-sm animate-in fade-in duration-75'
      : 'absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-200'

  const panelClassName = isRetroCartoon
    ? 'relative z-10 w-full max-w-md overflow-hidden rounded-xl border-[4px] border-black bg-[#f6eddc] p-6 text-black shadow-[10px_10px_0px_0px_#000000] sm:p-8'
    : isTerminal
      ? 'relative w-full max-w-md animate-in zoom-in-95 duration-75'
      : 'relative w-full max-w-md animate-in zoom-in-95 duration-200'

  const retroPaperCardClassName =
    'rounded-xl border-[3px] border-black bg-[#f6eddc] shadow-[5px_5px_0px_0px_#000000]'

  const retroButtonBaseClassName =
    'rounded-md border-[3px] border-black bg-[#f6eddc] text-black shadow-[4px_4px_0px_0px_#000000] transition-all'

  const inputClassName = isRetroCartoon
    ? 'theme-heading-font w-full px-4 py-3 bg-white text-black border-[3px] border-black shadow-[inset_3px_3px_0px_0px_rgba(0,0,0,0.1)] focus-visible:shadow-[inset_3px_3px_0px_0px_rgba(0,0,0,0.2)] focus-visible:outline-none rounded-md transition-all font-bold placeholder-gray-500'
    : isTerminal
      ? 'terminal-control theme-body-font w-full px-4 py-3 rounded-none text-[var(--color-text-primary)] text-xl transition-all font-medium disabled:opacity-50'
      : 'w-full px-4 py-3 bg-[rgba(var(--color-bg-base-rgb),0.8)] border border-[rgba(var(--color-accent-primary-rgb),0.3)] rounded-xl text-[var(--color-text-primary)] text-xl placeholder-[var(--color-text-muted)] focus-visible:border-accent-primary focus-visible:ring-2 focus-visible:ring-[rgba(var(--color-accent-primary-rgb),0.2)] transition-all font-medium disabled:opacity-50'

  const primaryButtonClassName = isRetroCartoon
    ? 'bg-white text-black border-[3px] border-black shadow-[4px_4px_0px_0px_#000000] rounded-md font-bold hover:-translate-y-[1px] hover:shadow-[5px_5px_0px_0px_#000000] active:translate-y-0 active:shadow-none transition-all'
    : isTerminal
      ? 'terminal-button theme-heading-font flex-1 px-4 py-3 rounded-none text-xs font-bold uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2'
      : 'flex-1 px-4 py-3 bg-[rgba(var(--color-accent-primary-rgb),0.15)] hover:bg-[rgba(var(--color-accent-primary-rgb),0.25)] text-accent-primary font-mono text-xs font-bold uppercase tracking-widest transition-all border border-[rgba(var(--color-accent-primary-rgb),0.6)] hover:border-[rgba(var(--color-accent-primary-rgb),1)] hover:shadow-[0_0_20px_rgba(var(--color-accent-primary-rgb),0.35)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2'

  const secondaryButtonClassName = isRetroCartoon
    ? 'bg-transparent text-black border-[3px] border-transparent hover:border-black hover:shadow-[4px_4px_0px_0px_#000000] rounded-md font-bold transition-all'
    : isTerminal
      ? 'terminal-button theme-heading-font flex-1 px-4 py-3 rounded-none text-xs font-bold uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed'
      : 'flex-1 px-4 py-3 bg-transparent hover:bg-[rgba(var(--color-accent-secondary-rgb),0.08)] text-[var(--color-text-primary)] font-mono text-xs font-bold uppercase tracking-widest transition-all border border-[rgba(var(--color-accent-secondary-rgb),0.2)] hover:border-[rgba(var(--color-accent-secondary-rgb),0.5)] disabled:opacity-40 disabled:cursor-not-allowed'

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!name.trim()) {
      setError(t('dialog.create_list_name_required', { defaultValue: 'El nombre de la lista es obligatorio' }))
      return
    }

    setLoading(true)
    setError(null)

    try {
      const createdList = await onCreate(name.trim(), description.trim() || undefined)
      if (createdList) {
        onCreated(createdList)
        onClose()
      } else {
        setError(t('dialog.create_list_failed', { defaultValue: 'No se pudo crear la lista' }))
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t('dialog.create_list_failed', { defaultValue: 'No se pudo crear la lista' })
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const content = (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4" role="dialog" aria-modal="true" aria-labelledby="create-list-dialog-title">
      <div className={overlayClassName} onClick={onClose} />

      <div className={panelClassName} onClick={(e) => e.stopPropagation()}>
        {isRetroCartoon ? (
          <>
            <div className="flex items-center justify-between border-b-4 border-black px-6 py-5 sm:px-8 sm:py-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center border-[3px] border-black bg-[#f6eddc] shadow-[4px_4px_0px_0px_#000000]">
                  <Plus className="h-6 w-6 text-black" strokeWidth={2.5} />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="theme-heading-font text-[10px] font-black uppercase tracking-[0.2em] text-black">
                    {'>'} SYS.NEW_LIST
                  </span>
                  <h2
                    id="create-list-dialog-title"
                    className="theme-heading-font text-lg font-black uppercase tracking-[0.1em] text-black leading-none"
                  >
                    {t('dialog.create_list_title', { defaultValue: 'Crear Nueva Lista' })}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label={t('dialog.close_button', { defaultValue: 'Cerrar' })}
                className={`${retroButtonBaseClassName} flex h-10 w-10 items-center justify-center p-0 hover:-translate-y-[1px] hover:shadow-[5px_5px_0px_0px_#000000] active:translate-y-0 active:shadow-none`}
              >
                <X className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6 sm:px-8">
              <div className={`${retroPaperCardClassName} px-5 py-4`}>
                <p className="theme-heading-font mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-black">
                  {'>'} {t('dialog.create_list_hint', { defaultValue: 'Define tu nueva lista' })}
                </p>
                <p className="theme-heading-font text-sm font-medium leading-relaxed text-black opacity-90">
                  {t('dialog.create_list_description', { defaultValue: 'Ponle un nombre y una descripción opcional.' })}
                </p>
              </div>

              <div>
                <label className="theme-heading-font mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-black">
                  {'>'} {t('dialog.list_name_label', { defaultValue: 'Nombre de la lista' })}
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('dialog.list_name_placeholder', { defaultValue: 'Mi lista de favoritos' })}
                  className={inputClassName}
                  maxLength={40}
                  autoFocus
                />
              </div>

              <div>
                <label className="theme-heading-font mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-black">
                  {'>'} {t('dialog.list_description_label', { defaultValue: 'Descripción' })}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('dialog.list_description_placeholder', { defaultValue: 'Una breve descripción opcional' })}
                  className={`${inputClassName} min-h-[120px] resize-none`}
                  maxLength={150}
                />
              </div>

              {error && (
                <div className="theme-heading-font rounded-md border-[3px] border-black bg-white px-4 py-3 text-sm font-bold text-black shadow-[4px_4px_0px_0px_#000000]">
                  {error}
                </div>
              )}

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className={`${secondaryButtonClassName} flex-1 px-4 py-3`}
                >
                  {t('dialog.cancel_button', { defaultValue: 'Cancelar' })}
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className={`${primaryButtonClassName} flex-1 px-4 py-3`}
                >
                  {loading ? t('dialog.creating_button', { defaultValue: 'Creando...' }) : t('dialog.next_button', { defaultValue: 'Siguiente' })}
                </button>
              </div>
            </form>
          </>
        ) : (
          <HudContainer className={isTerminal ? 'terminal-panel rounded-none p-0 border-[rgba(var(--color-accent-primary-rgb),0.8)] shadow-[0_0_20px_var(--color-glow)] bg-[rgba(0,0,0,0.92)]' : 'p-0 border-[rgba(var(--color-accent-primary-rgb),0.5)] shadow-[0_0_40px_rgba(var(--color-accent-primary-rgb),0.15)] bg-[rgba(0,0,0,0.6)]'}>
            <div className="px-6 py-5 border-b border-[rgba(var(--color-accent-primary-rgb),0.2)] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 bg-[rgba(var(--color-accent-primary-rgb),0.08)] border border-[rgba(var(--color-accent-primary-rgb),0.4)] flex items-center justify-center shrink-0 ${isTerminal ? 'rounded-none' : ''}`}
                  style={isTerminal ? undefined : { clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                >
                  <Plus className="w-5 h-5 text-accent-primary drop-shadow-[0_0_8px_rgba(var(--color-accent-primary-rgb),0.6)]" />
                </div>
                <div className="flex flex-col gap-1">
                  <TechLabel text="SYS.NEW_LIST" tone="primary" blink />
                  <h2 id="create-list-dialog-title" className={`text-lg font-black uppercase tracking-[0.1em] text-[var(--color-text-primary)] leading-none ${isTerminal ? 'theme-heading-font' : 'font-mono'}`}>
                    {t('dialog.create_list_title', { defaultValue: 'Crear Nueva Lista' })}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={t('dialog.close_button', { defaultValue: 'Cerrar' })}
                className={isTerminal ? 'terminal-button theme-heading-font w-8 h-8 flex items-center justify-center rounded-none' : 'w-8 h-8 flex items-center justify-center text-[var(--color-text-muted)] hover:text-accent-primary hover:bg-[rgba(var(--color-accent-primary-rgb),0.1)] transition-all'}
                style={isTerminal ? undefined : { clipPath: 'polygon(25% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 25%)' }}
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
              <div
                className={isTerminal ? 'terminal-panel rounded-none px-5 py-4' : 'px-5 py-4 bg-[rgba(var(--color-accent-primary-rgb),0.05)] border border-[rgba(var(--color-accent-primary-rgb),0.2)]'}
                style={isTerminal ? undefined : { clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
              >
                <p className={`text-[10px] font-bold uppercase tracking-widest text-accent-primary opacity-70 mb-1 ${isTerminal ? 'theme-heading-font' : 'font-mono'}`}>
                  {'>'} {t('dialog.create_list_hint', { defaultValue: 'Define tu nueva lista' })}
                </p>
                <p className={`text-[var(--color-text-primary)] font-bold text-sm leading-tight ${isTerminal ? 'theme-body-font' : 'font-mono'}`}>
                  {t('dialog.create_list_description', { defaultValue: 'Ponle un nombre y una descripción opcional.' })}
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-2 font-mono">
                  {'>'} {t('dialog.list_name_label', { defaultValue: 'Nombre de la lista' })}
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('dialog.list_name_placeholder', { defaultValue: 'Mi lista de favoritos' })}
                  className={inputClassName}
                  maxLength={40}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-2 font-mono">
                  {'>'} {t('dialog.list_description_label', { defaultValue: 'Descripción' })}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('dialog.list_description_placeholder', { defaultValue: 'Una breve descripción opcional' })}
                  className={`${inputClassName} min-h-[120px] resize-none`}
                  maxLength={150}
                />
              </div>

              {error && (
                <div className={isTerminal ? 'border border-[rgba(255,0,0,0.8)] bg-[rgba(20,0,0,0.9)] text-[#ff4d4d] px-4 py-2 rounded-none text-sm theme-body-font' : 'bg-[rgba(var(--color-accent-secondary-rgb),0.1)] border border-[rgba(var(--color-accent-secondary-rgb),0.3)] text-accent-secondary px-4 py-2 rounded text-sm font-mono'}>
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose} className={`${secondaryButtonClassName} flex-1 px-4 py-3`}>
                  {t('dialog.cancel_button', { defaultValue: 'Cancelar' })}
                </button>
                <button type="submit" disabled={loading} className={`${primaryButtonClassName} flex-1 px-4 py-3`}>
                  {loading ? t('dialog.creating_button', { defaultValue: 'Creando...' }) : t('dialog.next_button', { defaultValue: 'Siguiente' })}
                </button>
              </div>
            </form>
          </HudContainer>
        )}
      </div>
    </div>
  )

  return ReactDOM.createPortal(content, document.body)
}

export const InviteDialog: React.FC<InviteDialogProps> = ({ open, onClose, list }) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const isRetroCartoon = theme === 'retro-cartoon'
  const isTerminal = theme === 'terminal'
  const [copiedCode, setCopiedCode] = useState(false)

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  const inviteUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/join/${list.invite_code}`
    : `/join/${list.invite_code}`

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteUrl)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  if (!open) return null

  const overlayClassName = isRetroCartoon
    ? 'absolute inset-0 bg-black/60'
    : isTerminal
      ? 'absolute inset-0 bg-black/85 backdrop-blur-sm animate-in fade-in duration-75'
      : 'absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-200'

  const panelClassName = isRetroCartoon
    ? 'relative z-10 w-full max-w-md overflow-hidden rounded-xl border-[4px] border-black bg-[#f6eddc] p-6 text-black shadow-[10px_10px_0px_0px_#000000] sm:p-8'
    : isTerminal
      ? 'relative w-full max-w-md animate-in zoom-in-95 duration-75'
      : 'relative w-full max-w-md animate-in zoom-in-95 duration-200'

  const retroPaperCardClassName =
    'rounded-xl border-[3px] border-black bg-[#f6eddc] shadow-[5px_5px_0px_0px_#000000]'

  const retroButtonBaseClassName =
    'rounded-md border-[3px] border-black bg-[#f6eddc] text-black shadow-[4px_4px_0px_0px_#000000] transition-all'

  const content = (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4" role="dialog" aria-modal="true" aria-labelledby="invite-dialog-title">
      <div className={overlayClassName} onClick={onClose} />

      <div className={panelClassName} onClick={(e) => e.stopPropagation()}>
        {isRetroCartoon ? (
          <>
            <div className="flex items-center justify-between border-b-4 border-black px-6 py-5 sm:px-8 sm:py-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center border-[3px] border-black bg-[#f6eddc] shadow-[4px_4px_0px_0px_#000000]">
                  <Users className="h-6 w-6 text-black" strokeWidth={2.5} />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-black">
                    {'>'} SYS.INVITE_REQ
                  </span>
                  <h2
                    id="invite-dialog-title"
                    className="theme-heading-font text-lg font-black uppercase tracking-[0.1em] text-black leading-none"
                  >
                    {t('dialog.invite_title')}
                  </h2>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label={t('dialog.close_button')}
                className={`${retroButtonBaseClassName} flex h-10 w-10 items-center justify-center p-0 hover:-translate-y-[1px] hover:shadow-[5px_5px_0px_0px_#000000] active:translate-y-0 active:shadow-none`}
              >
                <X className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-6 px-6 py-6 sm:px-8">
              <div className={`${retroPaperCardClassName} px-5 py-4`}>
                <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-black">
                  {'>'} TARGET: {t('dialog.list_label')}
                </p>
                <p
                  className="theme-heading-font text-sm font-black leading-tight text-black"
                >
                  {list.name}
                </p>
                {list.description && (
                  <p className="mt-2 text-xs font-medium leading-relaxed text-black opacity-90">
                    {list.description}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-black">
                  {'>'} {t('dialog.invite_link_label')}
                </label>
                <p className="mb-3 text-xs font-medium leading-relaxed text-black opacity-90">
                  {t('dialog.invite_help_text')}
                </p>
                <div className="flex flex-col gap-3">
                  <div className={`${retroPaperCardClassName} flex items-center overflow-x-auto px-4 py-3`}>
                    <span className="whitespace-nowrap text-sm font-black text-black">
                      {inviteUrl}
                    </span>
                  </div>

                  <button
                    onClick={handleCopyCode}
                    className={`${retroButtonBaseClassName} flex items-center justify-center gap-2 px-4 py-3 font-black uppercase tracking-widest hover:-translate-y-[1px] hover:shadow-[5px_5px_0px_0px_#000000] active:translate-y-0 active:shadow-none ${copiedCode ? 'bg-white text-black' : 'bg-[#f6eddc] text-black'}`}
                  >
                    {copiedCode ? (
                      <>
                        <Check className="h-4 w-4" strokeWidth={2.5} /> {t('dialog.copied_button')}
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" strokeWidth={2.5} /> {t('dialog.copy_button')}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 sm:px-8">
              <button
                onClick={onClose}
                className={`${retroButtonBaseClassName} flex w-full items-center justify-center gap-2 px-4 py-3 font-black uppercase tracking-widest hover:-translate-y-[1px] hover:shadow-[5px_5px_0px_0px_#000000] active:translate-y-0 active:shadow-none`}
              >
                <X className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
                {t('dialog.close_button')}
              </button>
            </div>
          </>
        ) : (
          <HudContainer className={isTerminal ? 'terminal-panel rounded-none p-0 border-[rgba(var(--color-accent-primary-rgb),0.8)] shadow-[0_0_20px_var(--color-glow)] bg-[rgba(0,0,0,0.92)]' : 'p-0 border-[rgba(var(--color-accent-secondary-rgb),0.5)] shadow-[0_0_40px_rgba(var(--color-accent-secondary-rgb),0.15)] bg-[rgba(0,0,0,0.6)]'}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-[rgba(var(--color-accent-secondary-rgb),0.2)]">
              <div className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 bg-[rgba(var(--color-accent-secondary-rgb),0.08)] border border-[rgba(var(--color-accent-secondary-rgb),0.4)] flex items-center justify-center shrink-0 ${isTerminal ? 'rounded-none' : ''}`}
                  style={isTerminal ? undefined : { clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                >
                  <Users className="w-5 h-5 text-accent-secondary drop-shadow-[0_0_8px_rgba(var(--color-accent-secondary-rgb),0.6)]" />
                </div>
                <div className="flex flex-col gap-1">
                  <TechLabel text="SYS.INVITE_REQ" tone="secondary" blink />
                  <h2 id="invite-dialog-title" className={`text-lg font-black uppercase tracking-[0.1em] text-[var(--color-text-primary)] leading-none ${isTerminal ? 'theme-heading-font' : 'font-mono'}`}>
                    {t('dialog.invite_title')}
                  </h2>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label={t('dialog.close_button')}
                className={isTerminal ? 'terminal-button theme-heading-font w-8 h-8 flex items-center justify-center rounded-none' : 'w-8 h-8 flex items-center justify-center text-[var(--color-text-muted)] hover:text-accent-secondary hover:bg-[rgba(var(--color-accent-secondary-rgb),0.1)] transition-all'}
                style={isTerminal ? undefined : { clipPath: 'polygon(25% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 25%)' }}
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="px-6 py-6 space-y-6">
              <div
                className={isTerminal ? 'terminal-panel rounded-none px-5 py-4' : 'px-5 py-4 bg-[rgba(var(--color-accent-secondary-rgb),0.05)] border border-[rgba(var(--color-accent-secondary-rgb),0.2)]'}
                style={isTerminal ? undefined : { clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
              >
                <p className={`text-[10px] font-bold uppercase tracking-widest text-accent-secondary opacity-70 mb-1 ${isTerminal ? 'theme-heading-font' : 'font-mono'}`}>
                  {'>'} TARGET: {t('dialog.list_label')}
                </p>
                <p className={`text-[var(--color-text-primary)] font-bold text-sm leading-tight ${isTerminal ? 'theme-body-font' : 'font-mono'}`}>
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
                    className={isTerminal ? 'terminal-control theme-body-font w-full px-4 py-3 rounded-none flex items-center overflow-x-auto' : 'w-full px-4 py-3 bg-[rgba(0,0,0,0.5)] border border-[rgba(var(--color-accent-secondary-rgb),0.3)] flex items-center overflow-x-auto'}
                    style={isTerminal ? undefined : { clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
                  >
                    <span className={`text-sm whitespace-nowrap ${isTerminal ? 'theme-body-font text-[var(--color-text-primary)]' : 'font-mono text-[var(--color-text-primary)]'}`}>
                      {inviteUrl}
                    </span>
                  </div>

                  <button
                    onClick={handleCopyCode}
                    className={`px-4 py-3 text-xs font-bold uppercase tracking-widest transition-all border flex justify-center items-center gap-2 ${
                      isTerminal
                        ? 'terminal-button theme-heading-font rounded-none'
                        : copiedCode
                          ? 'bg-[rgba(var(--color-accent-primary-rgb),0.15)] border-accent-primary text-accent-primary shadow-[0_0_15px_rgba(var(--color-accent-primary-rgb),0.2)] font-mono'
                          : 'bg-[rgba(var(--color-accent-secondary-rgb),0.15)] border-[rgba(var(--color-accent-secondary-rgb),0.6)] text-accent-secondary hover:bg-[rgba(var(--color-accent-secondary-rgb),0.25)] hover:border-accent-secondary hover:shadow-[0_0_20px_rgba(var(--color-accent-secondary-rgb),0.35)] font-mono'
                      }`}
                    style={isTerminal ? undefined : { clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
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
                className={isTerminal ? 'terminal-button theme-heading-font w-full px-4 py-3 rounded-none text-xs font-bold uppercase tracking-widest' : 'w-full px-4 py-3 bg-transparent hover:bg-[rgba(var(--color-accent-secondary-rgb),0.1)] text-[var(--color-text-primary)] font-mono text-xs font-bold uppercase tracking-widest transition-all border border-[rgba(var(--color-accent-secondary-rgb),0.4)] hover:border-[rgba(var(--color-accent-secondary-rgb),0.8)] hover:text-accent-secondary'}
                style={isTerminal ? undefined : { clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
              >
                {t('dialog.close_button')}
              </button>
            </div>
          </HudContainer>
        )}
      </div>
    </div>
  )

  return ReactDOM.createPortal(content, document.body)
}

