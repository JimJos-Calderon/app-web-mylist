import { serve } from "std/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const MAX_MESSAGES = 32;
const MAX_MESSAGE_CHARS = 120_000;

interface ChatMessage {
  role: string;
  content: string;
}

interface AiProxyRequestBody {
  messages?: unknown;
  model?: string;
  temperature?: number;
  response_format?: { type: string };
  presence_penalty?: number;
  frequency_penalty?: number;
  max_completion_tokens?: number;
}

function validateMessages(raw: unknown): ChatMessage[] | { error: string } {
  if (!Array.isArray(raw) || raw.length === 0) {
    return { error: "messages must be a non-empty array" };
  }
  if (raw.length > MAX_MESSAGES) {
    return { error: `messages must not exceed ${MAX_MESSAGES} items` };
  }
  const out: ChatMessage[] = [];
  let total = 0;
  for (const item of raw) {
    if (!item || typeof item !== "object") {
      return { error: "each message must be an object" };
    }
    const m = item as Record<string, unknown>;
    const role = m.role;
    const content = m.content;
    if (typeof role !== "string" || typeof content !== "string") {
      return { error: "each message needs string role and content" };
    }
    if (!role.trim() || !content.length) {
      return { error: "message role and content must be non-empty" };
    }
    total += content.length;
    if (total > MAX_MESSAGE_CHARS) {
      return { error: "total message content exceeds limit" };
    }
    out.push({ role, content });
  }
  return out;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: jsonHeaders,
    });
  }

  const apiKey = Deno.env.get("GROQ_API_KEY");
  if (!apiKey) {
    console.error("GROQ_API_KEY not configured");
    return new Response(
      JSON.stringify({
        error: { message: "AI proxy is not configured on the server" },
      }),
      { status: 500, headers: jsonHeaders },
    );
  }

  let body: AiProxyRequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: { message: "Invalid JSON body" } }), {
      status: 400,
      headers: jsonHeaders,
    });
  }

  const validated = validateMessages(body.messages);
  if ("error" in validated) {
    return new Response(JSON.stringify({ error: { message: validated.error } }), {
      status: 400,
      headers: jsonHeaders,
    });
  }

  const model =
    typeof body.model === "string" && body.model.trim()
      ? body.model.trim()
      : "llama-3.1-8b-instant";

  const payload: Record<string, unknown> = {
    model,
    messages: validated,
  };

  if (typeof body.temperature === "number" && Number.isFinite(body.temperature)) {
    payload.temperature = body.temperature;
  }
  if (
    body.response_format &&
    typeof body.response_format === "object" &&
    typeof (body.response_format as { type?: unknown }).type === "string"
  ) {
    payload.response_format = body.response_format;
  }
  if (typeof body.presence_penalty === "number" && Number.isFinite(body.presence_penalty)) {
    payload.presence_penalty = body.presence_penalty;
  }
  if (typeof body.frequency_penalty === "number" && Number.isFinite(body.frequency_penalty)) {
    payload.frequency_penalty = body.frequency_penalty;
  }
  if (
    typeof body.max_completion_tokens === "number" &&
    Number.isFinite(body.max_completion_tokens) &&
    body.max_completion_tokens > 0
  ) {
    payload.max_completion_tokens = body.max_completion_tokens;
  }

  try {
    const groqRes = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const groqText = await groqRes.text();
    let groqJson: unknown;
    try {
      groqJson = groqText ? JSON.parse(groqText) : {};
    } catch {
      return new Response(
        JSON.stringify({
          error: { message: "Groq returned non-JSON response" },
        }),
        { status: 502, headers: jsonHeaders },
      );
    }

    if (!groqRes.ok) {
      const status =
        groqRes.status >= 400 && groqRes.status < 600 ? groqRes.status : 502;
      return new Response(JSON.stringify(groqJson), {
        status,
        headers: jsonHeaders,
      });
    }

    return new Response(JSON.stringify(groqJson), {
      status: 200,
      headers: jsonHeaders,
    });
  } catch (err) {
    console.error("ai-proxy error:", err);
    return new Response(
      JSON.stringify({ error: { message: "Failed to reach Groq API" } }),
      { status: 502, headers: jsonHeaders },
    );
  }
});
