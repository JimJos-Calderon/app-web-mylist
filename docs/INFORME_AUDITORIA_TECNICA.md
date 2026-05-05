# Informe de auditoría técnica — Nuestra Lista (app-web-mylist)

**Rol:** arquitectura de software y revisión de sistema  
**Alcance:** código en `src/`, migraciones `supabase/migrations/`, Edge Functions `supabase/functions/`, dependencias y configuración documentada.  
**Nota:** el esquema exacto en producción debe validarse siempre contra Supabase; este informe se basa en el repositorio actual.

---

## 1. Resumen ejecutivo

La aplicación es una **SPA React + TypeScript (Vite)** orientada a **listas colaborativas** de películas y series, con **Supabase** (Auth, Postgres, RLS, Realtime, Storage) como backend. La búsqueda de títulos pasa por una **Edge Function** que proxifica **OMDB**; el cliente puede enriquecer con **TMDB** (Bearer). Las recomendaciones tipo **Oráculo** y la **mejora de comentarios con IA** llaman a **Groq** desde el navegador. Hay **cuatro identidades visuales** (tres nominales + “default”), PWA, i18n ES/EN, tests Vitest/Playwright y opcionalmente **Capacitor** para Android.

---

## 2. Estructura de carpetas y organización

### 2.1 Convención general

| Área | Ubicación | Responsabilidad |
|------|-----------|-----------------|
| Entrada SPA | `src/main.tsx`, `src/App.tsx`, `src/app/AppRoutes.tsx`, `src/app/AppShell.tsx` | Bootstrap, providers, rutas, shell (navbar, invitaciones, onboarding). |
| Páginas | `src/pages/` | Vistas de ruta: `Dashboard`, `Login`, `Peliculas`, `Series`, `Perfil`, `Ajustes`, `JoinList`. |
| Dominio por feature | `src/features/*` | Código colocalizado por bounded context. |
| Hooks transversales | `src/hooks/` | p. ej. `useOracleRecommendations`. |
| Config | `src/config/` | Query client, persistencia, query keys, preferencias (tema/idioma), list select. |
| Tipos | `src/features/shared/model/types.ts`, `src/types/` | `ListItem` y extensiones puntuales. |
| i18n | `src/locales/es|en/` | JSON fusionados vía `index.ts`. |
| Cliente Supabase | `src/supabaseClient.ts` | Instancia única del cliente. |
| PWA | `src/sw.ts`, `vite.config.ts` | Service Worker (Workbox injectManifest). |

### 2.2 Features principales (`src/features/`)

- **`auth/`** — Contexto de sesión, consumo de Supabase Auth.  
- **`items/`** — Componentes (tarjetas, búsqueda, filtros, comentarios, modal de crítica rápida, carrusel aleatorio), hooks (`useItems`, `useItemRating`, `useItemComments`, `useSuggestions`, …), servicios (`tmdbService`, `itemSynopsisService`, `quickCritiqueService`, `syncTitleEsFromTmdb`, `useEnhanceComment`).  
- **`lists/`** — Listas activas, contenido de lista, búsqueda/alta de ítems, modales (detalle, ajustes, diálogos), Activity Feed, hooks (`useLists`, `useListSearchFlow`, `useListItemDetails`, …).  
- **`oracle/`** — UI del Oráculo (`OracleSection`).  
- **`profile/`** — Perfil de usuario y username.  
- **`shared/`** — Tema, componentes UI reutilizables (`HudContainer`, `ConfirmDialog`, …), utilidades, validación.  
- **`navigation/`**, **`invites/`**, **`onboarding/`**, **`app/`** — Navegación, invitaciones pendientes, setup de username, pantalla de arranque.

### 2.3 Patrones detectados

- **TanStack Query** para servidor: claves centralizadas en `queryKeys.ts`, persistencia offline selectiva (`queryPersistence.ts`).  
- **Separación** UI ↔ hooks ↔ `supabase` / `functions.invoke` / `fetch` externo.  
- **RPC** para operaciones transaccionales críticas (`save_quick_critique`).  
- **Temas** vía `data-theme` en `documentElement` + CSS en `index.css`.

---

## 3. Dependencias clave (`package.json`)

### 3.1 Runtime (propósito)

