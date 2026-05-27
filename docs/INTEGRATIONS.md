# Integraciones y Edge Functions

APIs externas y funciones serverless de **WhichNext**.

---

## Resumen

| Servicio | Dónde se usa | Secreto |
|----------|--------------|---------|
| **Supabase Auth** | Login, sesión JWT | `VITE_SUPABASE_*` |
| **OMDB** | Búsqueda de títulos | `OMDB_API_KEY` (Edge) |
| **TMDB** | Póster, ES, sinopsis, dónde verlo | `VITE_TMDB_ACCESS_TOKEN` (cliente) |
| **Groq** | IA: Oráculo, mejorar texto | `GROQ_API_KEY` (Edge) |
| **Discord** | Aviso al añadir ítem | URL en `lists.discord_webhook_url` |
| **Web Push / FCM** | Notificaciones | VAPID, FCM en Supabase |
| **Sentry** | Errores producción | `VITE_SENTRY_DSN` |

---

## `search-omdb`

**Ruta:** `supabase/functions/search-omdb/`

- Proxy seguro hacia OMDB; la API key **nunca** va al navegador.
- Validación de query (longitud, caracteres peligrosos).
- **Rate limit:** ~30 búsquedas / usuario / hora (cabeceras `X-RateLimit-*`).
- El cliente invoca vía `supabase.functions.invoke('search-omdb', { body: { query } })`.

User-Agent en servidor: `WhichNext/1.0`.

---

## `ai-proxy`

**Ruta:** `supabase/functions/ai-proxy/`

- Reenvía peticiones a la API de **Groq** con el secreto del servidor.
- El cliente usa [`src/lib/invokeAiProxy.ts`](../src/lib/invokeAiProxy.ts) con sesión activa.
- Casos: mejorar comentarios, crítica rápida, **Oráculo** (`useOracleRecommendations`).

**Configuración:**

1. Secret `GROQ_API_KEY` en Supabase.
2. `verify_jwt = true` en `supabase/config.toml` para `[functions.ai-proxy]`.
3. `npx supabase functions deploy ai-proxy`

**No** existe `VITE_GROQ_API_KEY`.

Si recibes **401**: sesión caducada o JWT no verificado en la función.

---

## TMDB (cliente)

Con `VITE_TMDB_ACCESS_TOKEN` (Bearer v3):

- Sincronizar `title_es`, póster, sinopsis.
- **`resolveItemWatchProviders`** en modal de detalle (dónde verlo por región).

Sin token, la app sigue funcionando con datos OMDB básicos.

Servicios: `src/features/items/services/tmdbService.ts`, `itemSynopsisService.ts`, etc.

---

## `push-orchestrator`

**Ruta:** `supabase/functions/push-orchestrator/`

Orquesta notificaciones al insertar ítems (según configuración):

- Mensaje a **Discord** (webhook de la lista).
- **Web Push** y **FCM** (Android).

Disparadores en BD (migración `25` y relacionadas). Evita duplicar webhooks de BD + trigger.

Operación Discord: [DISCORD_WEBHOOK.md](./DISCORD_WEBHOOK.md).

---

## `send-push`

**Ruta:** `supabase/functions/send-push/`

Envío de notificaciones push puntuales (suscripciones en `push_subscriptions`).

---

## CORS

Cabeceras compartidas: `supabase/functions/_shared/cors.ts`.

---

## Despliegue de funciones

```bash
npx supabase functions deploy search-omdb
npx supabase functions deploy ai-proxy
npx supabase functions deploy send-push
npx supabase functions deploy push-orchestrator
```

Secrets solo en el dashboard o CLI de Supabase, no en el repo.

---

## Health check push (Windows)

Script operativo:

```powershell
.\scripts\push-health-check.ps1 -ProjectRef <ref> -RunAutomationProbe
```
