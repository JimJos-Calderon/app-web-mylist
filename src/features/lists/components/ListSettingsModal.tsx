import React, { useEffect, useState } from 'react'
import * as ReactDOM from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { Settings, X } from 'lucide-react'

import { HudContainer, TechLabel, type List } from '@/features/shared'
import { useTheme } from '@/features/shared/hooks/useTheme'
import { supabase } from '@/supabaseClient'
import { queryKeys } from '@config/queryKeys'

export interface ListSettingsModalProps {
  open: boolean
  onClose: () => void
  list: List
  userId: string
}

const ListSettingsModal: React.FC<ListSettingsModalProps> = ({ open, onClose, list, userId }) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const queryClient = useQueryClient()
  const isRetroCartoon = theme === 'retro-cartoon'
  const isTerminal = theme === 'terminal'
  const isOwner = list.owner_id === userId

  const [webhookUrl, setWebhookUrl] = useState('')
  const [listTheme, setListTheme] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savedOk, setSavedOk] = useState(false)

  useEffect(() => {
    if (!open || !isOwner) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose, isOwner])

  useEffect(() => {
    if (!open || !isOwner) return

    let cancelled = false
    setLoadError(null)
    setSavedOk(false)
    setSaveError(null)

    const load = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('lists')
          .select('discord_webhook_url, theme')
          .eq('id', list.id)
          .single()

        if (cancelled) return
        if (error) {
          setLoadError(error.message)
          setWebhookUrl('')
          setListTheme('')
          return
        }
        setWebhookUrl(typeof data?.discord_webhook_url === 'string' ? data.discord_webhook_url : '')
        const th = data?.theme
        setListTheme(typeof th === 'string' && th.trim() ? th.trim() : '')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [open, list.id, isOwner])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isOwner) return

    setSaveError(null)
    setSavedOk(false)
    setLoading(true)

    try {
      const trimmed = webhookUrl.trim()
      const themeValue = listTheme.trim()
      const { error } = await supabase
        .from('lists')
        .update({
          discord_webhook_url: trimmed.length > 0 ? trimmed : null,
          theme: themeValue.length > 0 ? themeValue : null,
        })
        .eq('id', list.id)

      if (error) throw error

      setSavedOk(true)
      await queryClient.invalidateQueries({ queryKey: queryKeys.lists.byUser(userId) })
      setTimeout(() => setSavedOk(false), 2500)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : t('dialog.list_settings_save_error'))
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  const overlayClassName = isRetroCartoon
    ? 'absolute inset-0 bg-black/60'
    : isTerminal
      ? 'absolute inset-0 bg-black/85 backdrop-blur-sm animate-in fade-in duration-75'
      : 'absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-200'

  const panelClassName = isRetroCartoon
    ? 'relative z-10 w-full max-w-lg overflow-hidden rounded-xl border-[4px] border-black bg-[#f6eddc] p-6 text-black shadow-[10px_10px_0px_0px_#000000] sm:p-8'
    : isTerminal
      ? 'relative w-full max-w-lg animate-in zoom-in-95 duration-75'
      : 'relative w-full max-w-lg animate-in zoom-in-95 duration-200'

  const content = (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="list-settings-title"
    >
      <div className={overlayClassName} onClick={onClose} />

      <div className={panelClassName} onClick={(e) => e.stopPropagation()}>
        {!isOwner ? (
          <p className="px-4 py-6 text-sm text-[var(--color-text-muted)] font-mono">
            {t('dialog.list_settings_owner_only')}
          </p>
        ) : isRetroCartoon ? (
          <form onSubmit={handleSave} className="space-y-5">
            <div className="flex items-center justify-between border-b-4 border-black pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center border-[3px] border-black bg-[#f6eddc] shadow-[4px_4px_0px_0px_#000000]">
                  <Settings className="h-5 w-5 text-black" strokeWidth={2.5} />
                </div>
                <div>
                  <span className="theme-heading-font text-[10px] font-black uppercase tracking-[0.2em] text-black">
                    {'>'} SYS.LIST_CFG
                  </span>
                  <h2 id="list-settings-title" className="theme-heading-font text-lg font-black uppercase text-black">
                    {t('dialog.list_settings_title')}
                  </h2>
                  <p className="theme-heading-font text-xs font-bold text-black/80 mt-1">{list.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={t('dialog.close_button')}
                className="rounded-md border-[3px] border-black bg-[#f6eddc] p-2 shadow-[4px_4px_0px_0px_#000000]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div>
              <label className="theme-heading-font mb-2 block text-[10px] font-black uppercase text-black">
                {t('dialog.list_settings_webhook_label')}
              </label>
              <p className="theme-heading-font text-xs text-black/85 mb-2 leading-relaxed">
                {t('dialog.list_settings_webhook_help')}
              </p>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://discord.com/api/webhooks/…"
                className="theme-heading-font w-full px-4 py-3 bg-white text-black border-[3px] border-black shadow-[inset_3px_3px_0px_0px_rgba(0,0,0,0.1)] rounded-md font-bold"
                autoComplete="off"
                disabled={loading}
              />
            </div>

            <div>
              <label className="theme-heading-font mb-2 block text-[10px] font-black uppercase text-black">
                {t('dialog.list_settings_theme_label')}
              </label>
              <p className="theme-heading-font text-xs text-black/85 mb-2 leading-relaxed">
                {t('dialog.list_settings_theme_help')}
              </p>
              <select
                value={listTheme}
                onChange={(e) => setListTheme(e.target.value)}
                className="theme-heading-font w-full px-4 py-3 bg-white text-black border-[3px] border-black rounded-md font-bold"
                disabled={loading}
                aria-label={t('dialog.list_settings_theme_label')}
              >
                <option value="">{t('dialog.list_settings_theme_default')}</option>
                <option value="cyberpunk">{t('dialog.list_settings_theme_cyberpunk')}</option>
                <option value="terminal">{t('dialog.list_settings_theme_terminal')}</option>
                <option value="retro-cartoon">{t('dialog.list_settings_theme_retro')}</option>
              </select>
            </div>

            {loadError && (
              <div className="rounded-md border-[3px] border-black bg-white px-3 py-2 text-sm font-bold">{loadError}</div>
            )}
            {saveError && (
              <div className="rounded-md border-[3px] border-black bg-white px-3 py-2 text-sm font-bold">{saveError}</div>
            )}
            {savedOk && (
              <div className="rounded-md border-[3px] border-black bg-white px-3 py-2 text-sm font-bold">
                {t('dialog.list_settings_saved')}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="theme-heading-font flex-1 border-[3px] border-black py-3 font-black uppercase"
              >
                {t('dialog.cancel_button')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="theme-heading-font flex-1 border-[3px] border-black bg-white py-3 font-black uppercase shadow-[4px_4px_0px_0px_#000000] disabled:opacity-50"
              >
                {loading ? t('dialog.saving_button') : t('dialog.list_settings_save')}
              </button>
            </div>
          </form>
        ) : (
          <HudContainer
            className={
              isTerminal
                ? 'terminal-panel rounded-none p-0 border-[rgba(var(--color-accent-primary-rgb),0.8)]'
                : 'p-0 border-[rgba(var(--color-accent-primary-rgb),0.35)] bg-[rgba(0,0,0,0.65)]'
            }
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(var(--color-accent-primary-rgb),0.2)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center border border-[rgba(var(--color-accent-primary-rgb),0.4)] bg-[rgba(var(--color-accent-primary-rgb),0.08)]">
                  <Settings className="w-5 h-5 text-accent-primary" />
                </div>
                <div>
                  <TechLabel text="SYS.LIST_CFG" tone="primary" blink />
                  <h2 id="list-settings-title" className="text-lg font-black uppercase text-[var(--color-text-primary)] font-mono">
                    {t('dialog.list_settings_title')}
                  </h2>
                  <p className="text-xs text-[var(--color-text-muted)] font-mono mt-0.5">{list.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={t('dialog.close_button')}
                className="p-2 text-[var(--color-text-muted)] hover:text-accent-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-2 font-mono">
                  {t('dialog.list_settings_webhook_label')}
                </label>
                <p className="text-xs text-[var(--color-text-muted)] font-mono mb-3 leading-relaxed">
                  {t('dialog.list_settings_webhook_help')}
                </p>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://discord.com/api/webhooks/…"
                  className="w-full px-4 py-3 bg-[rgba(0,0,0,0.45)] border border-[rgba(var(--color-accent-primary-rgb),0.35)] rounded-lg text-[var(--color-text-primary)] font-mono text-sm placeholder:text-[var(--color-text-muted)] focus-visible:border-accent-primary focus-visible:ring-1 focus-visible:ring-accent-primary outline-none disabled:opacity-50"
                  autoComplete="off"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-2 font-mono">
                  {t('dialog.list_settings_theme_label')}
                </label>
                <p className="text-xs text-[var(--color-text-muted)] font-mono mb-3 leading-relaxed">
                  {t('dialog.list_settings_theme_help')}
                </p>
                <select
                  value={listTheme}
                  onChange={(e) => setListTheme(e.target.value)}
                  className="w-full px-4 py-3 bg-[rgba(0,0,0,0.45)] border border-[rgba(var(--color-accent-primary-rgb),0.35)] rounded-lg text-[var(--color-text-primary)] font-mono text-sm focus-visible:border-accent-primary outline-none disabled:opacity-50"
                  disabled={loading}
                  aria-label={t('dialog.list_settings_theme_label')}
                >
                  <option value="">{t('dialog.list_settings_theme_default')}</option>
                  <option value="cyberpunk">{t('dialog.list_settings_theme_cyberpunk')}</option>
                  <option value="terminal">{t('dialog.list_settings_theme_terminal')}</option>
                  <option value="retro-cartoon">{t('dialog.list_settings_theme_retro')}</option>
                </select>
              </div>

              {loadError && (
                <div className="text-sm text-accent-secondary font-mono border border-[rgba(var(--color-accent-secondary-rgb),0.4)] px-3 py-2 rounded">
                  {loadError}
                </div>
              )}
              {saveError && (
                <div className="text-sm text-accent-secondary font-mono border border-[rgba(var(--color-accent-secondary-rgb),0.4)] px-3 py-2 rounded">
                  {saveError}
                </div>
              )}
              {savedOk && (
                <div className="text-sm text-accent-primary font-mono border border-[rgba(var(--color-accent-primary-rgb),0.4)] px-3 py-2 rounded">
                  {t('dialog.list_settings_saved')}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border border-[rgba(var(--color-text-muted),0.35)] text-[var(--color-text-primary)] font-mono text-xs uppercase tracking-widest hover:bg-[rgba(var(--color-accent-primary-rgb),0.08)]"
                >
                  {t('dialog.cancel_button')}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-[rgba(var(--color-accent-primary-rgb),0.15)] border border-accent-primary text-accent-primary font-mono text-xs uppercase tracking-widest hover:bg-[rgba(var(--color-accent-primary-rgb),0.25)] disabled:opacity-50"
                >
                  {loading ? t('dialog.saving_button') : t('dialog.list_settings_save')}
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

export default ListSettingsModal