| Dependencia | Propósito |
|-------------|-----------|
| `react` / `react-dom` ^19 | UI. |
| `react-router-dom` ^7 | Enrutado SPA. |
| `@supabase/supabase-js` | Cliente Auth + PostgREST + Realtime + Storage + Functions. |
| `@tanstack/react-query` + persist persisters | Caché, sincronización y offline-first parcial. |
| `tailwindcss` + `@tailwindcss/vite` | Estilos utility-first. |
| `i18next` / `react-i18next` / detector | Internacionalización. |
| `lucide-react` | Iconografía. |
| `swiper` | Vista carrusel (Ring). |
| `@radix-ui/react-dialog` / `select` | Primitivos accesibles (p. ej. ajustes). |
| `vaul` | Drawer/mobile patterns si aplica. |
| `react-error-boundary` | Contención de errores UI. |
| `@sentry/react` (+ plugin Vite en devDeps) | Observabilidad de errores en cliente. |
| `@capacitor/*` | Wrapper nativo Android (preferencias, splash, app lifecycle). |

### 3.2 Tooling

| Dependencia | Propósito |
|-------------|-----------|
| `vite` ^7 | Build y dev server. |
| `vite-plugin-pwa` | Manifest + SW. |
| `typescript` | Tipado. |
| `eslint` + TS plugin | Calidad estática. |
| `vitest` + Testing Library + `jsdom` | Tests unitarios. |
| `@playwright/test` | E2E. |
| `terser` | Minificación producción. |

### 3.3 Auditoría de dependencias (`npm audit`)

Tras `npm audit fix` (parches automáticos sin `--force`), pueden quedar **avisos transitivos** sin parche en el árbol (p. ej. `@xmldom/xmldom`, `tar` vía `@capacitor/assets` / `@capacitor/cli`). Conviene repetir `npm audit` al subir versiones mayores de Capacitor o al regenerar assets. No exponer secretos en scripts versionados.

---

## 4. Arquitectura de datos (Supabase)

### 4.1 Tablas y conceptos (según migraciones y uso en código)

Las migraciones **no recrean desde cero** todas las tablas en un solo archivo; asumen un esquema base coherente con `items`, `lists`, `list_members`, `user_profiles`, `item_ratings`. A lo largo del historial se **añaden columnas**, **RLS**, **soft delete**, **comentarios**, **auditoría**, **push**, etc.

| Tabla / recurso | Columnas / notas relevantes | Relaciones / uso |
|-----------------|------------------------------|------------------|
| **`items`** | `titulo`, `title_es` (mig. 17), `tipo` (pelicula/serie), `visto`, `user_id`, `user_email`, `poster_url`, `genero`, `list_id`, `created_at`, `deleted_at` (mig. 05). IDs tratados como **enteros/bigint** en RPC recientes (mig. 21+). | FK lógica a `lists`; miembros vía `list_members`. |
| **`lists`** | `name`, `owner_id`, `invite_code`, `is_private`, `deleted_at`, `discord_webhook_url` (mig. 18), `theme` (mig. 19: `cyberpunk` \| `terminal` \| `retro-cartoon` \| NULL). | Propietario y miembros. |
| **`list_members`** | `list_id`, `user_id`, `role` (owner/admin/member), `joined_at`. | Núcleo de permisos de lista. |
| **`user_profiles`** | Perfil social (username, avatar, bio, etc.); en app también **`theme_preference`** para UI global (lectura/escritura desde cliente). | `user_id` → `auth.users`. |
| **`item_ratings`** | `item_id`, `user_id`, `rating`, `liked`, timestamps. | Una fila por (usuario, ítem) en la práctica. |
| **`item_comments`** | `item_id`, `user_id`, `content`, restricción de longitud y una fila por usuario/ítem (mig. 14). | Comentarios / reseñas. |
| **`audit_logs`** | Eventos de cambios (mig. 06); base para automatización push. | Triggers desde tablas relevantes. |
| **`push_subscriptions`** | Suscripciones web push por usuario (mig. 07_0). | Edge `send-push`. |
| **`push_dispatch_config`** | Configuración de URL/secrets para `net.http_post` hacia funciones (definición en flujo documentado; variante activa en migraciones 07_0/08). | Infra push. |

