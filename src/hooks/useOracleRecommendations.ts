import { useState, useCallback } from 'react';
import { invokeAiProxy } from '@/lib/invokeAiProxy';

export interface FavoriteItem {
  titulo: string;
  nota: string | number;
  comment?: string;
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
  fetchRecommendations: (
    positiveItems: FavoriteItem[],
    negativeItems: FavoriteItem[],
    excludedTitles?: string[]
  ) => Promise<void>;
  resetOracle: () => void;
}

const normalizeTitle = (value: string): string =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const MAX_COMMENT_LENGTH = 300;

const truncateComment = (comment?: string): string | undefined => {
  if (!comment) return undefined;
  const normalized = comment.trim().replace(/\s+/g, ' ');
  if (!normalized) return undefined;
  if (normalized.length <= MAX_COMMENT_LENGTH) return normalized;
  return `${normalized.slice(0, MAX_COMMENT_LENGTH - 1).trimEnd()}…`;
};

const formatFavoritesForPrompt = (favoritos: FavoriteItem[]) =>
  favoritos.map((favorito) => {
    const formatted: FavoriteItem = {
      titulo: favorito.titulo,
      nota: favorito.nota,
    };

    const truncatedComment = truncateComment(favorito.comment);
    if (truncatedComment) {
      formatted.comment = truncatedComment;
    }

    return formatted;
  });

const formatProfileLines = (items: FavoriteItem[], label: string) =>
  items.length === 0
    ? `(Sin entradas en ${label})`
    : items
        .map((item) => {
          const parts = [`${item.titulo} — ${label}: ${item.nota}`];
          const truncatedComment = truncateComment(item.comment);
          if (truncatedComment) {
            parts.push(`Comentario: "${truncatedComment}"`);
          }
          return parts.join(' | ');
        })
        .join('\n');

export const useOracleRecommendations = (): UseOracleRecommendationsReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recomendaciones, setRecomendaciones] = useState<Recommendation[] | null>(null);

  const resetOracle = useCallback(() => {
    setRecomendaciones(null);
    setError(null);
    setIsLoading(false);
  }, []);

  const fetchRecommendations = useCallback(
    async (positiveItems: FavoriteItem[], negativeItems: FavoriteItem[], excludedTitles: string[] = []) => {
    if (!positiveItems || positiveItems.length === 0) {
      setError('Aviso del Sistema: No hay suficientes datos en caché para un análisis del Oráculo.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setRecomendaciones(null);

    const systemPrompt = `Eres el Oráculo Cinéfilo. Tu misión es recomendar películas basándote en el perfil del usuario.

Te llegarán dos bloques de datos en el mensaje del usuario:
- PERFIL POSITIVO (Le gusta): obras con las que el usuario muestra afinidad (valoraciones altas, "me gustó", etc.).
- PERFIL NEGATIVO (No le gusta / Evitar): obras con las que muestra rechazo (valoraciones muy bajas, "no me gustó", etc.).

INSTRUCCIÓN CRÍTICA: Analiza por qué no le gustan las películas de la lista negativa (¿ritmo lento?, ¿demasiada violencia?, ¿género específico?, ¿tono?, ¿duración?, ¿humor?, ¿estilo visual?) usando tanto la nota como los comentarios si existen. Asegúrate de que tus 3 recomendaciones NO repliquen esos elementos disonantes: evita géneros, tonos, directores o patrones narrativos que expliquen su rechazo.

REGLAS DE ANÁLISIS:
- El perfil positivo define hacia dónde empujar las recomendaciones (género, tono, temática, época, director, estilo).
- El perfil negativo define un filtro activo: no sugieras obras que compartan las mismas causas probables de disgusto.
- Si un título aparece solo en negativo, trátalo como señal fuerte de evitación.
- Los comentarios del usuario son evidencia cualitativa prioritaria para afinar tanto el acierto como la exclusión.
- PROHIBIDO recomendar títulos que ya figuren en la lista de exclusiones (historial completo de títulos calificados).

REGLAS DE VARIABILIDAD:
- Varía las 3 recomendaciones entre consultas aunque el perfil sea similar.
- Prioriza títulos que encajen con el positivo y pasen el filtro del negativo; incluye variedad (popularidad, país, época) cuando sea coherente.
- Si el usuario recalcula, no repitas exactamente los mismos títulos que en la respuesta anterior.

DEBES RESPONDER ÚNICA Y EXCLUSIVAMENTE CON UN OBJETO JSON VÁLIDO.
NO incluyas bloques de código Markdown (como \`\`\`json).
NO agregues prefijos, saludos, despedidas ni texto de cortesía.
La estructura estricta del JSON debe ser exactamente:
{
  "recomendaciones": [
    {
      "titulo": "Nombre exacto de la película",
      "justificacion": "Explica la afinidad con el perfil positivo, cómo evitas los patrones del perfil negativo, y cita comentarios del usuario cuando aporten valor."
    }
  ]
}`;

    const entropySeed = new Date().toISOString();
    const positiveReady = formatFavoritesForPrompt(positiveItems);
    const negativeReady = formatFavoritesForPrompt(negativeItems);
    const positiveLines = formatProfileLines(positiveReady, 'perfil positivo');
    const negativeLines = formatProfileLines(negativeReady, 'perfil negativo');

    const userPrompt = `Analiza el siguiente perfil cinematográfico y genera exactamente 3 recomendaciones.

PERFIL POSITIVO (Le gusta) — lista legible:
${positiveLines}

PERFIL NEGATIVO (No le gusta / Evitar) — lista legible:
${negativeLines}

PERFIL POSITIVO (JSON estructurado):
${JSON.stringify(positiveReady, null, 2)}

PERFIL NEGATIVO (JSON estructurado):
${JSON.stringify(negativeReady, null, 2)}

[TÍTULOS YA CALIFICADOS QUE DEBES EXCLUIR — no recomiendas ninguno de estos]:
${JSON.stringify(excludedTitles, null, 2)}

[SEMILLA DE ENTROPÍA PARA ESTA PETICIÓN]: ${entropySeed}

Responde solo con el JSON indicado en las instrucciones del sistema.`;

    try {
      const data = await invokeAiProxy({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.8,
        presence_penalty: 0.3,
        frequency_penalty: 0.3,
      });
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
