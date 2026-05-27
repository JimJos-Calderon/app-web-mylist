# Documentación — WhichNext

Índice de la documentación técnica y operativa del proyecto **WhichNext** (listas compartidas de películas y series).

> El [README principal](../README.md) sigue siendo la carta de presentación del repo (características, badges, instalación resumida). Aquí encontrarás guías más detalladas y enlazadas entre sí.

---

## Guías

| Documento | Contenido |
|-----------|-----------|
| [GETTING_STARTED.md](./GETTING_STARTED.md) | Requisitos, `.env`, Supabase, migraciones, primer arranque |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Estructura del código, rutas, estado, flujos principales |
| [THEMES.md](./THEMES.md) | Temas visuales, tokens CSS, fondos animados (cyberpunk / terminal) |
| [DATABASE.md](./DATABASE.md) | Esquema, migraciones, RLS, RPCs relevantes |
| [INTEGRATIONS.md](./INTEGRATIONS.md) | OMDB, TMDB, Groq, Edge Functions |
| [TESTING.md](./TESTING.md) | Vitest, Playwright, CI |
| [USER_GUIDE.md](./USER_GUIDE.md) | Uso de la app para usuarios y administradores de lista |

### Defensa TFG / presentación académica

| Documento | Contenido |
|-----------|-----------|
| [tfg/README.md](./tfg/README.md) | Índice del material para tribunal |
| [tfg/PRESENTACION_TFG.md](./tfg/PRESENTACION_TFG.md) | Guion de defensa oral (**5–10 min**), demo, diapositivas y preguntas frecuentes |

---

## Operaciones y mantenimiento

| Documento | Contenido |
|-----------|-----------|
| [DISCORD_WEBHOOK.md](./DISCORD_WEBHOOK.md) | Rotar webhook de Discord por lista |
| [PUBLIC_ASSETS_CLEANUP.md](./PUBLIC_ASSETS_CLEANUP.md) | Assets en `public/`, PWA precache |
| [INFORME_AUDITORIA_TECNICA.md](./INFORME_AUDITORIA_TECNICA.md) | Informe de auditoría técnica (histórico) |

---

## Enlaces rápidos

- **Código frontend:** `src/`
- **Migraciones SQL:** `supabase/migrations/`
- **Edge Functions:** `supabase/functions/`
- **Variables de entorno de ejemplo:** [`.env.example`](../.env.example)
- **Sitio en producción:** [jandn.onrender.com](https://jandn.onrender.com/)

---

## Convenciones

- **Marca en UI:** WhichNext (`appTitle` en i18n).
- **Nombre del paquete npm:** `app-web-jimjos` (histórico).
- **Repositorio:** `app-web-mylist`.
- **Temas:** `cyberpunk` (por defecto), `terminal`, `retro-cartoon`; el tema «default» legacy se normaliza a `cyberpunk` en preferencias.

Si añades una guía nueva, regístrala en esta tabla para mantener el índice actualizado.
