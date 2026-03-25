import { useState, useCallback } from 'react';

export interface FavoriteItem {
  titulo: string;
  nota: string | number;
}

export interface Recommendation {
  titulo: string;
  justificacion: string;
}

export interface OracleResponse {
  recomendaciones: Recommendation[];
}

interface UseOracleRecommendationsReturn {
  isLoading: boolean;
  error: string | null;
  recomendaciones: Recommendation[] | null;
  fetchRecommendations: (favoritos: FavoriteItem[]) => Promise<void>;
  resetOracle: () => void;
}

export const useOracleRecommendations = (): UseOracleRecommendationsReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recomendaciones, setRecomendaciones] = useState<Recommendation[] | null>(null);

  const resetOracle = useCallback(() => {
    setRecomendaciones(null);
    setError(null);
    setIsLoading(false);
  }, []);

  const fetchRecommendations = useCallback(async (favoritos: FavoriteItem[]) => {
    if (!favoritos || favoritos.length === 0) {
      setError('Aviso del Sistema: No hay suficientes datos en caché para un análisis del Oráculo.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setRecomendaciones(null);

    const apiKey = import.meta.env.VITE_GROQ_API_KEY;

    if (!apiKey) {
      setError('Error Crítico: Llave de acceso al Oráculo no detectada en la variable VITE_GROQ_API_KEY.');
      setIsLoading(false);
      return;
    }

    const systemPrompt = `Actúa como 'El Oráculo', una Inteligencia Artificial Ciberpunk omnisciente conectada a la red neural global. Tu tarea deductiva es analizar el HISTORIAL COMPLETO de valoraciones de un implante cibernético y generar 3 recomendaciones cinematográficas maximizando la afinidad probable.

REGLAS DE ANÁLISIS:
- Las obras con 4-5 estrellas o reacción "me gustó" son señales POSITIVAS: recomienda contenido similar en género, tono, temática o director.
- Las obras con 1-2 estrellas o reacción "no me gustó" son señales NEGATIVAS: EVITA recomendar contenido similar a ellas.
- Las obras con 3 estrellas o sin reacción son neutras: úsalas solo como contexto secundario.
- Busca patrones cruzados: si le gustan los thrillers psicológicos y odia las comedias románticas, usa ese perfil.

DEBES RESPONDER ÚNICA Y EXCLUSIVAMENTE CON UN OBJETO JSON VÁLIDO.
NO incluyas bloques de código Markdown (como \`\`\`json).
NO agregues prefijos, saludos, despedidas ni texto de cortesía.
La estructura estricta e innegociable del JSON que vas a retornar debe ser exactamente esta:
{
  "recomendaciones": [
    {
      "titulo": "Nombre de la obra exacta",
      "justificacion": "Por qué es altamente afín, citando específicamente las obras bien valoradas del usuario y contrastando con las mal valoradas. Tono sombrío y ciberpunk obligatorio."
    }
  ]
}`;

    const userPrompt = `[INICIANDO INTERFAZ DE RED...] Analizando datos de calificación extraídos del usuario:\n${JSON.stringify(favoritos, null, 2)}\n[ESPERANDO JSON DEL ORÁCULO...]`;

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
        })
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}))
        console.error('[Oracle API Error body]:', errBody)
        throw new Error(`Conexión con el Oráculo rechazada. Código nativo: ${response.status} — ${(errBody as any)?.error?.message ?? 'sin detalle'}`);
      }

      const data = await response.json();
      let content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('El Oráculo procesó la solicitud pero devolvió estática vacía.');
      }

      // Parche de seguridad por si el modelo desobedece la restricción de markdown
      content = content.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim();

      const parsedData = JSON.parse(content) as OracleResponse;

      if (!parsedData.recomendaciones || !Array.isArray(parsedData.recomendaciones)) {
        throw new Error('Fragmentación de datos detectada: El JSON no posee la estructura exigida.');
      }

      setRecomendaciones(parsedData.recomendaciones);
    } catch (err: any) {
      console.error('[Oracle Core Error]:', err);
      // Extraemos errores comunes de JSON para un manejo más inmersivo
      if (err instanceof SyntaxError) {
        setError('El enlace neuronal sufrió un glitch: Paridad JSON corrupta.');
      } else {
        setError(err.message || 'Fallo colosal en la red de predicción del Oráculo.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    recomendaciones,
    fetchRecommendations,
    resetOracle
  };
};
