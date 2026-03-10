# 🎬 Nuestra Lista - Gestor de Películas y Series

<div align="center">

![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.2.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-4.1.18-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-2.93.3-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

Una aplicación web moderna y elegante para gestionar **listas compartidas** de películas y series. Con diseño retro-futurista inspirado en los años 80, búsqueda inteligente con OMDB API, sistema de calificaciones, y autenticación segura con Supabase.

[✨ WebSite](https://jandn.onrender.com/) • [📖 Documentación](#características) • [🐛 Reportar Bug](../../issues)

</div>

---

## 🌟 Características

- 🔐 **Autenticación segura** — Sistema completo de login/registro con Supabase
- 🎯 **Búsqueda inteligente** — Autocompletado con sugerencias en tiempo real de OMDB API
- 📋 **Listas compartidas** — Crea listas, invita a otras personas con un código y colabora en tiempo real
- 📊 **Gestión completa** — Agrega, elimina y marca películas/series como vistas
- ⭐ **Sistema de calificaciones** — Puntúa del 1 al 5 y marca con "me gusta / no me gusta"
- 🎨 **Diseño único** — Interfaz retro-futurista con efectos cyberpunk y animaciones
- 🔍 **Filtros avanzados** — Filtra por estado (vistas/pendientes), texto y ordenamiento
- 💎 **Dos modos de vista** — Grid clásico con paginación y carrusel Ring en 3D
- ⚡ **Cache inteligente** — React Query con persistencia local y política offline-first
- 📲 **PWA instalable** — Soporte de instalación nativa en Android (prompt) e iOS (Add to Home Screen)
- 📴 **Modo offline lectura** — Usuarios pueden seguir viendo listas/items cacheados sin conexión
- 📡 **Tiempo real** — Sincronización en vivo con Supabase Realtime Subscriptions
- 👤 **Perfiles de usuario** — Username, bio y avatar personalizable (subido a Supabase Storage)
- 🔒 **Ajustes de seguridad** — Cambio de email y contraseña con verificación
- 🎵 **Spotify integrado** — Cards de Spotify embebidas y arrastrables en el home (solo desktop)
- 📱 **Responsive** — Diseño adaptable a todos los dispositivos
- 🛡️ **Seguridad a nivel empresarial** — RLS en BD, Edge Functions con rate limiting, validaciones en cliente y servidor
- ✅ **Testing completo** — Unit tests (18 tests) + E2E tests con Playwright + CI/CD con GitHub Actions

---

## 🛠️ Stack Tecnológico

### Frontend
- **React 19** — Biblioteca UI de última generación
- **TypeScript 5.5** — Tipado estático para código robusto
- **Vite 7** — Build tool ultra-rápido
- **TailwindCSS 4** — Framework CSS utility-first (via plugin de Vite)
- **React Router DOM 7.13** — Navegación SPA
- **TanStack Query 5.90** — Gestión de estado asincrónico y caché
- **@tanstack/react-query-persist-client** — Persistencia de caché para modo offline
- **@tanstack/query-sync-storage-persister** — Persistencia en localStorage
- **vite-plugin-pwa** — Manifest + Service Worker (Workbox generateSW)
- **Swiper 12** — Biblioteca de carruseles (usada en la vista Ring)
- **Lucide React** — Iconos SVG modernos

### Backend & Servicios
- **Supabase** — Auth + PostgreSQL + Realtime + Storage + Edge Functions
- **OMDB API** — Base de datos de películas y series (acceso seguro vía Edge Function)
- **Supabase Edge Functions** — API segura con rate limiting (30 búsquedas/hora por usuario)

### Testing & CI/CD
- **Vitest 4.0** — Framework de testing rápido
- **@testing-library/react 16.3** — Testing de componentes React
- **Playwright** — Testing E2E en navegadores reales
- **GitHub Actions** — CI/CD automation (Node.js 18 & 20)

### Herramientas de Desarrollo
- **ESLint** — Linter para mantener código limpio
- **TypeScript ESLint** — Reglas específicas para TS
- **Terser** — Minificación de código para producción

---

## 🔐 Seguridad Implementada

### Edge Functions (Servidor)
- **search-omdb**: API segura que actúa como proxy para OMDB
  - ✅ Inyecta `OMDB_API_KEY` en el servidor (nunca expuesto al cliente)
  - ✅ Valida entrada: 2-100 caracteres, sin caracteres peligrosos (< > " ' % ; ( ) & +)
  - ✅ **Rate limiting**: 30 búsquedas por usuario/hora
  - ✅ Headers informativos: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
  - ✅ Responde 429 cuando se excede límite

### Row Level Security (RLS) en Base de Datos
Todos los accesos se filtran automáticamente por usuario:

- **items**: Solo ves items de listas donde eres miembro
- **lists**: Solo ves listas que posees o te invitaron
- **list_members**: Solo ves tus registros de membresía
- **item_ratings**: Solo ves/modificas tus propias calificaciones

### Check Constraints (Validación en BD)
Previene datos inválidos incluso sin validación frontend:

- `tipo` ∈ {'pelicula', 'serie'}
- `visto`, `liked`, `is_private` ∈ {true, false}
- `rating` ∈ [0, 5]
- `titulo`, `name` cumplen con longitudes mínimas y máximas
- `role` ∈ {'owner', 'admin', 'member'}

### Testing de Seguridad
- ✅ 18 unit tests de hooks con aislamiento de contexto
- ✅ 4 E2E tests de flujos críticos
- ✅ CI/CD en GitHub Actions (Node.js 18 & 20)

---

## 📦 Instalación

### Prerrequisitos

- Node.js 18+ y npm
- Cuenta en [Supabase](https://supabase.com)
- API Key de [OMDB API](http://www.omdbapi.com/apikey.aspx)

### Pasos

1. **Clona el repositorio**
```bash
git clone https://github.com/JimJos-Calderon/app-web-mylist.git
cd app-web-mylist
```

2. **Instala las dependencias**
```bash
npm install
```

3. **Configura las variables de entorno**

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

⚠️ **Importante**: `OMDB_API_KEY` se configura como Secret en Supabase (ver paso 5)

4. **Configura Supabase**

Ejecuta el siguiente SQL en tu proyecto de Supabase para crear todas las tablas necesarias:

```sql
-- ============================================================
-- TABLA PRINCIPAL DE ITEMS (películas y series)
-- ============================================================
CREATE TABLE items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('pelicula', 'serie')),
  visto BOOLEAN DEFAULT false,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  poster_url TEXT,
  genero TEXT,
  list_id UUID REFERENCES lists(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABLA DE LISTAS COMPARTIDAS
-- ============================================================
CREATE TABLE lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_private BOOLEAN DEFAULT false,
  invite_code VARCHAR(20) UNIQUE NOT NULL
);

-- ============================================================
-- TABLA DE MIEMBROS DE LISTAS (many-to-many)
-- ============================================================
CREATE TABLE list_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID REFERENCES lists(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role VARCHAR(20) DEFAULT 'member', -- 'owner', 'admin', 'member'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(list_id, user_id)
);

-- ============================================================
-- TABLA DE PERFILES DE USUARIO
-- ============================================================
CREATE TABLE user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA DE CALIFICACIONES POR ITEM
-- ============================================================
CREATE TABLE item_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  liked BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(item_id, user_id)
);

-- ============================================================
-- ÍNDICES PARA RENDIMIENTO
-- ============================================================
CREATE INDEX idx_items_user_id ON items(user_id);
CREATE INDEX idx_items_tipo ON items(tipo);
CREATE INDEX idx_items_list_id ON items(list_id);
CREATE INDEX idx_items_visto ON items(visto);
CREATE INDEX idx_lists_owner ON lists(owner_id);
CREATE INDEX idx_lists_invite_code ON lists(invite_code);
CREATE INDEX idx_list_members_list ON list_members(list_id);
CREATE INDEX idx_list_members_user ON list_members(user_id);
CREATE INDEX idx_item_ratings_item ON item_ratings(item_id);
CREATE INDEX idx_item_ratings_user ON item_ratings(user_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- ITEMS: ver los de listas donde soy miembro
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view items from their lists"
ON items FOR SELECT TO authenticated
USING (
  list_id IN (
    SELECT list_id FROM list_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert items to their lists"
ON items FOR INSERT TO authenticated
WITH CHECK (
  list_id IN (
    SELECT list_id FROM list_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update items in their lists"
ON items FOR UPDATE TO authenticated
USING (
  user_id = auth.uid()
  AND list_id IN (
    SELECT list_id FROM list_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own items"
ON items FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- LISTS
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view lists they belong to"
ON lists FOR SELECT TO authenticated
USING (
  owner_id = auth.uid()
  OR id IN (SELECT list_id FROM list_members WHERE user_id = auth.uid())
);

CREATE POLICY "Users can create lists"
ON lists FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update their lists"
ON lists FOR UPDATE TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete their lists"
ON lists FOR DELETE TO authenticated
USING (owner_id = auth.uid());

-- LIST_MEMBERS
ALTER TABLE list_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view members of their lists"
ON list_members FOR SELECT TO authenticated
USING (
  list_id IN (SELECT list_id FROM list_members WHERE user_id = auth.uid())
);

CREATE POLICY "Users can join lists (self insert)"
ON list_members FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owners can manage members"
ON list_members FOR ALL TO authenticated
USING (
  list_id IN (SELECT id FROM lists WHERE owner_id = auth.uid())
);

-- USER_PROFILES
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
ON user_profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage own profile"
ON user_profiles FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ITEM_RATINGS
ALTER TABLE item_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all ratings"
ON item_ratings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage own ratings"
ON item_ratings FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
```

**O mejor aún**: Usa el archivo de migración incluido:
- Archivo: `supabase/migrations/04_security_rls_and_constraints.sql`
- Contiene: RLS completo + Check Constraints + Índices optimizados
- Ejecución en Supabase: SQL Editor → Copiar contenido → Run

5. **Configura Supabase Edge Functions & Secrets**

En tu proyecto [Supabase](https://app.supabase.com):

1. Ve a **Edge Functions** → **Secrets**
2. Crea un nuevo secret:
   - **Nombre**: `OMDB_API_KEY`
   - **Valor**: Tu API key de OMDB
3. Guarda

La Edge Function `search-omdb` usará este secret automáticamente.

6. **Configura Supabase Storage**

Crea un bucket público llamado `avatars` en Supabase Storage para las fotos de perfil.

7. **Verifica la instalación**

Inicia el servidor:
```bash
npm run dev
```

La aplicación debería estar en `http://localhost:5173`

**Checklist**:
- ✅ Puedes registrarte/iniciar sesión
- ✅ Las listas se cargan sin errores de RLS
- ✅ La búsqueda de películas funciona (a través de Edge Function)
- ✅ Los tests pasan: `npm run test`
- ✅ El build es exitoso: `npm run build`

---

## 🔄 Migración desde versión anterior

Si tienes datos en la tabla `lista_items` (versión antigua), usa el archivo `migration-to-shared-lists.sql` incluido en la raíz del proyecto para migrar tus datos al nuevo esquema sin perder información.

---

## 🚀 Scripts Disponibles

```bash
npm run dev              # Inicia el servidor de desarrollo
npm run build            # Construye la aplicación para producción
npm run preview          # Previsualiza la build de producción
npm run lint             # Ejecuta el linter

# Testing
npm run test             # Ejecuta tests unitarios (Vitest)
npm run test:ui          # Interfaz visual de Vitest
npm run test:coverage    # Reporte de cobertura de tests
npm run test:e2e         # Ejecuta tests E2E (Playwright)
npm run test:e2e:ui      # UI de Playwright (modo debug)
```

---

## 📁 Estructura del Proyecto

```
app-web-mylist/
├── src/
│   ├── App.tsx                 # Componente raíz: routing, navbar, Spotify widgets
│   ├── main.tsx                # Entry point + PersistQueryClientProvider + AuthProvider
│   ├── index.css               # Estilos globales
│   ├── supabaseClient.ts       # Cliente de Supabase
│   ├── vite-env.d.ts           # Tipos de variables de entorno
│   │
│   ├── config/
│   │   ├── queryClient.ts      # Config global React Query (offlineFirst)
│   │   ├── queryKeys.ts        # Query keys centralizadas
│   │   └── queryPersistence.ts # Persistencia local de cache (TanStack)
│   │
│   ├── context/
│   │   └── AuthContext.tsx     # Proveedor global + limpieza de cache al cerrar sesión
│   │
│   ├── types/
│   │   └── index.ts            # Interfaces TypeScript (User, ListItem, List, ListMember…)
│   │
│   ├── constants/
│   │   └── index.ts            # OMDB URL, DEBOUNCE_DELAY, mensajes de error/éxito
│   │
│   ├── hooks/
│   │   ├── useAuth.ts          # Consume el AuthContext
│   │   ├── useItems.ts         # CRUD de items + Supabase Realtime subscriptions
│   │   ├── useLists.ts         # Gestión de listas: crear, unirse, miembros
│   │   ├── useFilters.ts       # Estado de filtros (visto/pendiente, orden, búsqueda)
│   │   ├── useOmdb.ts          # Llamadas a OMDB API (poster, sinopsis, género)
│   │   ├── useSuggestions.ts   # Autocompletado con debounce
│   │   ├── useUserProfile.ts   # Perfil: guardar, subir avatar, actualizar bio
│   │   ├── useItemRating.ts    # Rating (1-5 estrellas) y like/dislike por item
│   │   └── useUsername.ts      # Utilidad de nombre de usuario
│   │
│   ├── pages/
│   │   ├── Login.tsx           # Formulario de login y registro
│   │   ├── Peliculas.tsx       # Página de películas (usa ListaContenido)
│   │   ├── Series.tsx          # Página de series (usa ListaContenido)
│   │   ├── Perfil.tsx          # Perfil del usuario con sus calificaciones
│   │   └── Ajustes.tsx         # Editar perfil, cambiar email y contraseña
│   │
│   ├── components/
│   │   ├── ListaContenido.tsx  # Componente principal: búsqueda, filtros, grid, paginación, modal
│   │   ├── ItemCard.tsx        # Tarjeta de ítem individual
│   │   ├── SearchBar.tsx       # Input de búsqueda con dropdown de sugerencias
│   │   ├── FilterPanel.tsx     # Panel de filtros (estado, orden, texto)
│   │   ├── RingSlider.tsx      # Vista alternativa: carrusel 3D tipo Ring
│   │   ├── RatingWidget.tsx    # Widget de estrellas + like/dislike
│   │   ├── ListSelector.tsx    # Selector desplegable de lista activa
│   │   ├── ListDialogs.tsx     # Modales: crear lista e invitar usuarios
│   │   ├── ConfirmDialog.tsx   # Diálogo de confirmación genérico
│   │   ├── InstallPwaPrompt.tsx# Botón de instalación PWA con beforeinstallprompt
│   │   ├── OptimizedImage.tsx  # Imagen lazy + placeholder + fallback i18n
│   │   ├── SpotifyGlassCard.tsx# Embed de Spotify draggable (sólo desktop, solo Home)
│   │   └── ErrorAlert.tsx      # Componente de alerta de error
│   │
│   └── utils/
│       └── validation.ts       # Validación y sanitización de títulos
│
├── public/                     # Assets estáticos + iconos PWA/iOS
├── migration-to-shared-lists.sql  # Script SQL de migración desde esquema antiguo
├── fix-rls-insert-policy.sql      # Fix de política RLS de inserción
├── .env                        # Variables de entorno (no commitear)
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── eslint.config.js
```

---

## 🎯 Uso

### Pantalla de Login
1. Regístrate con tu email y contraseña
2. O inicia sesión si ya tienes cuenta

### Gestión de Listas
1. **Crear lista**: Haz click en "Crear lista" para crear una nueva colección
2. **Invitar**: Comparte el código de invitación con quien quieras
3. **Unirse**: Introduce el código de invitación en Ajustes para unirte a una lista ajena
4. **Cambiar lista activa**: Usa el selector de lista en la parte superior de Películas/Series

### Gestión de Películas/Series
1. **Buscar**: Escribe al menos 3 caracteres para ver sugerencias de OMDB
2. **Agregar**: Haz clic en una sugerencia o presiona "OK" para agregar manualmente
3. **Marcar como vista**: Click en el checkbox de la tarjeta
4. **Calificar**: Usa el widget de estrellas (1-5) y los botones de "me gusta / no me gusta"
5. **Detalles**: Haz click en una tarjeta para ver la sinopsis y acciones
6. **Eliminar**: Botón de eliminar en el modal de detalles (solo el creador puede hacerlo)

### Modos de Vista
- 📋 **Grid**: Vista en cuadrícula con paginación (9 items por página)
- 💎 **Ring**: Carrusel 3D, ideal para navegar visualmente

### Filtros Disponibles
- 📋 **Pendientes**: Muestra solo las no vistas
- ✅ **Vistas**: Muestra solo las marcadas como vistas
- 🔤 **Ordenar**: Por fecha, título A-Z o calificación
- 🔍 **Buscar**: Filtro de texto en tiempo real sobre la lista actual

### Perfil y Ajustes
- **Perfil** (`/perfil`): Muestra tus estadísticas de calificaciones y las películas/series que has valorado
- **Ajustes** (`/ajustes`): Edita tu username, bio y foto de perfil; cambia tu email o contraseña

---

## 🗺️ Rutas

| Ruta | Página | Descripción |
|------|--------|-------------|
| `/` | Home | Bienvenida + Spotify widgets arrastrables |
| `/peliculas` | Películas | Gestión completa de películas |
| `/series` | Series | Gestión completa de series |
| `/perfil` | Perfil | Estadísticas y calificaciones del usuario |
| `/ajustes` | Ajustes | Edición de perfil, email y contraseña |

---

## 🎨 Diseño

El proyecto cuenta con un diseño **retro-futurista** inspirado en la estética cyberpunk de los años 80:

- Fondo negro con gradientes neón (cyan, purple, pink)
- Grid de perspectiva animado en el fondo
- Efectos de sombra y brillo (box-shadow neon)
- Transiciones y micro-animaciones suaves
- Tipografía bold e itálica con letter-spacing
- Glassmorphism en modales y menús (`backdrop-blur`)

---

## 🔧 Configuración Avanzada

### Personalizar colores
Edita `src/index.css` para modificar los colores del tema.

### Modificar tiempo de debounce
Ajusta `DEBOUNCE_DELAY` en `src/features/shared/model/constants.ts` (por defecto: 300ms)

### Cambiar límite de sugerencias OMDB
Modifica `MAX_SUGGESTIONS` en `src/features/shared/model/constants.ts` (por defecto: 10)

### Configurar TTL del caché
La gestión de caché se realiza con React Query + persistencia local. Ajusta estos valores en `src/config/queryClient.ts` y `src/config/queryPersistence.ts`:

- `staleTime`: 5 min
- `gcTime`: 24 h
- `networkMode`: `offlineFirst` para queries y `online` para mutations
- `maxAge` de persistencia: 24 h

La app persiste solo claves de lectura offline (`lists`, `items`, `userProfile`).

### Configuración PWA
La configuración del manifest y Workbox está en `vite.config.ts` usando `vite-plugin-pwa` con estrategia `generateSW`.

Archivos de iconos requeridos en `public/`:

- `pwa-192x192.png`
- `pwa-512x512.png`
- `pwa-512x512-maskable.png`
- `apple-touch-icon.png`
- `masked-icon.svg`

Metadatos iOS: `index.html` incluye `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, `apple-mobile-web-app-title` y `apple-touch-icon`.

### Probar PWA localmente
Para validar instalación y service worker, usa build de producción:

```bash
npm run build
npm run preview
```

En Chrome: `Application > Manifest` y `Application > Service Workers`.

---

## 📝 Variables de Entorno

### Frontend (.env)

| Variable | Descripción | Requerida |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | URL de tu proyecto Supabase | ✅ Sí |
| `VITE_SUPABASE_ANON_KEY` | Clave anónima de Supabase | ✅ Sí |

### Supabase Edge Functions Secrets

| Variable | Descripción | Configuración |
|----------|-------------|----------|
| `OMDB_API_KEY` | API Key de OMDB (protegida en servidor) | Supabase → Edge Functions → Secrets |

**Nota importante**: `OMDB_API_KEY` se mantiene **seguro en el servidor** y **NUNCA se expone en el frontend**. Las llamadas a OMDB se hacen a través de la Edge Function `search-omdb` que inyecta la clave automáticamente.

---

## 🐛 Solución de Problemas

### PWA y Offline
- **No aparece el botón "Instalar App"**: verifica que estás en `npm run preview` (o en producción HTTPS), no solo en `npm run dev`.
- **Manifest con `icon ... failed to load`**: confirma que existen los iconos en `public/` con los nombres exactos.
- **Android no sugiere instalación**: revisa que el Service Worker esté activo y el manifest no tenga errores críticos.
- **iOS no dispara `beforeinstallprompt`**: comportamiento esperado; usar Safari → Compartir → Añadir a pantalla de inicio.
- **Datos de otro usuario después de logout**: el cierre de sesión limpia caché en memoria y persistida; si no se refleja, fuerza recarga completa.

### Seguridad y RLS
- **Error 500 con RLS**: Verifica que has ejecutado el archivo `04_security_rls_and_constraints.sql`
- **No veo mis listas/items**: Confirma que ejecutaste las políticas RLS correctamente
- **Rate limit excedido (429)**: Esperaré 1 hora o contacta al admin para reset manual

### Edge Functions
- **Error en búsqueda**: Verifica que `OMDB_API_KEY` está configurado en Supabase Secrets
- **Búsqueda muy lenta**: Puede ser el límite de rate limiting (30/hora), espera o usa otra cuenta
- **Error de validación en búsqueda**: Asegúrate de escribir 2-100 caracteres, sin caracteres especiales

### API y Datos
- **Las imágenes no cargan**: Verifica que `OMDB_API_KEY` sea válida. Algunas películas no tienen póster (placeholder automático)
- **Error de autenticación / RLS**: Verifica tus credenciales de Supabase en el `.env`
- **Datos inconsistentes**: Asegúrate de haber ejecutado ALL los archivos SQL de migración

### Build
- **Build falla con "terser not found"**: Ejecuta `npm install && npm run build`
- **Build falla por TypeScript**: Ejecuta `npm run lint` para ver errores de tipo
- **Errores de módulos**: Limpia y reinstala: `rm -rf node_modules && npm install`

### Testing
- **Tests fallan en CI/CD**: GitHub Actions usa Ubuntu. Si los tests pasan localmente pero fallan en CI, puede ser un tema de timeouts. Aumenta el timeout en `.github/workflows/ci.yml`
- **E2E tests lentos**: Los tests E2E pueden tardar según tu conexión a internet. Defaults: 2 minutos por suite

---

## 🚀 Deployment

### Vercel / Netlify / Render

1. **Configura las variables de entorno** en tu plataforma:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

   **Nota**: `OMDB_API_KEY` NO va en el frontend. Se configura como Secret en Supabase.

2. **Build Command**: `npm install && npm run build`

3. **Output Directory**: `dist`

4. **Node Version**: 18 o superior

5. **Para soporte PWA real en móviles**:
  - Despliega en **HTTPS** (requisito para service worker fuera de localhost)
  - Verifica en Android que el prompt de instalación aparezca
  - En iOS, valida flujo manual de "Añadir a pantalla de inicio"

6. **Configura en Supabase** (este paso es crucial):
   - Ve a tu proyecto Supabase
   - Edge Functions → Secrets
   - Agrega `OMDB_API_KEY` con tu API key

### Build Local para Producción

```bash
npm run build    # Genera la carpeta dist/
npm run preview  # Previsualiza la build localmente
```

> **Nota**: El proyecto incluye `terser` para minificación en producción. Si encuentras errores de build, asegúrate de ejecutar `npm install` antes de buildear.

### Verificación Pre-Deployment

```bash
npm run lint              # Verifica código
npm run test              # Ejecuta tests unitarios
npm run test:e2e          # Ejecuta tests E2E
npm run build             # Compila para producción
npm run preview           # Prueba la build
```

## 🔧 Arquitectura de Edge Functions

### search-omdb Function

**Ubicación**: `supabase/functions/search-omdb/index.ts`

**Propósito**: Proxy seguro para OMDB API que:
1. Inyecta `OMDB_API_KEY` desde Supabase Secrets (no expuesto en cliente)
2. Valida input del usuario
3. Aplica rate limiting (30 búsquedas/hora por usuario)
4. Retorna resultados formatados con headers de rate limit

**Cómo se invoca desde el frontend**:
```typescript
const { data, error } = await supabase.functions.invoke('search-omdb', {
  body: {
    query: 'Inception',
    type: 'movie',  // 'movie' | 'series' | 'episode'
    page: 1,         // 1-10
  },
})
```

**Headers de respuesta**:
- `X-RateLimit-Limit`: 30 (límite máximo)
- `X-RateLimit-Remaining`: Búsquedas restantes
- `X-RateLimit-Reset`: Segundos hasta reset

**Códigos de error**:
- `200`: OK
- `400`: Validación de entrada fallida
- `429`: Rate limit excedido
- `500`: Error interno

---

## ✅ Testing

### Estructura de Tests

```
src/
├── hooks/
│   ├── useItems.test.tsx        # 5 tests
│   ├── useLists.test.tsx        # 6 tests
│   └── useItemRating.test.tsx   # 7 tests
└── test-utils.tsx              # Wrapper de React Query

tests/
└── home.spec.ts                 # 4 E2E tests
```

### Ejecutar Tests

```bash
# Unit tests con Vitest
npm run test                # Modo watch
npm run test:ui             # Interfaz visual
npm run test:coverage       # Reporte de cobertura

# E2E tests con Playwright
npm run test:e2e            # Headless
npm run test:e2e:ui         # Con navegador visible
```

### CI/CD Workflow

**Archivo**: `.github/workflows/ci.yml`

**Triggers**: Push o PR a `main` / `develop`

**Jobs**:
1. **lint-and-test** (Matrix: Node 18, 20)
   - ESLint
   - Vitest (unit tests)
   - Build verification

2. **e2e-tests** (Chromium)
   - Playwright tests
   - Retries automáticos
   - Timeout: 2 minutos

3. **build-success** 
   - Status final

**Badge**: Puedes agregar a tu README:
```markdown
[![CI/CD Pipeline](https://github.com/JimJos-Calderon/app-web-mylist/actions/workflows/ci.yml/badge.svg)](https://github.com/JimJos-Calderon/app-web-mylist/actions/workflows/ci.yml)
```

---

## 🤝 Contribuir

Las contribuciones son bienvenidas. Para cambios importantes:

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

---

## 👤 Autor

**JimJos**

- GitHub: [@JimJos-Calderon](https://github.com/JimJos-Calderon)

---

## 🙏 Agradecimientos

- [OMDB API](http://www.omdbapi.com) por la base de datos de películas
- [Supabase](https://supabase.com) por el excelente BaaS
- [Vite](https://vitejs.dev) por el increíble DX
- [Vite Plugin PWA](https://vite-pwa-org.netlify.app/) por la integración de PWA y Workbox
- [Lucide](https://lucide.dev) por los iconos

---

<div align="center">

⭐ Si te gusta este proyecto, dale una estrella en GitHub ⭐

Hecho con ❤️ y ☕

</div>
