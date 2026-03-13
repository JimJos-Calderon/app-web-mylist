# Documento de Sistema de Diseno y Estilos

Fecha de levantamiento: 2026-03-12
Rol de analisis: Lead UI/UX Engineer
Alcance: estado actual implementado en codigo (sin propuestas ni cambios)

## 0. Fuentes Analizadas

- index.html
- src/index.css
- vite.config.ts
- package.json
- src/App.tsx
- src/pages/Login.tsx
- src/features/shared/components/*
- src/features/items/components/*
- src/features/lists/components/*

## 1. Stack de Estilos y Herramientas

### 1.1 Estilizado principal

- Tailwind CSS v4 como sistema principal de estilos utilitarios.
- Integracion via plugin oficial de Vite: @tailwindcss/vite.
- Estilos globales en src/index.css.
- Estilos de componentes escritos inline en className dentro de archivos TSX (sin capa de tokens centralizada por componente).
- Se importan estilos de Swiper desde CSS global:
  - swiper/css
  - swiper/css/effect-coverflow
  - swiper/css/pagination

### 1.2 Tecnologias NO usadas para estilos

- No se detecta tailwind.config.js (configuracion por defecto + utilidades directas).
- No se detecta CSS Modules.
- No se detecta Styled Components ni Emotion.
- No se detecta libreria de utilidades de variantes tipo class-variance-authority.

### 1.3 Animaciones

- Animaciones CSS nativas y utilidades Tailwind:
  - animate-spin
  - animate-pulse
  - transition-all / transition-colors / transition-transform
- Keyframes custom en src/index.css:
  - gradient-animation
  - grow
  - spotify-card-enter
- Carrusel/animacion 3D con Swiper (EffectCoverflow).
- Manejo de reduced motion tanto por CSS (@media prefers-reduced-motion) como por hook (useReducedMotion).

### 1.4 Librerias de UI base

- No se detecta libreria de componentes base tipo Radix UI, shadcn/ui o Headless UI.
- El sistema de componentes es custom con React + Tailwind.

## 2. Paleta de Colores y Tipografia

## 2.1 Base de color (tema oscuro)

### Fondo / neutrales

- Fondo global principal: #050505
- color-scheme: dark
- Gradiente base de fondo: radial-gradient(circle at top right, #701a75, #050505)
- Gama neutral recurrente (Tailwind):
  - zinc-950, zinc-900, zinc-800, zinc-700, zinc-400
  - slate-950, slate-900, slate-800, slate-700, slate-400

### Acentos primarios cyberpunk

- Cyan:
  - cyan-300, cyan-400, cyan-500, cyan-950
  - Referencias explicitas: #22d3ee (focus ring), #06b6d4 (cyan-500 en sombras rgba)
- Pink / Magenta:
  - pink-300, pink-400, pink-500, pink-600, pink-700, pink-900
  - Referencias explicitas: #f472b6, #ec4899
- Purple / Violet:
  - purple-300, purple-400, purple-500, purple-600, purple-700, purple-900, purple-950
  - violet-500
- Fuchsia de apoyo:
  - fuchsia-300

### Estados y semanticos

- Exito: green-400, green-500
- Error: red-300, red-400, red-500, red-600
- Warning: amber-400, amber-500
- Secundarios de soporte: blue-400, blue-500, blue-600, orange-400, orange-500

### Valores RGB/RGBA usados para glow/neon (custom)

- Cyan glow: rgba(0,255,255,0.4), rgba(0,255,255,0.6), rgba(34,211,238,0.45)
- Pink glow: rgba(236,72,153,0.6), rgba(219,39,119,0.5)
- Purple glow: rgba(168,85,247,0.5)
- Red glow (errores/destructivo): rgba(239,68,68,0.5)

## 2.2 Tipografia

### Fuentes cargadas

- Nippo (Fontshare) en index.html
- Pramukh Rounded (Fontshare) en index.html

### Aplicacion tipografica

- Body global: Pramukh Rounded, sans-serif.
- Navbar: Nippo, sans-serif.
- Titulares y llamados visuales:
  - uso frecuente de font-black
  - uppercase
  - tracking estrecho o muy expandido (tracking-tight, tracking-widest)
  - cursiva en titulos destacados (italic)

## 3. ADN Cyberpunk (Efectos y Animaciones)

## 3.1 Como se construye el look cyberpunk

### Capas y atmosfera

- Fondos negros profundos con gradientes neon:
  - from-black via-purple-900/10 to-black
  - from-cyan-500/20 via-blue-500/20 to-pink-500/20
- Overlays de grid/perspectiva en listas y carrusel (lineas neon sobre fondo oscuro).
- Uso repetido de backdrop-blur (sm, md, lg, xl) para efecto glassmorphism.

### Brillos y resplandores

- Sombras personalizadas con valores arbitrarios:
  - shadow-[0_0_30px_rgba(0,255,255,0.4)]
  - shadow-[0_0_25px_rgba(219,39,119,0.5)]
  - shadow-[0_0_60px_rgba(6,182,212,0.2)]
- Drop shadows de iconos y headings:
  - drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]
- Bordes transluidos en colores de acento:
  - border-cyan-500/30
  - border-pink-500/30
  - border-purple-500/30

### Estados hover/focus

- Hover orientado a neon:
  - incremento de brillo (hover:shadow-[...])
  - cambio de borde a tonos mas luminosos (hover:border-cyan-400)
  - microtransformaciones (hover:scale-105, hover:-translate-y-2)
- Focus accesible global en CSS:
  - :focus-visible con outline cyan y halo neon
  - variantes para input, textarea, select, buttons y links
  - soporte de navegacion por teclado sin perder identidad visual

## 3.2 Animaciones estandar frecuentes

### A. Loading/spinners

- animate-spin en loaders de login, listas, activity feed y dialogs.
- Utilizacion de bordes parciales coloreados para simular aro neon.

### B. Pulse/skeleton

- animate-pulse en placeholders de imagen, skeletons de seccion y widgets.

### C. Entradas/salidas visuales

- animate-in + fade-in + zoom-in en modales, alertas y pantallas.
- transiciones tipicas: duration-200, duration-300, duration-500, duration-700.

### D. Carrusel cinematico

- Swiper con EffectCoverflow:
  - profundidad, rotacion y escalado del slide activo.
  - glows diferenciales para slide activo vs lateral.

### E. Animaciones custom globales

- gradient-animation (fondo animado)
- spotify-card-enter (entrada de tarjeta)
- grow (barra de progreso en flujo JoinList)

### F. Reduced motion

- Se desactivan animaciones continuas cuando el usuario prefiere menor movimiento.
- Se reducen duraciones y se evita scale agresivo en entradas.

## 4. Componentes Base Compartidos

Nota estructural: no existe hoy un kit atomico centralizado tipo Button/Input/Card unificados; los patrones se repiten por composicion en componentes feature y shared.

## 4.1 Shared (reutilizables transversales)

### ConfirmDialog

- Ubicacion: src/features/shared/components/ConfirmDialog.tsx
- Tipo: modal de confirmacion destructiva.
- Props:
  - isOpen
  - title
  - message
  - confirmText
  - cancelText
  - onConfirm
  - onCancel
- Estilo por defecto: fondo oscuro, acento rojo, glow rojo, CTA destructiva en gradiente rojo.

### ErrorAlert

- Ubicacion: src/features/shared/components/ErrorAlert.tsx
- Tipo: alerta inline de error con autocierre.
- Props:
  - message
  - onClose
- Estilo por defecto: bloque rojo transluscido + icono, animacion slide-in.

### GlobalErrorFallback

- Ubicacion: src/features/shared/components/GlobalErrorFallback.tsx
- Tipo: pantalla completa de error no recuperado.
- Props: FallbackProps de react-error-boundary.
- Estilo por defecto: gradiente oscuro, icono warning, CTA reintentar + volver a inicio.

### SectionErrorFallback

- Ubicacion: src/features/shared/components/SectionErrorFallback.tsx
- Tipo: fallback parcial para una seccion.
- Props:
  - error
  - resetErrorBoundary
- Estilo por defecto: compacto, warning ambar, boton retry neutral oscuro.

### InstallPwaPrompt

- Ubicacion: src/features/shared/components/InstallPwaPrompt.tsx
- Tipo: boton flotante de instalacion PWA.
- Props: sin props.
- Estilo por defecto: boton pill con gradiente cyan/blue/pink + glow cyan.

### LanguageSwitcher

- Ubicacion: src/features/shared/components/LanguageSwitcher.tsx
- Tipo: toggle ES/EN.
- Props: sin props.
- Estilo por defecto: pill transluscido purple/pink con indicador de estado.

### OptimizedImage

- Ubicacion: src/features/shared/components/OptimizedImage.tsx
- Tipo: imagen con lazy loading + fallback.
- Props:
  - src
  - alt
  - className
  - fallbackElement
  - onError
- Estilo por defecto: skeleton pulse, transicion de opacidad al cargar.

### SpotifyGlassCard

- Ubicacion: src/features/shared/components/SpotifyGlassCard.tsx
- Tipo: tarjeta glassmorphism para embed.
- Props:
  - spotifyUrl
  - accentColor
  - isDragging
- Estilo por defecto: efecto vidrio + glow posterior configurable por color.

## 4.2 Base UI en features (patrones reutilizados)

### SearchBar

- Ubicacion: src/features/items/components/SearchBar.tsx
- Props de estilo/comportamiento:
  - placeholder
  - loading
  - showDropdown
  - suggestions
  - onSuggestionSelect
- Apariencia: input neon cyan con boton gradiente pink/purple + dropdown oscuro con borde pink.

### ItemCard

- Ubicacion: src/features/items/components/ItemCard.tsx
- Props de estilo/comportamiento:
  - isOwn
  - disableVistoEffect
- Apariencia: card rounded grande, glass dark, bordes cyan/pink segun ownership, hover con elevacion y glow.

### FilterPanel

- Ubicacion: src/features/items/components/FilterPanel.tsx
- Props relevantes:
  - filters
  - onFilterChange
  - onReset
  - sortOptions
- Apariencia: panel neutral glass (slate), controles con focus cyan.

### RatingWidget

- Ubicacion: src/features/items/components/RatingWidget.tsx
- Props:
  - itemId
  - onlyOwn
- Apariencia: estrellas cyan, like/dislike pink/purple, menu contextual oscuro.

### ListDialogs (CreateListDialog / InviteDialog)

- Ubicacion: src/features/lists/components/ListDialogs.tsx
- Props:
  - open
  - onClose
  - onCreated (create)
  - list (invite)
- Apariencia: modal portal, overlay blur, header con linea de brillo y acentos pink/cyan.

### ListSelector

- Ubicacion: src/features/lists/components/ListSelector.tsx
- Props:
  - lists
  - currentList
  - onChange
  - loading
- Apariencia: select clasico gris (menos cyberpunk que el resto; estilo mas utilitario).

### ActivityFeed

- Ubicacion: src/features/lists/components/ActivityFeed.tsx
- Props:
  - listId
  - limit
  - className
- Apariencia: timeline oscuro con acento cyan/purple, dots neon y estados loading/error/empty.

### StatsWidget

- Ubicacion: src/features/items/components/StatsWidget.tsx
- Props:
  - items
  - userOwnerId
  - size (small|large)
- Apariencia: 4 tarjetas metricas con gradientes semanticos (cyan, green, purple, pink).

## 5. Variables Globales

En :root no hay variables CSS custom tipo --token.

Solo se definen propiedades globales:

- background-color: #050505
- color-scheme: dark

Adicionalmente existen utilidades globales en CSS (no variables):

- .background-animate
- .scrollbar-thin
- .scrollbar-thumb-pink-500/50
- .scrollbar-none
- .spotify-card-enter
- .text-muted

## 6. Conclusiones Descriptivas para Consultoria Externa

- El sistema visual actual esta fuertemente orientado a dark cyberpunk con acentos neon cyan/pink/purple.
- La consistencia estilistica viene de patrones repetidos de clases Tailwind en componentes, no de un set atomico de primitives centralizado.
- Hay buena base de accesibilidad visual en focus-visible y reduced motion, integrada al estilo de marca.
- Existen componentes shared maduros para error, imagen, modales y microinteracciones, y componentes feature reutilizables que funcionan como UI base de facto (SearchBar, ItemCard, FilterPanel, ActivityFeed).
- El documento representa estado actual; no incluye propuestas de rediseno ni refactor.
