import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Heart, Star, ThumbsDown } from 'lucide-react'
import { useTheme } from '@/features/shared'

export type QuickCritiqueReaction = 'like' | 'dislike'

interface QuickCritiqueModalProps {
  isOpen: boolean
  itemTitle: string
  initialStars: number | null
  initialReaction: QuickCritiqueReaction | null
  saving: boolean
  onCancel: () => void
  onConfirm: (stars: number, liked: boolean) => void
}

const clampStar = (n: number) => Math.min(5, Math.max(1, Math.round(n)))

export const QuickCritiqueModal: React.FC<QuickCritiqueModalProps> = ({
  isOpen,
  itemTitle,
  initialStars,
  initialReaction,
  saving,
  onCancel,
  onConfirm,
}) => {
  const { theme } = useTheme()
  const isRetro = theme === 'retro-cartoon'
  const isTerminal = theme === 'terminal'
  const isCyberpunk = theme === 'cyberpunk'

  const [stars, setStars] = useState(4)
  const [reaction, setReaction] = useState<QuickCritiqueReaction | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setStars(clampStar(initialStars ?? 4))
    setReaction(initialReaction)
  }, [isOpen, initialStars, initialReaction])

  if (!isOpen || typeof document === 'undefined') return null

  const canSubmit = reaction !== null && !saving

  const handleSubmit = () => {
    if (!canSubmit) return
    onConfirm(stars, reaction === 'like')
  }

  const starRow = (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3" role="group" aria-label="Estrellas">
      {[1, 2, 3, 4, 5].map((n) => {
        const active = n <= stars
        if (isRetro) {
          return (
            <button
              key={n}
              type="button"
              disabled={saving}
              onClick={() => setStars(n)}
              className={`flex h-11 w-11 items-center justify-center rounded-lg border-[3px] border-black transition-transform disabled:opacity-50 ${
                active ? 'bg-amber-400 text-black shadow-[3px_3px_0px_0px_#000000]' : 'bg-white text-black hover:scale-105'
              }`}
              aria-label={`${n} estrellas`}
            >
              <Star className="h-6 w-6" fill={active ? 'currentColor' : 'none'} strokeWidth={2.5} aria-hidden />
            </button>
          )
        }
        if (isTerminal) {
          return (
            <button
              key={n}
              type="button"
              disabled={saving}
              onClick={() => setStars(n)}
              className={`theme-heading-font min-w-[3rem] rounded-none border px-2 py-2 font-mono text-sm transition-colors disabled:opacity-50 ${
                active
                  ? 'border-[var(--color-accent-primary)] bg-[rgba(0,255,65,0.08)] text-[var(--color-accent-primary)]'
                  : 'border-[rgba(0,255,65,0.35)] text-[var(--color-text-muted)] hover:border-[var(--color-accent-primary)]'
              }`}
              aria-label={`${n} estrellas`}
            >
              {active ? '[ * ]' : '[   ]'}
            </button>
          )
        }
        if (isCyberpunk) {
          return (
            <button
              key={n}
              type="button"
              disabled={saving}
              onClick={() => setStars(n)}
              className={`relative flex h-12 w-12 items-center justify-center rounded-xl border transition-all disabled:opacity-50 ${
                active
                  ? 'cyberpunk-surface border-[var(--color-text-primary)] text-[var(--color-text-primary)] shadow-[0_0_18px_rgba(0,255,255,0.35)] animate-pulse'
                  : 'border-[rgba(255,0,255,0.35)] text-[var(--color-accent-secondary)] hover:shadow-[0_0_12px_rgba(255,0,255,0.25)]'
              }`}
              aria-label={`${n} estrellas`}
            >
              <Star className="h-7 w-7" fill={active ? 'currentColor' : 'none'} aria-hidden />
            </button>
          )
        }
        return (
          <button
            key={n}
            type="button"
            disabled={saving}
            onClick={() => setStars(n)}
            className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-colors disabled:opacity-50 ${
              active
                ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.35)]'
                : 'border-cyan-500/30 text-slate-400 hover:border-cyan-400/50'
            }`}
            aria-label={`${n} estrellas`}
          >
            <Star className="h-6 w-6" fill={active ? 'currentColor' : 'none'} aria-hidden />
          </button>
        )
      })}
    </div>
  )

  const reactionRow = (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
      <button
        type="button"
        disabled={saving}
        onClick={() => setReaction('like')}
        className={`flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-bold uppercase tracking-wide transition-all disabled:opacity-50 ${
          isRetro
            ? reaction === 'like'
              ? 'border-[3px] border-black bg-red-500 text-white shadow-[4px_4px_0px_0px_#000000]'
              : 'border-[3px] border-black bg-white text-black hover:bg-amber-100'
            : isTerminal
              ? reaction === 'like'
                ? 'terminal-button theme-heading-font'
                : 'border border-[rgba(0,255,65,0.4)] bg-transparent text-[var(--color-text-muted)] hover:border-[var(--color-accent-primary)]'
              : isCyberpunk
                ? reaction === 'like'
                  ? 'cyberpunk-button theme-heading-font'
                  : 'cyberpunk-button cyberpunk-button--ghost theme-heading-font'
                : reaction === 'like'
                  ? 'border border-pink-400/50 bg-pink-500/15 text-pink-200'
                  : 'border border-white/20 bg-white/5 text-slate-300 hover:border-pink-400/30'
        }`}
        aria-pressed={reaction === 'like'}
      >
        <Heart className="h-5 w-5" fill={reaction === 'like' ? 'currentColor' : 'none'} aria-hidden />
        {isRetro ? 'ME GUSTA' : 'Me gusta'}
      </button>
      <button
        type="button"
        disabled={saving}
        onClick={() => setReaction('dislike')}
        className={`flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-bold uppercase tracking-wide transition-all disabled:opacity-50 ${
          isRetro
            ? reaction === 'dislike'
              ? 'border-[3px] border-black bg-amber-400 text-black shadow-[4px_4px_0px_0px_#000000]'
              : 'border-[3px] border-black bg-white text-black hover:bg-amber-100'
            : isTerminal
              ? reaction === 'dislike'
                ? 'terminal-button terminal-button--danger theme-heading-font'
                : 'border border-[rgba(0,255,65,0.4)] bg-transparent text-[var(--color-text-muted)] hover:border-[#ff4444]'
              : isCyberpunk
                ? reaction === 'dislike'
                  ? 'border border-red-500/60 bg-red-950/40 text-red-200 shadow-[0_0_14px_rgba(255,0,80,0.25)]'
                  : 'cyberpunk-button cyberpunk-button--ghost theme-heading-font'
                : reaction === 'dislike'
                  ? 'border border-rose-500/50 bg-rose-500/10 text-rose-200'
                  : 'border border-white/20 bg-white/5 text-slate-300 hover:border-rose-400/30'
        }`}
        aria-pressed={reaction === 'dislike'}
      >
        <ThumbsDown className="h-5 w-5" aria-hidden />
        {isRetro ? 'NO ME GUSTA' : 'No me gusta'}
      </button>
    </div>
  )

  const primaryBtn = isRetro
    ? 'w-full border-[3px] border-black bg-lime-300 py-3 font-black uppercase tracking-wide text-black shadow-[5px_5px_0px_0px_#000000] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#000000] disabled:opacity-50'
    : isTerminal
      ? 'terminal-button theme-heading-font w-full py-3 disabled:opacity-50'
      : isCyberpunk
        ? 'cyberpunk-button theme-heading-font w-full py-3 disabled:opacity-50'
        : 'w-full rounded-xl border border-cyan-500/50 bg-cyan-500/15 py-3 font-mono font-bold uppercase tracking-wide text-cyan-300 hover:bg-cyan-500/25 disabled:opacity-50'

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-critique-title"
      onClick={() => !saving && onCancel()}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && !saving) onCancel()
      }}
    >
      <div
        className={`w-full max-w-md p-6 shadow-2xl ${
          isRetro
            ? 'rounded-xl border-[4px] border-black bg-[#FFF8E7]'
            : isTerminal
              ? 'terminal-surface terminal-panel rounded-md'
              : isCyberpunk
                ? 'cyberpunk-surface rounded-2xl border border-[rgba(0,255,255,0.2)]'
                : 'rounded-2xl border border-cyan-500/25 bg-[var(--color-bg-secondary)]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="quick-critique-title"
          className={`text-center text-lg font-black uppercase md:text-xl ${
            isRetro ? 'theme-heading-font text-black' : 'theme-heading-font text-[var(--color-text-primary)]'
          }`}
        >
          {isRetro ? 'CRITICA RAPIDA' : 'Crítica rápida'}
        </h2>
        <p
          className={`mt-2 text-center text-sm ${
            isRetro ? 'theme-heading-font text-black/80' : 'text-[var(--color-text-muted)]'
          }`}
        >
          {itemTitle}
        </p>

        <p
          className={`mt-4 text-center text-xs uppercase tracking-wider ${
            isRetro ? 'theme-heading-font text-black' : 'text-[var(--color-text-muted)]'
          }`}
        >
          {isRetro ? 'TU PUNTUACION' : 'Tu puntuación'}
        </p>
        <div className="mt-3">{starRow}</div>

        <p
          className={`mt-6 text-center text-xs uppercase tracking-wider ${
            isRetro ? 'theme-heading-font text-black' : 'text-[var(--color-text-muted)]'
          }`}
        >
          {isRetro ? 'REACCION' : 'Reacción'}
        </p>
        {reactionRow}

        <div className="mt-8 flex flex-col gap-3">
          <button type="button" disabled={!canSubmit} className={primaryBtn} onClick={handleSubmit}>
            {saving ? (isRetro ? 'GUARDANDO...' : 'Guardando...') : isRetro ? 'CONFIRMAR Y GUARDAR' : 'Confirmar y guardar'}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={onCancel}
            className={
              isRetro
                ? 'theme-heading-font text-sm font-bold uppercase text-black underline decoration-2 disabled:opacity-50'
                : 'text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-50'
            }
          >
            {isRetro ? 'CANCELAR' : 'Cancelar'}
          </button>
        </div>

        {isRetro && (
          <p className="theme-heading-font mt-4 text-center text-[10px] uppercase text-black/60">
            Las estrellas y la reaccion se guardan con el visto
          </p>
        )}
      </div>
    </div>,
    document.body,
  )
}

export default QuickCritiqueModal
