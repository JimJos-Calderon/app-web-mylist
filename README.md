# 🎬 Nuestra Lista - Gestor de Películas y Series

<div align="center">

![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.2.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-4.1.18-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-2.93.3-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

Una aplicación web moderna y elegante para gestionar **listas compartidas** de películas y series. Con diseño retro-futurista inspirado en los años 80, búsqueda inteligente con OMDB API, sistema de calificaciones, y autenticación segura con Supabase.

[✨ Demo](#) • [📖 Documentación](#características) • [🐛 Reportar Bug](../../issues)

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
- ⚡ **Cache inteligente** — Sistema de caché TTL para optimizar búsquedas repetidas en OMDB
- 📡 **Tiempo real** — Sincronización en vivo con Supabase Realtime Subscriptions
- 👤 **Perfiles de usuario** — Username, bio y avatar personalizable (subido a Supabase Storage)
- 🔒 **Ajustes de seguridad** — Cambio de email y contraseña con verificación
- 🎵 **Spotify integrado** — Cards de Spotify embebidas y arrastrables en el home (solo desktop)
- 📱 **Responsive** — Diseño adaptable a todos los dispositivos

---

## 🛠️ Stack Tecnológico

### Frontend
- **React 19** — Biblioteca UI de última generación
- **TypeScript 5.5** — Tipado estático para código robusto
- **Vite 7** — Build tool ultra-rápido
- **TailwindCSS 4** — Framework CSS utility-first (via plugin de Vite)
- **React Router DOM 7.13** — Navegación SPA
- **Framer Motion 12** — Animaciones fluidas
- **Swiper 12** — Biblioteca de carruseles (usada en la vista Ring)
- **Lucide React** — Iconos SVG modernos

### Backend & Servicios
- **Supabase** — Auth + PostgreSQL + Realtime + Storage
- **OMDB API** — Base de datos de películas y series

### Herramientas de Desarrollo
- **ESLint** — Linter para mantener código limpio
- **TypeScript ESLint** — Reglas específicas para TS
- **Terser** — Minificación de código para producción

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
VITE_OMDB_KEY=tu_omdb_api_key
```

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

5. **Configura Supabase Storage**

Crea un bucket público llamado `avatars` en Supabase Storage para las fotos de perfil.

6. **Inicia el servidor de desarrollo**
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

---

## 🔄 Migración desde versión anterior

Si tienes datos en la tabla `lista_items` (versión antigua), usa el archivo `migration-to-shared-lists.sql` incluido en la raíz del proyecto para migrar tus datos al nuevo esquema sin perder información.

---

## 🚀 Scripts Disponibles

```bash
npm run dev      # Inicia el servidor de desarrollo
npm run build    # Construye la aplicación para producción
npm run preview  # Previsualiza la build de producción
npm run lint     # Ejecuta el linter
```

---

## 📁 Estructura del Proyecto

```
app-web-mylist/
├── src/
│   ├── App.tsx                 # Componente raíz: routing, navbar, Spotify widgets
│   ├── main.tsx                # Entry point + AuthProvider
│   ├── index.css               # Estilos globales
│   ├── supabaseClient.ts       # Cliente de Supabase
│   ├── vite-env.d.ts           # Tipos de variables de entorno
│   │
│   ├── context/
│   │   └── AuthContext.tsx     # Proveedor global de autenticación
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
│   │   ├── SpotifyGlassCard.tsx# Embed de Spotify draggable (sólo desktop, solo Home)
│   │   └── ErrorAlert.tsx      # Componente de alerta de error
│   │
│   └── utils/
│       ├── cache.ts            # Caché en memoria con TTL configurable (30min por defecto)
│       └── validation.ts       # Validación y sanitización de títulos
│
├── public/                     # Assets estáticos
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
Ajusta `DEBOUNCE_DELAY` en `src/constants/index.ts` (por defecto: 300ms)

### Cambiar límite de sugerencias OMDB
Modifica `MAX_SUGGESTIONS` en `src/constants/index.ts` (por defecto: 10)

### TTL del caché de OMDB
Edita `src/utils/cache.ts`. El parámetro `ttlMinutes` controla cuánto tiempo se cachean las respuestas (por defecto: 30 minutos).

---

## 📝 Variables de Entorno

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `VITE_SUPABASE_URL` | URL de tu proyecto Supabase | ✅ Sí |
| `VITE_SUPABASE_ANON_KEY` | Clave anónima de Supabase | ✅ Sí |
| `VITE_OMDB_KEY` | API Key de OMDB | ✅ Sí |

---

## 🐛 Solución de Problemas

### Las imágenes no cargan
- Verifica que tu `VITE_OMDB_KEY` sea válida
- Algunas imágenes de OMDB pueden estar rotas; se mostrará un placeholder automáticamente

### Error de autenticación / RLS
- Verifica tus credenciales de Supabase en el `.env`
- Asegúrate de haber ejecutado todo el SQL de configuración, incluyendo las políticas RLS
- Si el error es solo en INSERT, revisa el archivo `fix-rls-insert-policy.sql`

### Build falla con "terser not found"
- Asegúrate de tener `terser` instalado: `npm install`
- Si el error persiste: `npm install terser --save-dev`

### Build falla
- Ejecuta `npm install` nuevamente
- Limpia la caché: `rm -rf node_modules .vite dist`
- Verifica que todas las variables de entorno estén configuradas

---

## 🚀 Deployment

### Render / Vercel / Netlify

1. **Configura las variables de entorno** en tu plataforma:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_OMDB_KEY`

2. **Build Command**: `npm install && npm run build`

3. **Output Directory**: `dist`

4. **Node Version**: 18 o superior

### Build Local para Producción

```bash
npm run build    # Genera la carpeta dist/
npm run preview  # Previsualiza la build localmente
```

> **Nota**: El proyecto incluye `terser` para minificación en producción. Si encuentras errores de build, asegúrate de ejecutar `npm install` antes de buildear.

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
- [Framer Motion](https://www.framer.com/motion/) por las animaciones
- [Lucide](https://lucide.dev) por los iconos

---

<div align="center">

⭐ Si te gusta este proyecto, dale una estrella en GitHub ⭐

Hecho con ❤️ y ☕

</div>