### 4.2 RPC (funciones PostgreSQL expuestas al cliente)

| Función | Rol |
|---------|-----|
| **`join_list_with_code`** | Unión atómica a lista por código (mig. 05, fix 16). |
| **`soft_delete_item_row` / `soft_delete_list_row`** | Borrado lógico (mig. 05, ajustes 09/13). |
| **`save_quick_critique`** | Transacción: valida comentario/crítica, actualiza `items.visto`, upsert `item_ratings`, insert/upsert `item_comments` opcional (mig. 20–22). |
| **`check_item_comment_on_watch`** | Trigger: impedir marcar visto sin reseña o sin crítica rápida según reglas (mig. 15, ampliado 20). |
| **`dispatch_push_from_audit_logs`** | Orquestación HTTP hacia `send-push` (mig. 08). |
| **`audit_changes_trigger`** + triggers | Población de `audit_logs`. |
| Otros | `touch_*_updated_at` en varias tablas. |

### 4.3 Edge Functions (código en repo)

| Función | Entrada / comportamiento |
|---------|---------------------------|
| **`search-omdb`** | Body: `query`, `type`, `page`. Usa secret `OMDB_API_KEY`, validación y rate limit por usuario. |
| **`send-push`** | Envío web push; autenticación vía `x-push-secret` alineado con `push_dispatch_config`. |
| **`push-orchestrator`** | Recibe un JSON con forma de **Database Webhook** de Supabase (`type: INSERT`, `table: items`, `record`: fila nueva). Con `SUPABASE_SERVICE_ROLE_KEY` lee `lists.discord_webhook_url`, tema y nombre; resuelve autor; construye embed y llama al webhook de Discord; en paralelo dispara web push y FCM. |

**Disparo desde Postgres (versionado en repo):** la migración **`25_notify_discord_trigger_items.sql`** define la tabla `notify_discord_config` (URL de la Edge Function + bearer + `is_enabled`) y el trigger **`trg_items_notify_discord`** en `AFTER INSERT ON public.items`, que usa **`pg_net.http_post`** para invocar `push-orchestrator`. Hay que rellenar `function_url` y `bearer_token` con SQL (como indica el comentario en la migración) y tener la extensión **`pg_net`** habilitada.

**Doble envío a Discord:** si además existe un **Database Webhook** en el panel de Supabase apuntando al mismo `INSERT` en `items` y a la misma función, se recibirán **dos** notificaciones. Dejar solo un camino: o el trigger `pg_net`, o el webhook del panel (la migración 25 lo advierte explícitamente).

### 4.4 RLS — líneas maestras

- **`items`**: visibilidad por membresía en lista y `deleted_at`; inserción/actualización/borrado restringidos a **owner/admin** en políticas base (mig. 05); mig. **11** añade política para que **cualquier miembro** pueda hacer **UPDATE** de filas de la lista (colaboración en `visto`).  
- **`lists`**: SELECT para miembros; mutación solo **owner**; política explícita para `discord_webhook_url` (mig. 18).  
- **`list_members`**: SELECT del propio usuario en política antigua; altas/bajas según ownership (evoluciona en mig. 10 para eliminación de miembros, etc.).  
- **`item_ratings`**: políticas “propias” (lectura/escritura del dueño de la fila) según README histórico y migraciones de seguridad.  
- **`item_comments`**: políticas por membresía al ítem y autor (mig. 14).  

Para despliegues nuevos, la fuente de verdad es el **conjunto ordenado de migraciones** `04` → `30` (y posteriores en el repo).

### 4.5 Ítems: duplicados y notificaciones push (referencia operativa)

- **Migración `30_items_unique_list_tipo_title.sql`**: deduplica filas activas con el mismo `(list_id, tipo, lower(trim(titulo)))` vía `deleted_at`, luego crea el índice único parcial `ux_items_active_list_tipo_title_norm`. Comprobar en cada entorno (`supabase db push` o SQL Editor) que el índice exista y que no queden duplicados activos antes de aplicar.
- **Cliente**: `useItems` normaliza `titulo` con trim al insertar; error Postgres `23505` se trata como duplicado en UI (ver `useListSearchFlow` / `ListaContenido`).

