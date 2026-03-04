import { serve } from "std/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface SearchRequest {
  query: string;
  type?: "movie" | "series" | "episode";
  page?: number;
}

interface OmdbResponse {
  Search?: Array<{
    Title: string;
    Year: string;
    imdbID: string;
    Type: string;
    Poster: string;
  }>;
  totalResults?: string;
  Response: string;
  Error?: string;
}

// Almacenamiento en memoria para rate limiting (en producción usar Redis)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

// Configuración de Rate Limiting
const RATE_LIMIT_CONFIG = {
  maxRequests: 30, // 30 requests
  windowMs: 60 * 60 * 1000, // por 1 hora
};

// Validación básica de entrada
function validateInput(query: string): { valid: boolean; error?: string } {
  if (!query || typeof query !== "string") {
    return { valid: false, error: "Query parameter is required" };
  }

  if (query.length < 2) {
    return { valid: false, error: "Query must be at least 2 characters" };
  }

  if (query.length > 100) {
    return { valid: false, error: "Query must not exceed 100 characters" };
  }

  // Evitar caracteres peligrosos
  const dangerousCharacters = /[<>\"'%;()&+]/;
  if (dangerousCharacters.test(query)) {
    return { valid: false, error: "Query contains invalid characters" };
  }

  return { valid: true };
}

// Extrae el user_id del JWT (o usa el token como identificador único)
function extractUserIdFromAuth(authHeader: string | null): string | null {
  if (!authHeader) return null;

  try {
    // Usar el bearer token como identificador único para rate limiting
    // Esto es seguro porque cada usuario tiene un token único
    const token = authHeader.replace("Bearer ", "");
    // Tomar solo los primeros 20 caracteres del token para el identificador
    return token.substring(0, 20);
  } catch {
    return null;
  }
}

// Verifica Rate Limit
function checkRateLimit(userId: string | null): { allowed: boolean; remaining: number; resetIn: number } {
  const identifier = userId || "anonymous";
  const now = Date.now();

  const current = requestCounts.get(identifier);

  // Si no existe registro o ha pasado el tiempo de reset
  if (!current || now > current.resetTime) {
    requestCounts.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_CONFIG.windowMs,
    });
    return {
      allowed: true,
      remaining: RATE_LIMIT_CONFIG.maxRequests - 1,
      resetIn: RATE_LIMIT_CONFIG.windowMs,
    };
  }

  // Si aún hay requests disponibles
  if (current.count < RATE_LIMIT_CONFIG.maxRequests) {
    current.count++;
    return {
      allowed: true,
      remaining: RATE_LIMIT_CONFIG.maxRequests - current.count,
      resetIn: current.resetTime - now,
    };
  }

  // Rate limit excedido
  return {
    allowed: false,
    remaining: 0,
    resetIn: current.resetTime - now,
  };
}

serve(async (req: Request) => {
  // Manejo de CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verificar que sea una solicitud POST
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Extraer user_id del token de autorización
    const authHeader = req.headers.get("Authorization");
    const userId = extractUserIdFromAuth(authHeader);

    // Verificar Rate Limit
    const rateLimit = checkRateLimit(userId);
    const responseHeaders = {
      ...corsHeaders,
      "Content-Type": "application/json",
      "X-RateLimit-Limit": String(RATE_LIMIT_CONFIG.maxRequests),
      "X-RateLimit-Remaining": String(rateLimit.remaining),
      "X-RateLimit-Reset": String(Math.ceil(rateLimit.resetIn / 1000)),
    };

    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded",
          retryAfter: Math.ceil(rateLimit.resetIn / 1000),
        }),
        {
          status: 429,
          headers: responseHeaders,
        }
      );
    }

    // Parsear el body
    const body: SearchRequest = await req.json();
    const { query, type = "movie", page = 1 } = body;

    // Validar entrada
    const validation = validateInput(query);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        {
          status: 400,
          headers: responseHeaders,
        }
      );
    }

    // Validar que page sea un número válido
    if (page < 1 || page > 10) {
      return new Response(
        JSON.stringify({ error: "Page must be between 1 and 10" }),
        {
          status: 400,
          headers: responseHeaders,
        }
      );
    }

    // Obtener la API key desde variables de entorno (secrets)
    const omdbApiKey = Deno.env.get("OMDB_API_KEY");
    if (!omdbApiKey) {
      console.error("OMDB_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        {
          status: 500,
          headers: responseHeaders,
        }
      );
    }

    // Construir URL de OMDB
    const omdbUrl = new URL("https://www.omdbapi.com/");
    omdbUrl.searchParams.append("apikey", omdbApiKey);
    omdbUrl.searchParams.append("s", query);
    omdbUrl.searchParams.append("type", type);
    omdbUrl.searchParams.append("page", String(page));

    // Hacer la petición a OMDB
    const omdbResponse = await fetch(omdbUrl.toString(), {
      method: "GET",
      headers: {
        "User-Agent": "MyListApp/1.0",
      },
    });

    if (!omdbResponse.ok) {
      console.error(`OMDB API error: ${omdbResponse.status}`);
      return new Response(
        JSON.stringify({ error: "Error fetching from OMDB" }),
        {
          status: 502,
          headers: responseHeaders,
        }
      );
    }

    const data: OmdbResponse = await omdbResponse.json();

    // Devolver respuesta
    return new Response(
      JSON.stringify(data),
      {
        status: 200,
        headers: responseHeaders,
      }
    );
  } catch (error) {
    console.error("Function error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
