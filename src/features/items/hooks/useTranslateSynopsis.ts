import { useQuery } from '@tanstack/react-query'
import { invokeAiProxy } from '@/lib/invokeAiProxy'

export const TRANSLATE_SYNOPSIS_SYSTEM_PROMPT =
  'Eres un traductor profesional de cine. Traduce la siguiente sinopsis al idioma indicado. Devuelve UNICAMENTE el texto traducido, sin comillas, sin introducciones, sin formato markdown y sin comentarios adicionales.'

const normalizeLanguage = (language?: string | null) =>
  language
    ?.trim()
    .toLowerCase()
    .split('-')[0] ?? ''

const normalizeTranslatedText = (value: string) =>
  value
    .trim()
    .replace(/^["'`]+|["'`]+$/g, '')
    .replace(/\n{3,}/g, '\n\n')

interface UseTranslateSynopsisParams {
  itemId?: string | number | null
  targetLanguage?: string | null
  originalText?: string | null
}

export const useTranslateSynopsis = ({
  itemId,
  targetLanguage,
  originalText,
}: UseTranslateSynopsisParams) => {
  const normalizedText = originalText?.trim() ?? ''
  const normalizedLanguage = normalizeLanguage(targetLanguage)
  const isEnabled = Boolean(normalizedText) && Boolean(normalizedLanguage) && normalizedLanguage !== 'en'

  return useQuery({
    queryKey: ['translations', String(itemId ?? ''), normalizedLanguage, normalizedText],
    enabled: isEnabled,
    staleTime: Infinity,
    gcTime: Infinity,
    queryFn: async () => {
      const userPrompt = [
        `Idioma de destino: ${normalizedLanguage}`,
        '',
        'Sinopsis original:',
        normalizedText,
      ].join('\n')

      const data = await invokeAiProxy({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: TRANSLATE_SYNOPSIS_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.1,
        max_completion_tokens: 400,
      })

      const translatedText = normalizeTranslatedText(data.choices?.[0]?.message?.content ?? '')

      if (!translatedText) {
        throw new Error('El servicio de IA devolvió una traducción vacía para la sinopsis.')
      }

      return translatedText
    },
  })
}
