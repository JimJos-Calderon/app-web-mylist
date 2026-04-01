import { useQuery } from '@tanstack/react-query'

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
      const apiKey = import.meta.env.VITE_GROQ_API_KEY

      if (!apiKey) {
        throw new Error('No se encontró la clave VITE_GROQ_API_KEY para traducir la sinopsis.')
      }

      const userPrompt = [
        `Idioma de destino: ${normalizedLanguage}`,
        '',
        'Sinopsis original:',
        normalizedText,
      ].join('\n')

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: TRANSLATE_SYNOPSIS_SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.1,
          max_completion_tokens: 400,
        }),
      })

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}))
        throw new Error(
          `Groq no pudo traducir la sinopsis. Código ${response.status} — ${(errBody as { error?: { message?: string } })?.error?.message ?? 'sin detalle'}`
        )
      }

      const data = await response.json()
      const translatedText = normalizeTranslatedText(data.choices?.[0]?.message?.content ?? '')

      if (!translatedText) {
        throw new Error('Groq devolvió una traducción vacía para la sinopsis.')
      }

      return translatedText
    },
  })
}