---

## 5. Lógica de negocio y servicios

### 5.1 Búsqueda “bilingüe” y fusión TMDB + OMDB

1. **`useSuggestions`** (`useSuggestions.ts`): con query ≥ 3 caracteres y debounce, en paralelo:
   - **`searchTmdbAsOmdbSuggestions`**: si existe `VITE_TMDB_ACCESS_TOKEN`, consulta TMDB v3 con **`language` en cascada** `es-ES` → `es-MX` → `en-US`, mapea resultados al shape tipo OMDB (`Title`, `Year`, `imdbID` sintético `tmdb-movie-{id}` / `tmdb-tv-{id}`).
   - **`supabase.functions.invoke('search-omdb')`**: resultados OMDB.
2. **`mergeSearchSuggestions`**: prioriza lista TMDB primero, luego OMDB, **deduplica** por título normalizado + año, tope `MAX_SUGGESTIONS`.

**Alta de ítem (`useListSearchFlow`)**: tras elegir sugerencia o título manual, se llama de nuevo a OMDB para detalle liviano (género/póster) y a **`enrichFromTmdb` / `enrichFromTmdbByNumericId`** para `titulo`, `title_es`, `posterUrl`, `genresCsv`. Los campos persisten en `items`.

### 5.2 Oráculo (recomendaciones)

- **Datos**: `OracleSection` carga vía React Query todas las filas de **`item_ratings`** del usuario con `rating` o `liked` no nulos, join a **`items`** (título), luego segunda query a **`item_comments`** para adjuntar texto al perfil.  
- **Clasificación**: `classifyOracleSignal` — positivo (like o rating ≥ 4), negativo (dislike o rating ≤ 2), resto neutro.  
- **Recorte**: hasta 40 positivos y 20 negativos, ordenados por score heurístico.  
- **IA**: `useOracleRecommendations` envía a **Groq** `https://api.groq.com/openai/v1/chat/completions` con modelo **`llama-3.1-8b-instant`**, `response_format: json_object`, `temperature: 0.8`, penalizaciones de presencia/frecuencia, prompt de sistema largo (perfil positivo/negativo, exclusiones, anti-repetición).  
- **Post-procesado**: extracción robusta de JSON, filtrado de títulos ya calificados, deduplicación.

**Riesgo de arquitectura:** la API key Groq en `VITE_GROQ_API_KEY` **se expone en el bundle**; para entornos cerrados habría que proxyar en backend.

### 5.3 Notificaciones Discord por lista (resumen)

Guía operativa de **rotación del webhook** del canal: [DISCORD_WEBHOOK.md](DISCORD_WEBHOOK.md).

- **Configuración UI**: `ListSettingsModal` guarda `lists.discord_webhook_url` (y tema en `lists.theme`). Solo el propietario debería poder actualizar (RLS). El listado general de listas en cliente usa **`LIST_SELECT_PUBLIC`** en [`src/config/listSelect.ts`](../src/config/listSelect.ts) para **no** exponer la URL del webhook en selects habituales; invitaciones pendientes (`usePendingInvite`) también usan esa constante.
- **Runtime**: la Edge **`push-orchestrator`** (ver §4.3) arma embeds según `lists.theme` y envía a Discord si hay webhook configurado.
- **Disparo**: trigger `trg_items_notify_discord` + `pg_net` (migración 25), no depender solo de configuración manual salvo que se desactive el trigger a propósito.

### 5.4 Crítica rápida persistida

- UI: `QuickCritiqueModal` → confirmación llama **`saveQuickCritique`** → `supabase.rpc('save_quick_critique', { p_item_id, p_rating, p_liked, p_comment })`.  
- La RPC centraliza reglas de negocio y coherencia con triggers de “obligatoriedad” de reseña/crítica.

---

## 6. UI/UX: temas y QuickCritiqueModal

### 6.1 Sistema de temas

