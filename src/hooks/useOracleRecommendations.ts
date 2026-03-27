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

const extractFirstJsonObject = (input: string): string | null => {
  const start = input.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escaping = false;

  for (let i = start; i < input.length; i += 1) {
    const ch = input[i];
    if (inString) {
      if (escaping) escaping = false;
      else if (ch === '\\') escaping = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === '{') {
      depth += 1;
      continue;
    }
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) return input.slice(start, i + 1);
    }
  }
  return null;
};

const tryParseOracleResponse = (raw: string): OracleResponse => {
  const attempts = [
    raw,
    raw.replace(/,\s*([}\]])/g, '$1'),
    raw.replace(/}\s*{/g, '},{'),
  ];
  let lastError: unknown = null;
  for (const candidate of attempts) {
    try {
      return JSON.parse(candidate) as OracleResponse;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new SyntaxError('JSON inválido');
};

interface UseOracleRecommendationsReturn {
  isLoading: boolean;
  error: string | null;
  recomendaciones: Recommendation[] | null;
  fetchRecommendations: (favoritos: FavoriteItem[], excludedTitles?: string[]) => Promise<void>;
  resetOracle: () => void;
}

const normalizeTitle = (value: string): string =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export const useOracleRecommendations = (): UseOracleRecommendationsReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recomendaciones, setRecomendaciones] = useState<Recommendation[] | null>(null);

  const resetOracle = useCallback(() => {
    setRecomendaciones(null);
    setError(null);
    setIsLoading(false);
  }, []);

  const fetchRecommendations = useCallback(async (favoritos: FavoriteItem[], excludedTitles: string[] = []) => {
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
- PROHIBIDO recomendar títulos que ya estén en el historial de calificaciones del usuario.

REGLAS DE VARIABILIDAD OBLIGATORIAS:
- Varía tus recomendaciones en cada consulta, aunque el perfil del usuario sea similar.
- No te limites a los blockbusters más obvios: prioriza joyas ocultas, películas de culto y títulos internacionales cuando encajen con el perfil.
- Si el usuario pulsa recalcular, evita repetir exactamente los mismos títulos de la última respuesta.
- Busca diversidad razonable entre géneros, países y niveles de popularidad sin perder afinidad.

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

    const entropySeed = new Date().toISOString();
    const userPrompt = `[INICIANDO INTERFAZ DE RED...] Analizando datos de calificación extraídos del usuario:\n${JSON.stringify(favoritos, null, 2)}\n\n[TÍTULOS YA CALIFICADOS QUE DEBES EXCLUIR]:\n${JSON.stringify(excludedTitles, null, 2)}\n\n[SEMILLA DE ENTROPÍA PARA ESTA PETICIÓN]: ${entropySeed}\n[ESPERANDO JSON DEL ORÁCULO...]`;

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
          response_format: { type: 'json_object' },
          temperature: 0.8,
          presence_penalty: 0.3,
          frequency_penalty: 0.3,
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

      // Extracción robusta: buscamos el primer { y el último } para aislar el JSON puro
      // independientemente de texto introductorio, bloques ```json, o texto de cierre
      const normalizedContent = content.trim();
      const jsonString = extractFirstJsonObject(normalizedContent);
      if (!jsonString) {
        throw new Error('El Oráculo respondió sin incluir un JSON reconocible.')
      }
      const parsedData = tryParseOracleResponse(jsonString);

      if (!parsedData.recomendaciones || !Array.isArray(parsedData.recomendaciones)) {
        throw new Error('Fragmentación de datos detectada: El JSON no posee la estructura exigida.');
      }

      const excludedSet = new Set(excludedTitles.map(normalizeTitle).filter(Boolean));
      const seen = new Set<string>();
      const filtered = parsedData.recomendaciones.filter((rec) => {
        const normalized = normalizeTitle(rec.titulo);
        if (!normalized) return false;
        if (excludedSet.has(normalized)) return false;
        if (seen.has(normalized)) return false;
        seen.add(normalized);
        return true;
      });

      setRecomendaciones(filtered);
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
