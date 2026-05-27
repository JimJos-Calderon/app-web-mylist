# Primeros pasos

Guía para levantar **WhichNext** en local y conectar Supabase.

---

## Requisitos

- **Node.js** 18 o superior y **npm**
- Cuenta en [Supabase](https://supabase.com)
- API key de [OMDB](http://www.omdbapi.com/apikey.aspx) (para la Edge Function `search-omdb`)
- Opcional: token Bearer de [TMDB](https://www.themoviedb.org/settings/api), clave [Groq](https://console.groq.com/), DSN de [Sentry](https://sentry.io)

---

## 1. Clonar e instalar

```bash
git clone https://github.com/JimJos-Calderon/app-web-mylist.git
cd app-web-mylist
npm install
```

En **Windows PowerShell**, si `npm` falla por políticas de ejecución:

```powershell
npm.cmd install
npm.cmd run dev
```

---

## 2. Variables de entorno (frontend)

Copia [`.env.example`](../.env.example) a `.env` en la raíz:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Opcionales
# VITE_SENTRY_DSN=
# VITE_TMDB_ACCESS_TOKEN=
# VITE_VAPID_PUBLIC_KEY=

# E2E (Playwright)
# E2E_EMAIL=
# E2E_PASSWORD=
```

Solo las variables con prefijo `VITE_` llegan al bundle de Vite.

**No** pongas en `.env` del frontend:

| Secreto | Dónde va |
|---------|----------|
| `OMDB_API_KEY` | Supabase → Edge Functions → Secrets |
| `GROQ_API_KEY` | Supabase → Edge Functions → Secrets |

Véase [INTEGRATIONS.md](./INTEGRATIONS.md).

---

## 3. Base de datos

El esquema **no** se documenta como SQL suelto en el README: lo definen las migraciones en `supabase/migrations/`.

### Con Supabase CLI (recomendado)

```bash
supabase link --project-ref <tu_project_ref>
supabase db push
```

### Manual

En el **SQL Editor** de Supabase, ejecuta los archivos **en orden numérico** (desde `04_security_rls_and_constraints.sql` hasta `36_...`).

Resumen por bloques: [DATABASE.md](./DATABASE.md).

---

## 4. Edge Functions y secrets

En el panel de Supabase → **Edge Functions** → **Secrets**:

| Nombre | Uso |
|--------|-----|
| `OMDB_API_KEY` | Búsqueda en `search-omdb` |
| `GROQ_API_KEY` | IA en `ai-proxy` |

Despliegue (ejemplo):

```bash
npx supabase functions deploy search-omdb
npx supabase functions deploy ai-proxy
```

`ai-proxy` debe tener `verify_jwt = true` en [`supabase/config.toml`](../supabase/config.toml).

---

## 5. Storage

Crea un bucket público **`avatars`** en Supabase Storage para fotos de perfil.

---

## 6. Arrancar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173).

### Checklist

- [ ] Registro / login sin errores de RLS
- [ ] Crear lista e invitar
- [ ] Búsqueda OMDB devuelve sugerencias
- [ ] `npm run test` pasa
- [ ] `npm run build` termina sin error

---

## 7. Android (opcional)

```bash
npm run sincronizar   # build + cap sync
npm run android       # abre Android Studio
```

Configuración Capacitor: [`capacitor.config.ts`](../capacitor.config.ts).

---

## Siguiente lectura

- [ARCHITECTURE.md](./ARCHITECTURE.md) — cómo está organizado el código
- [THEMES.md](./THEMES.md) — personalizar apariencia
- [TESTING.md](./TESTING.md) — pruebas automatizadas