- **Valores almacenados** (`useTheme`): `cyberpunk` \| `terminal` \| `retro-cartoon` (cualquier otro valor se normaliza a default de preferencia).  
- **Persistencia**: columna `user_profiles.theme_preference` para usuarios logueados; `capacitorStorage` / local para anonimos vía `appPreferences.ts`.  
- **Aplicación**: `applyThemeToDocument` asigna `data-theme` en `<html>`.  
- **Estilos**: variables CSS por `[data-theme="..."]` en `index.css`; clases utilitarias `.theme-heading-font`, `.terminal-surface`, `.cyberpunk-surface`, `.retro-fx`, etc.  
- **Tema de lista** (`lists.theme`): no cambia la UI principal de la app; se usa para **embeds Discord** y está pensado para futura UI por lista.

### 6.2 QuickCritiqueModal (flujo actual)

1. Se abre desde **`ItemDetailsModal`** al marcar como visto o vía flujo “prompt comentario”.  
2. Estados locales: estrellas (1–5), reacción like/dislike **obligatoria** para enviar, textarea opcional (máx. 2000 caracteres).  
3. **Mejorar con IA**: `useEnhanceComment` → Groq (mismo stack que comentarios largos), con contexto opcional título/tipo/género/sinopsis pasado desde el modal de detalle.  
4. **Confirmar**: `onQuickCritiqueConfirm` → `saveQuickCritique` → cierra overlay y refresca caches según página.  
5. **Estilos**: panel alineado al tema (incl. retro: `retro-fx`, `--color-bg-secondary`, botones neobrutalistas, contador con `theme-heading-font`).

---

## 7. Infraestructura y variables de entorno

### 7.1 Variables documentadas en código (`src/vite-env.d.ts`)

| Variable | Uso |
|----------|-----|
| `VITE_SUPABASE_URL` | Proyecto Supabase. |
| `VITE_SUPABASE_ANON_KEY` | Clave anónima. |
| `VITE_VAPID_PUBLIC_KEY` | Suscripción push en navegador. |
| `VITE_TMDB_ACCESS_TOKEN` | Opcional; Bearer TMDB v3. |
| `VITE_GROQ_API_KEY` | Opcional; Oráculo y mejora de texto. |
| `VITE_OMDB_KEY` | Declarada en tipos; **la búsqueda productiva usa la Edge Function** con secret servidor — verificar si queda como legado. |

### 7.2 Secrets típicos en Supabase (Edge)

`OMDB_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`, claves VAPID, `PUSH_WEBHOOK_SECRET`, `PUBLIC_APP_URL` / `APP_BASE_URL` para Discord, etc.

### 7.3 Cuellos de botella y riesgos

| Área | Observación |
|------|-------------|
| **Bundle principal** | Chunk `index` ~800KB+ gzip ~250KB (build típico); conviene seguir con lazy routes y revisar dependencias pesadas. |
| **Imagen grande en repo** | Asset PNG ~1MB en `dist` (icono/logo); impacto en precache PWA. |
| **IA en cliente** | Cada consulta Oráculo / mejora dispara request a Groq desde el navegador; latencia y coste proporcionales al uso; key expuesta. |
| **Búsqueda** | Por tecla (tras debounce) se paralelizan TMDB + OMDB; sin TMDB solo OMDB, pero sigue habiendo invocación a función por query válida. |
| **Oráculo** | Dos queries Supabase (ratings + comments) + payload de prompt grande si hay muchos ítems comentados (comentarios truncados a 300 chars en prompt). |
| **Sincronización tema** | Lectura de perfil en cada montaje de `useTheme`; mitigado por React Query cache. |

---

## 8. Conclusión

**Qué es la app hoy:** cliente React moderno para gestionar listas compartidas de cine/series con ratings, comentarios, crítica rápida transaccional, recomendaciones LLM opcionales, notificaciones Discord opcionales por lista, PWA y tematización fuerte.

**Cómo está construida:** features por carpeta, TanStack Query + Supabase, RPC para invariantes de negocio, Edge Functions para secretos OMDB/push/Discord, TMDB y Groq opcionales en el cliente.

**Piezas que la componen:** Auth y perfiles Supabase, modelo lista/miembro/ítem/rating/comentario, migraciones incrementales 04–22, tres Edge Functions en repo, Oráculo + mejoras de texto vía Groq, sistema de tema dual (usuario global + tema de lista para Discord).

---

*Documento generado como referencia de contexto para expansiones futuras. Actualizar al incorporar nuevas migraciones, funciones o flujos críticos.*
