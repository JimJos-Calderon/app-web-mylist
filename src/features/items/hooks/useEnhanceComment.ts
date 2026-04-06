import { useCallback, useState } from 'react'
import { invokeAiProxy } from '@/lib/invokeAiProxy'

export interface EnhanceCommentContext {
  title?: string
  type?: 'pelicula' | 'serie' | string
  genre?: string | null
  synopsis?: string | null
}

interface UseEnhanceCommentReturn {
  enhanceComment: (draft: string, context?: EnhanceCommentContext) => Promise<string>
  isEnhancing: boolean
  error: string | null
  resetError: () => void
}

export const ENHANCE_COMMENT_SYSTEM_PROMPT = `Actúa como un crítico de cine. Expande el siguiente comentario corto del usuario sobre la obra. Mantén estrictamente la opinión y el sentimiento original (positivo, negativo o neutral), pero añade vocabulario descriptivo sobre posibles aspectos técnicos (tono, ritmo, género, cinematografía). Sé conciso (máximo 3-4 líneas) y responde en el mismo idioma que el usuario.`

const normalizeGeneratedComment = (value: string) =>
  value
    .trim()
    .replace(/^["'`]+|["'`]+$/g, '')
    .replace(/\n{3,}/g, '\n\n')

export const useEnhanceComment = (): UseEnhanceCommentReturn => {
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetError = useCallback(() => {
    setError(null)
  }, [])

  const enhanceComment = useCallback(async (draft: string, context?: EnhanceCommentContext) => {
    const normalizedDraft = draft.trim()

    if (!normalizedDraft) {
      throw new Error('Escribe un comentario antes de mejorarlo con IA.')
    }

    setIsEnhancing(true)
    setError(null)

    const contextLines = [
      context?.title ? `Titulo: ${context.title}` : null,
      context?.type ? `Tipo: ${context.type}` : null,
      context?.genre ? `Genero: ${context.genre}` : null,
      context?.synopsis ? `Sinopsis breve: ${context.synopsis.trim()}` : null,
    ].filter(Boolean)

    const userPrompt = [
      'Contexto de la obra:',
      contextLines.length > 0 ? contextLines.join('\n') : 'Sin contexto adicional.',
      '',
      'Comentario original del usuario:',
      normalizedDraft,
      '',
      'Devuelve unicamente la version mejorada del comentario, lista para ser revisada por el usuario antes de guardarla.',
    ].join('\n')

    try {
      const data = await invokeAiProxy({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: ENHANCE_COMMENT_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.5,
        max_completion_tokens: 220,
      })
      const generated = normalizeGeneratedComment(data.choices?.[0]?.message?.content ?? '')

      if (!generated) {
        throw new Error('Groq devolvió una respuesta vacía al intentar mejorar el comentario.')
      }

      return generated
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'No se pudo mejorar el comentario con IA.'
      setError(message)
      throw new Error(message)
    } finally {
      setIsEnhancing(false)
    }
  }, [])

  return {
    enhanceComment,
    isEnhancing,
    error,
    resetError,
  }
}
