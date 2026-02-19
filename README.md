# 🎬 Nuestra Lista - Gestor de Películas y Series

<div align="center">

![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.2.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-4.1.18-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-2.93.3-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

Una aplicación web moderna y elegante para gestionar una lista compartida de películas y series. Con diseño retro-futurista inspirado en los años 80, búsqueda inteligente con OMDB API y autenticación segura con Supabase.

[✨ Demo](#) • [📖 Documentación](#características) • [🐛 Reportar Bug](../../issues)

</div>

---

## 🌟 Características

- 🔐 **Autenticación segura** - Sistema completo de login/registro con Supabase
- 🎯 **Búsqueda inteligente** - Autocompletado con sugerencias en tiempo real de OMDB API
- 📊 **Gestión completa** - Agrega, elimina y marca películas/series como vistas
- 🎨 **Diseño único** - Interfaz retro-futurista con efectos cyberpunk
- 🔍 **Filtros avanzados** - Filtra por estado (vistas/pendientes), título y ordenamiento
- ⚡ **Cache inteligente** - Sistema de caché para optimizar búsquedas repetidas
- 📱 **Responsive** - Diseño adaptable a todos los dispositivos
- 🎭 **Separación por tipo** - Páginas dedicadas para películas y series

## 🛠️ Stack Tecnológico

### Frontend
- **React 19** - Biblioteca UI de última generación
- **TypeScript** - Tipado estático para código robusto
- **Vite** - Build tool ultra-rápido
- **TailwindCSS 4** - Framework CSS utility-first
- **React Router DOM 7.13** - Navegación entre páginas
- **Swiper 12** - Carrusel 3D para destacados

### Backend & Servicios
- **Supabase** - Backend as a Service (Auth + PostgreSQL)
- **OMDB API** - Base de datos de películas y series

### Herramientas de Desarrollo
- **ESLint** - Linter para mantener código limpio
- **TypeScript ESLint** - Reglas específicas para TS
- **Terser** - Minificación de código para producción

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

Ejecuta este SQL en tu proyecto de Supabase para crear la tabla:

```sql
-- Crear tabla de items
CREATE TABLE lista_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('pelicula', 'serie')),
  visto BOOLEAN DEFAULT false,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  poster_url TEXT,
  rating INTEGER CHECK (rating >= 0 AND rating <= 5),
  comentario TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security
ALTER TABLE lista_items ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
-- Los usuarios solo pueden ver sus propios items
CREATE POLICY "Users can view own items"
  ON lista_items FOR SELECT
  USING (auth.uid() = user_id);

-- Los usuarios solo pueden insertar items con su propio user_id
CREATE POLICY "Users can insert own items"
  ON lista_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Los usuarios solo pueden actualizar sus propios items
CREATE POLICY "Users can update own items"
  ON lista_items FOR UPDATE
  USING (auth.uid() = user_id);

-- Los usuarios solo pueden eliminar sus propios items
CREATE POLICY "Users can delete own items"
  ON lista_items FOR DELETE
  USING (auth.uid() = user_id);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_lista_items_user_id ON lista_items(user_id);
CREATE INDEX idx_lista_items_tipo ON lista_items(tipo);
CREATE INDEX idx_lista_items_visto ON lista_items(visto);
```

5. **Inicia el servidor de desarrollo**
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## 🚀 Scripts Disponibles

```bash
npm run dev      # Inicia el servidor de desarrollo
npm run build    # Construye la aplicación para producción
npm run preview  # Previsualiza la build de producción
npm run lint     # Ejecuta el linter
```

## 📁 Estructura del Proyecto

```
app-web-mylist/
├── src/
│   ├── components/       # Componentes reutilizables
│   │   ├── ErrorAlert.tsx
│   │   ├── FilterPanel.tsx
│   │   ├── ItemCard.tsx
│   │   ├── ListaContenido.tsx
│   │   └── SearchBar.tsx
│   ├── context/          # Context API de React
│   │   └── AuthContext.tsx
│   ├── hooks/            # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useFilters.ts
│   │   ├── useItems.ts
│   │   ├── useOmdb.ts
│   │   └── useSuggestions.ts
│   ├── pages/            # Páginas principales
│   │   ├── Login.tsx
│   │   ├── Peliculas.tsx
│   │   └── Series.tsx
│   ├── types/            # Definiciones TypeScript
│   │   └── index.ts
│   ├── utils/            # Utilidades
│   │   ├── cache.ts
│   │   └── validation.ts
│   ├── constants/        # Constantes globales
│   │   └── index.ts
│   ├── App.tsx           # Componente principal
│   ├── main.tsx          # Entry point
│   ├── index.css         # Estilos globales
│   └── supabaseClient.ts # Cliente de Supabase
├── public/               # Assets estáticos
├── .env                  # Variables de entorno (no commitear)
├── .gitignore           # Archivos ignorados por Git
├── index.html           # HTML principal
├── package.json         # Dependencias y scripts
├── tsconfig.json        # Configuración TypeScript
├── vite.config.ts       # Configuración Vite
└── eslint.config.js     # Configuración ESLint
```

## 🎯 Uso

### Pantalla de Login
1. Regístrate con tu email y contraseña
2. O inicia sesión si ya tienes cuenta

### Gestión de Películas/Series
1. **Buscar**: Escribe al menos 3 caracteres para ver sugerencias
2. **Agregar**: Haz clic en una sugerencia o presiona "OK" para agregar manualmente
3. **Marcar como vista**: Click en el checkbox del poster
4. **Eliminar**: Click en el botón de eliminar (🗑️)
5. **Filtrar**: Usa el panel de filtros para ordenar y buscar

### Filtros Disponibles
- 📋 **Pendientes**: Muestra solo las no vistas
- ✅ **Vistas**: Muestra solo las marcadas como vistas
- 🔤 **Ordenar**: Por fecha, título o calificación
- 🔍 **Buscar**: Filtro de texto en tiempo real

## 🎨 Diseño

El proyecto cuenta con un diseño **retro-futurista** inspirado en la estética cyberpunk de los años 80:

- Gradientes neón (cyan, purple, pink)
- Efectos de sombra y brillo
- Grid perspective en el fondo
- Transiciones suaves
- Tipografía bold e itálica

## 🔧 Configuración Avanzada

### Personalizar colores
Edita `src/index.css` para modificar los colores del tema.

### Modificar tiempo de debounce
Ajusta `DEBOUNCE_DELAY` en `src/constants/index.ts` (default: 300ms)

### Cambiar límite de sugerencias
Modifica `MAX_SUGGESTIONS` en `src/constants/index.ts` (default: 10)

## 📝 Variables de Entorno

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `VITE_SUPABASE_URL` | URL de tu proyecto Supabase | ✅ Sí |
| `VITE_SUPABASE_ANON_KEY` | Clave anónima de Supabase | ✅ Sí |
| `VITE_OMDB_KEY` | API Key de OMDB | ✅ Sí |

## 🐛 Solución de Problemas

### Las imágenes no cargan
- Verifica que tu `VITE_OMDB_KEY` sea válida
- Algunas imágenes de OMDB pueden estar rotas, se mostrará un placeholder

### Error de autenticación
- Verifica tus credenciales de Supabase
- Asegúrate de haber configurado las políticas RLS correctamente

### Build falla con "terser not found"
- Asegúrate de tener `terser` instalado: `npm install`
- Si el error persiste: `npm install terser --save-dev`
- Vite v3+ requiere terser como dependencia opcional para minificación

### Build falla
- Ejecuta `npm install` nuevamente
- Limpia la caché: `rm -rf node_modules .vite dist`
- Verifica que todas las variables de entorno estén configuradas

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

## 🤝 Contribuir

Las contribuciones son bienvenidas. Para cambios importantes:

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 👤 Autor

**JimJos**

- GitHub: [@JimJos-Calderon](https://github.com/JimJos-Calderon)

## 🙏 Agradecimientos

- [OMDB API](http://www.omdbapi.com) por la base de datos de películas
- [Supabase](https://supabase.com) por el excelente BaaS
- [Vite](https://vitejs.dev) por el increíble DX

---

<div align="center">

⭐ Si te gusta este proyecto, dale una estrella en GitHub ⭐

Hecho con ❤️ y ☕

</div>
