import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Heart, Loader2, RotateCcw, Sparkles, Star, ThumbsDown } from 'lucide-react'
import { useTheme } from '@/features/shared'
import { useEnhanceComment, type EnhanceCommentContext } from '../hooks/useEnhanceComment'

export type QuickCritiqueReaction = 'like' | 'dislike'

const MAX_COMMENT_LEN = 2000

interface QuickCritiqueModalProps {
  isOpen: boolean
  itemTitle: string
  initialStars: number | null
  initialReaction: QuickCritiqueReaction | null
  initialComment: string
  /** Título, género y sinopsis para enriquecer la mejora con IA (oráculo / Groq). */
  enhanceContext?: EnhanceCommentContext
  saving: boolean
  onCancel: () => void
  /** comment vacío = no se envía fila en item_comments (solo rating + visto) */
  onConfirm: (stars: number, liked: boolean, comment: string) => void | Promise<void>
}

const clampStar = (n: number) => Math.min(5, Math.max(1, Math.round(n)))

export const QuickCritiqueModal: React.FC<QuickCritiqueModalProps> = ({
  isOpen,
  itemTitle,
  initialStars,
  initialReaction,
  initialComment,
  enhanceContext,
  saving,
  onCancel,
  onConfirm,
}) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const isRetro = theme === 'retro-cartoon'
  const isTerminal = theme === 'terminal'
  const isCyberpunk = theme === 'cyberpunk'

  const [stars, setStars] = useState(4)
  const [reaction, setReaction] = useState<QuickCritiqueReaction | null>(null)
  const [comment, setComment] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const [originalDraft, setOriginalDraft] = useState<string | null>(null)
  const [enhanceFeedback, setEnhanceFeedback] = useState<string | null>(null)
  const {
    enhanceComment,
    isEnhancing,
    error: enhanceError,
    resetError: resetEnhanceError,
  } = useEnhanceComment()

  useEffect(() => {
    if (!isOpen) return
    setStars(clampStar(initialStars ?? 4))
    setReaction(initialReaction)
    setComment(initialComment)
    setLocalError(null)
    setOriginalDraft(null)
    setEnhanceFeedback(null)
    resetEnhanceError()
  }, [isOpen, initialStars, initialReaction, initialComment, resetEnhanceError])

  if (!isOpen || typeof document === 'undefined') return null

  const canSubmit = reaction !== null && !saving
  const commentLen = comment.length
  const isCommentEmpty = comment.trim().length === 0
  const isBusyWithAi = saving || isEnhancing

  const handleEnhance = async () => {
    setLocalError(null)
    setEnhanceFeedback(null)
    resetEnhanceError()
    try {
      setOriginalDraft(comment)
      const enhanced = await enhanceComment(comment, enhanceContext)
      setComment(enhanced)
      setEnhanceFeedback(t('item.enhance_success_hint'))
    } catch {
      setOriginalDraft(null)
    }
  }

  const handleUndoEnhancement = () => {
    if (originalDraft === null) return
    setComment(originalDraft)
    setOriginalDraft(null)
    setEnhanceFeedback(null)
    setLocalError(null)
    resetEnhanceError()
  }

  const enhanceButtonClass = isRetro
    ? 'theme-heading-font flex items-center justify-center gap-2 rounded-xl border-[3px] border-black bg-[var(--color-bg-primary)] px-4 py-3 text-[11px] font-bold text-[var(--color-text-primary)] transition disabled:cursor-not-allowed disabled:opacity-60'
    : isTerminal
      ? 'theme-heading-font flex items-center justify-center gap-2 rounded-none border border-[rgba(0,255,65,0.45)] bg-[rgba(0,255,65,0.08)] px-4 py-3 text-[11px] font-bold text-[var(--color-accent-primary)] transition hover:border-[var(--color-accent-primary)] disabled:cursor-not-allowed disabled:opacity-60'
      : isCyberpunk
        ? 'theme-heading-font flex items-center justify-center gap-2 rounded-xl border border-[rgba(0,255,255,0.4)] bg-black/30 px-4 py-3 text-[11px] font-bold text-[var(--color-accent-secondary)] transition hover:border-[rgba(0,255,255,0.65)] hover:shadow-[0_0_12px_rgba(0,255,255,0.15)] disabled:cursor-not-allowed disabled:opacity-60'
        : 'theme-heading-font flex items-center justify-center gap-2 rounded-xl border border-[rgba(var(--color-accent-secondary-rgb),0.4)] bg-[rgba(var(--color-accent-secondary-rgb),0.12)] px-4 py-3 text-[11px] font-bold text-[var(--color-accent-secondary)] transition hover:border-[rgba(var(--color-accent-secondary-rgb),0.65)] hover:bg-[rgba(var(--color-accent-secondary-rgb),0.2)] disabled:cursor-not-allowed disabled:opacity-60'

  const undoButtonClass = isRetro
    ? 'theme-heading-font flex items-center justify-center gap-2 rounded-xl border-[3px] border-black bg-[var(--color-bg-primary)] px-4 py-3 text-[11px] font-bold text-black transition disabled:cursor-not-allowed disabled:opacity-60'
    : isTerminal
      ? 'theme-heading-font flex items-center justify-center gap-2 rounded-none border border-[rgba(0,255,65,0.35)] bg-transparent px-4 py-3 text-[11px] font-bold text-[var(--color-text-muted)] transition hover:border-[var(--color-accent-primary)] hover:text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-60'
      : isCyberpunk
        ? 'theme-heading-font flex items-center justify-center gap-2 rounded-xl border border-[rgba(255,0,255,0.35)] bg-transparent px-4 py-3 text-[11px] font-bold text-[var(--color-text-muted)] transition hover:border-[rgba(0,255,255,0.45)] hover:text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-60'
        : 'theme-heading-font flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-transparent px-4 py-3 text-[11px] font-bold text-[var(--color-text-muted)] transition hover:border-[rgba(var(--color-accent-primary-rgb),0.45)] hover:text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-60'

  const textareaClass = isRetro
    ? 'theme-heading-font mt-2 w-full resize-y rounded-lg border-[3px] border-black bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-black/25'
    : isTerminal
      ? 'theme-body-font mt-2 w-full resize-y rounded-none border border-[rgba(0,255,65,0.45)] bg-black/40 px-3 py-2 font-mono text-sm text-[var(--color-accent-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent-primary)] focus:outline-none'
      : isCyberpunk
        ? 'theme-body-font mt-2 w-full resize-y rounded-xl border border-[rgba(0,255,255,0.35)] bg-black/30 px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-accent-secondary)] focus:border-[var(--color-text-primary)] focus:outline-none focus:shadow-[0_0_12px_rgba(0,255,255,0.2)]'
        : 'theme-body-font mt-2 w-full resize-y rounded-lg border border-[rgba(var(--color-accent-primary-rgb),0.35)] bg-[var(--color-bg-elevated)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[rgba(var(--color-accent-primary-rgb),0.55)] focus:outline-none'

  const handleSubmit = () => {
    if (!canSubmit) return
    if (commentLen > MAX_COMMENT_LEN) {
      setLocalError(`Maximo ${MAX_COMMENT_LEN} caracteres`)
      return
    }
    setLocalError(null)
    void onConfirm(stars, reaction === 'like', comment.trim())
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
              className={`theme-heading-font flex h-11 w-11 items-center justify-center rounded-lg border-[3px] border-black transition-transform disabled:opacity-50 ${
                active
                  ? 'bg-amber-400 text-black shadow-[3px_3px_0px_0px_#000000]'
                  : 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] hover:scale-105'
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
              className={`theme-heading-font relative flex h-12 w-12 items-center justify-center rounded-xl border transition-all disabled:opacity-50 ${
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
            className={`theme-heading-font flex h-10 w-10 items-center justify-center rounded-lg border transition-colors disabled:opacity-50 ${
              active
                ? 'border-[var(--color-accent-primary)] bg-[rgba(var(--color-accent-primary-rgb),0.14)] text-[var(--color-accent-primary)] shadow-[0_0_14px_rgba(var(--color-accent-primary-rgb),0.25)]'
                : 'border-[rgba(var(--color-accent-primary-rgb),0.35)] text-[var(--color-text-muted)] hover:border-[rgba(var(--color-accent-primary-rgb),0.55)] hover:text-[var(--color-text-primary)]'
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
        className={`theme-heading-font flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-bold uppercase tracking-wide transition-all disabled:opacity-50 ${
          isRetro
            ? reaction === 'like'
              ? 'border-[3px] border-black bg-red-500 text-white shadow-[4px_4px_0px_0px_#000000]'
              : 'border-[3px] border-black bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-base)]'
            : isTerminal
              ? reaction === 'like'
                ? 'terminal-button theme-heading-font'
                : 'border border-[rgba(0,255,65,0.4)] bg-transparent text-[var(--color-text-muted)] hover:border-[var(--color-accent-primary)]'
              : isCyberpunk
                ? reaction === 'like'
                  ? 'cyberpunk-button theme-heading-font'
                  : 'cyberpunk-button cyberpunk-button--ghost theme-heading-font'
                : reaction === 'like'
                  ? 'border border-[rgba(var(--color-accent-secondary-rgb),0.5)] bg-[rgba(var(--color-accent-secondary-rgb),0.12)] text-[var(--color-accent-secondary)]'
                  : 'border border-[rgba(var(--color-accent-primary-rgb),0.28)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] hover:border-[rgba(var(--color-accent-primary-rgb),0.45)]'
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
        className={`theme-heading-font flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-bold uppercase tracking-wide transition-all disabled:opacity-50 ${
          isRetro
            ? reaction === 'dislike'
              ? 'border-[3px] border-black bg-amber-400 text-black shadow-[4px_4px_0px_0px_#000000]'
              : 'border-[3px] border-black bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-base)]'
            : isTerminal
              ? reaction === 'dislike'
                ? 'terminal-button terminal-button--danger theme-heading-font'
                : 'border border-[rgba(0,255,65,0.4)] bg-transparent text-[var(--color-text-muted)] hover:border-[#ff4444]'
              : isCyberpunk
                ? reaction === 'dislike'
                  ? 'border border-red-500/60 bg-red-950/40 text-red-200 shadow-[0_0_14px_rgba(255,0,80,0.25)]'
                  : 'cyberpunk-button cyberpunk-button--ghost theme-heading-font'
                : reaction === 'dislike'
                  ? 'border border-[rgba(var(--color-accent-secondary-rgb),0.45)] bg-[rgba(var(--color-accent-secondary-rgb),0.08)] text-[var(--color-text-primary)]'
                  : 'border border-[rgba(var(--color-accent-primary-rgb),0.28)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] hover:border-[rgba(var(--color-accent-secondary-rgb),0.4)]'
        }`}
        aria-pressed={reaction === 'dislike'}
      >
        <ThumbsDown className="h-5 w-5" aria-hidden />
        {isRetro ? 'NO ME GUSTA' : 'No me gusta'}
      </button>
    </div>
  )

  const primaryBtn = isRetro
    ? 'theme-heading-font flex w-full items-center justify-center rounded-xl border-[3px] border-black bg-[var(--color-bg-primary)] py-3 text-sm font-bold uppercase tracking-[0.14em] text-black shadow-[5px_5px_0px_0px_#000000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[4px_4px_0px_0px_#000000] active:translate-x-[5px] active:translate-y-[5px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-50'
    : isTerminal
      ? 'terminal-button theme-heading-font w-full py-3 disabled:opacity-50'
      : isCyberpunk
        ? 'cyberpunk-button theme-heading-font w-full py-3 disabled:opacity-50'
        : 'theme-heading-font w-full rounded-xl border border-[rgba(var(--color-accent-primary-rgb),0.5)] bg-[rgba(var(--color-accent-primary-rgb),0.14)] py-3 font-bold uppercase tracking-wide text-[var(--color-accent-primary)] transition hover:bg-[rgba(var(--color-accent-primary-rgb),0.22)] disabled:opacity-50'

  const backdropClass = 'fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm'

  const panelClass = isRetro
    ? 'retro-fx max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-xl border-[4px] border-black bg-[var(--color-bg-secondary)] p-6 text-[var(--color-text-primary)] shadow-[10px_10px_0px_0px_#000000]'
    : isTerminal
      ? 'terminal-surface terminal-panel max-h-[88vh] w-full max-w-lg overflow-y-auto p-6 text-[var(--color-text-primary)]'
      : isCyberpunk
        ? 'cyberpunk-surface max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl p-6 text-[var(--color-text-primary)]'
        : 'max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[rgba(var(--color-accent-primary-rgb),0.25)] bg-[var(--color-bg-secondary)] p-6 text-[var(--color-text-primary)] shadow-2xl'

  const sectionLabelClass =
    'text-center text-xs uppercase tracking-wider theme-heading-font text-[var(--color-text-muted)]'

  return createPortal(
    <div
      className={backdropClass}
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-critique-title"
      onClick={() => !saving && onCancel()}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && !saving) onCancel()
      }}
    >
      <div className={panelClass} onClick={(e) => e.stopPropagation()}>
        <h2
          id="quick-critique-title"
          className="theme-heading-font text-center text-lg font-black uppercase text-[var(--color-text-primary)] md:text-xl"
        >
          {isRetro ? 'CRITICA Y COMENTARIO' : 'Crítica y comentario'}
        </h2>
        <p className="theme-heading-font mt-2 text-center text-sm text-[var(--color-text-muted)]">{itemTitle}</p>

        <p className={`theme-heading-font mt-4 ${sectionLabelClass}`}>
          {isRetro ? 'TU PUNTUACION' : 'Tu puntuación'}
        </p>
        <div className="mt-3">{starRow}</div>

        <p className={`theme-heading-font mt-6 ${sectionLabelClass}`}>
          {isRetro ? 'REACCION' : 'Reacción'}
        </p>
        {reactionRow}

        <label className={`theme-heading-font mt-6 block ${sectionLabelClass}`} htmlFor="quick-critique-comment">
          {isRetro ? 'TU COMENTARIO (OPCIONAL)' : 'Tu comentario (opcional)'}
        </label>
        <textarea
          id="quick-critique-comment"
          rows={4}
          maxLength={MAX_COMMENT_LEN}
          disabled={saving}
          value={comment}
          onChange={(e) => {
            setComment(e.target.value)
            setLocalError(null)
            if (originalDraft !== null) setOriginalDraft(null)
            if (enhanceFeedback) setEnhanceFeedback(null)
            if (enhanceError) resetEnhanceError()
          }}
          placeholder={isRetro ? 'Escribe aqui si quieres ampliar...' : 'Escribe aquí si quieres ampliar tu crítica…'}
          className={textareaClass}
        />
        <div
          className={`mt-1 flex justify-between text-[10px] sm:text-xs ${isRetro ? 'theme-heading-font' : ''}`}
        >
          <span
            className={
              commentLen > MAX_COMMENT_LEN
                ? isRetro
                  ? 'font-bold text-red-700'
                  : 'text-[var(--color-accent-secondary)]'
                : 'text-[var(--color-text-muted)]'
            }
          >
            {commentLen}/{MAX_COMMENT_LEN}
          </span>
        </div>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              void handleEnhance()
            }}
            disabled={isBusyWithAi || isCommentEmpty}
            className={enhanceButtonClass}
          >
            {isEnhancing ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            {isEnhancing ? t('item.enhancing_ai') : t('item.enhance_with_ai')}
          </button>
          {originalDraft !== null && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleUndoEnhancement()
              }}
              disabled={isBusyWithAi}
              className={undoButtonClass}
            >
              <RotateCcw className="h-4 w-4 shrink-0" aria-hidden="true" />
              {t('item.undo_enhancement')}
            </button>
          )}
        </div>

        {enhanceFeedback && (
          <p className="theme-heading-font mt-2 text-center text-xs font-medium text-[var(--color-accent-primary)]">
            {enhanceFeedback}
          </p>
        )}
        {(localError || enhanceError) && (
          <p
            className={`mt-2 text-center text-xs font-medium ${
              isRetro ? 'font-bold text-red-700' : 'text-[var(--color-accent-secondary)]'
            }`}
          >
            {localError || enhanceError}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-3">
          <button type="button" disabled={!canSubmit} className={primaryBtn} onClick={handleSubmit}>
            {saving ? (isRetro ? 'GUARDANDO...' : 'Guardando...') : isRetro ? 'CONFIRMAR Y GUARDAR' : 'Confirmar y guardar'}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={onCancel}
            className={`theme-heading-font text-sm font-bold uppercase underline decoration-2 disabled:opacity-50 ${
              isRetro
                ? 'text-[var(--color-text-primary)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            {isRetro ? 'CANCELAR' : 'Cancelar'}
          </button>
        </div>

        {isRetro && (
          <p className="theme-heading-font mt-4 text-center text-[10px] uppercase text-[var(--color-text-muted)]">
            Guardamos visto, estrellas, reaccion y reseña junto
          </p>
        )}
      </div>
    </div>,
    document.body,
  )
}

export default QuickCritiqueModal
