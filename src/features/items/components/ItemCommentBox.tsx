import React, { useEffect, useMemo, useState } from 'react'
import { Loader2, MessageSquare, RotateCcw, Save, Sparkles, Trash2 } from 'lucide-react'
import { useTheme } from '@/features/shared'
import { useEnhanceComment, type EnhanceCommentContext } from '../hooks/useEnhanceComment'
import { useItemComments } from '../hooks/useItemComments'

interface ItemCommentBoxProps {
  itemId: string
  itemContext?: EnhanceCommentContext
}

const ItemCommentBox: React.FC<ItemCommentBoxProps> = ({ itemId, itemContext }) => {
  const { theme } = useTheme()
  const isRetroCartoon = theme === 'retro-cartoon'
  const [content, setContent] = useState('')
  const [originalDraft, setOriginalDraft] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const {
    comment,
    loading,
    error,
    saveComment,
    deleteComment,
    isCreatingComment,
    isUpdatingComment,
    isDeletingComment,
  } = useItemComments(itemId)
  const {
    enhanceComment,
    isEnhancing,
    error: enhanceError,
    resetError: resetEnhanceError,
  } = useEnhanceComment()

  useEffect(() => {
    setContent(comment?.content || '')
    setOriginalDraft(null)
  }, [comment?.content, itemId])

  const isSaving = isCreatingComment || isUpdatingComment
  const isBusy = loading || isSaving || isDeletingComment || isEnhancing
  const hasExistingComment = !!comment
  const isDirty = content.trim() !== (comment?.content || '').trim()
  const isEmpty = content.trim().length === 0

  const containerClassName = useMemo(
    () =>
      isRetroCartoon
        ? 'rounded-xl border-[4px] border-black bg-[var(--color-bg-primary)] p-4 shadow-[6px_6px_0px_0px_#000000]'
        : 'rounded-2xl border border-[rgba(var(--color-accent-primary-rgb),0.22)] bg-[var(--color-bg-secondary)] p-4 shadow-lg',
    [isRetroCartoon]
  )

  const handleSave = async () => {
    setFeedback(null)
    setErrorMessage(null)
    resetEnhanceError()

    try {
      await saveComment(content)
      setOriginalDraft(null)
      setFeedback(hasExistingComment ? 'Comentario actualizado.' : 'Comentario guardado.')
    } catch (saveError) {
      setErrorMessage(
        saveError instanceof Error ? saveError.message : 'No se pudo guardar el comentario.'
      )
    }
  }

  const handleDelete = async () => {
    setFeedback(null)
    setErrorMessage(null)
    resetEnhanceError()

    try {
      await deleteComment()
      setContent('')
      setOriginalDraft(null)
      setFeedback('Comentario eliminado.')
    } catch (deleteError) {
      setErrorMessage(
        deleteError instanceof Error ? deleteError.message : 'No se pudo eliminar el comentario.'
      )
    }
  }

  const handleEnhance = async () => {
    setFeedback(null)
    setErrorMessage(null)
    resetEnhanceError()

    try {
      setOriginalDraft(content)
      const enhancedContent = await enhanceComment(content, itemContext)
      setContent(enhancedContent)
      setFeedback('Comentario mejorado con IA. Revísalo antes de guardarlo.')
    } catch (enhanceRequestError) {
      setErrorMessage(
        enhanceRequestError instanceof Error
          ? enhanceRequestError.message
          : 'No se pudo mejorar el comentario con IA.'
      )
    }
  }

  const handleUndoEnhancement = () => {
    if (originalDraft === null) return

    setContent(originalDraft)
    setOriginalDraft(null)
    setFeedback('Se restauró tu borrador original.')
    setErrorMessage(null)
    resetEnhanceError()
  }

  return (
    <section className={containerClassName}>
      <div className="mb-3 flex items-center gap-2">
        <MessageSquare className="h-4 w-4" aria-hidden="true" />
        <div>
          <p className="theme-heading-font text-[11px] font-black uppercase tracking-[0.16em] text-[var(--color-text-primary)]">
            Comentario personal
          </p>
          <p className={`${isRetroCartoon ? 'theme-heading-font ' : ''}text-[10px] text-[var(--color-text-muted)]`}>
            Esta nota queda asociada al item y luego puede aprovecharse para recomendaciones.
          </p>
        </div>
      </div>

      <textarea
        value={content}
        onChange={(event) => {
          setContent(event.target.value)
          if (originalDraft !== null) setOriginalDraft(null)
          if (feedback) setFeedback(null)
          if (errorMessage) setErrorMessage(null)
          if (enhanceError) resetEnhanceError()
        }}
        placeholder="Escribe que te parecio, si la recomendarias o cualquier contexto para futuras sugerencias."
        className={`min-h-[140px] w-full resize-y rounded-xl border px-4 py-3 text-xs transition focus:outline-none ${isRetroCartoon ? 'theme-heading-font ' : ''}${
          isRetroCartoon
            ? 'border-[3px] border-black bg-white text-black'
            : 'border-[rgba(var(--color-accent-primary-rgb),0.28)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] focus:border-[rgba(var(--color-accent-primary-rgb),0.55)]'
        }`}
        maxLength={2000}
        disabled={isBusy}
      />

      <div className={`mt-2 flex items-center justify-between gap-3 text-[10px] text-[var(--color-text-muted)] ${isRetroCartoon ? 'theme-heading-font' : ''}`}>
        <span>{content.trim().length}/2000</span>
        {loading && <span>Cargando comentario...</span>}
        {!loading && error && <span className="text-[var(--color-accent-secondary)]">{error}</span>}
      </div>

      {feedback && (
        <p className="mt-3 text-sm font-medium text-[var(--color-accent-primary)]">{feedback}</p>
      )}
      {errorMessage && (
        <p className="mt-3 text-sm font-medium text-[var(--color-accent-secondary)]">{errorMessage}</p>
      )}
      {!errorMessage && enhanceError && (
        <p className="mt-3 text-sm font-medium text-[var(--color-accent-secondary)]">{enhanceError}</p>
      )}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          onClick={handleEnhance}
          disabled={isBusy || isEnhancing || isEmpty}
          className={`theme-heading-font flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-[11px] font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
            isRetroCartoon
              ? 'border-[3px] border-black bg-white text-black'
              : 'border-[rgba(var(--color-accent-secondary-rgb),0.4)] bg-[rgba(var(--color-accent-secondary-rgb),0.12)] text-[var(--color-accent-secondary)] hover:border-[rgba(var(--color-accent-secondary-rgb),0.65)] hover:bg-[rgba(var(--color-accent-secondary-rgb),0.2)]'
          }`}
        >
          {isEnhancing ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          )}
          {isEnhancing ? 'Mejorando...' : 'Mejorar con IA'}
        </button>

        {originalDraft !== null && (
          <button
            type="button"
            onClick={handleUndoEnhancement}
            disabled={isBusy}
            className={`theme-heading-font flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-[11px] font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
              isRetroCartoon
                ? 'border-[3px] border-black bg-[var(--color-bg-primary)] text-black'
                : 'border-white/15 bg-transparent text-[var(--color-text-muted)] hover:border-[rgba(var(--color-accent-primary-rgb),0.45)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Deshacer mejora
          </button>
        )}

        {hasExistingComment && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isBusy}
            className={`theme-heading-font flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-[11px] font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
              isRetroCartoon
                ? 'border-[3px] border-black bg-white text-black'
                : 'border-red-500/35 bg-red-500/10 text-red-300 hover:border-red-400 hover:bg-red-500/15 hover:text-red-200'
            }`}
          >
            {isDeletingComment ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            )}
            Eliminar comentario
          </button>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={isBusy || isEmpty || !isDirty}
          className={`theme-heading-font flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-[11px] font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
            isRetroCartoon
              ? 'border-[3px] border-black bg-[var(--color-bg-secondary)] text-black shadow-[4px_4px_0px_0px_#000000]'
              : 'border-[rgba(var(--color-accent-primary-rgb),0.4)] bg-[rgba(var(--color-accent-primary-rgb),0.14)] text-[var(--color-accent-primary)] hover:border-[rgba(var(--color-accent-primary-rgb),0.65)] hover:bg-[rgba(var(--color-accent-primary-rgb),0.2)]'
          }`}
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="h-4 w-4" aria-hidden="true" />
          )}
          {hasExistingComment ? 'Guardar cambios' : 'Guardar comentario'}
        </button>
      </div>
    </section>
  )
}

export default ItemCommentBox
