import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '@/supabaseClient'

export type GroqChatCompletionResponse = {
  choices?: Array<{ message?: { content?: string } }>
}

export async function invokeAiProxy(
  body: Record<string, unknown>
): Promise<GroqChatCompletionResponse> {
  const { data, error } = await supabase.functions.invoke<GroqChatCompletionResponse>('ai-proxy', {
    body,
  })

  if (error) {
    let detail = error.message
    if (error instanceof FunctionsHttpError) {
      const status = error.context.status
      try {
        const errBody = (await error.context.json()) as { error?: { message?: string } }
        if (errBody?.error?.message) {
          detail = errBody.error.message
        }
      } catch {
        /* usar detail por defecto */
      }
      if (status === 401) {
        detail =
          'Acceso denegado al proxy de IA (401). Debes tener sesión iniciada; en Supabase confirma que «ai-proxy» tenga Verify JWT activo y que supabase/config.toml use verify_jwt = true, luego npx supabase functions deploy ai-proxy. Comprueba que VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY correspondan al mismo proyecto.'
      }
    }
    throw new Error(detail)
  }

  if (!data) {
    throw new Error('Respuesta vacía del proxy de IA.')
  }

  return data
}
