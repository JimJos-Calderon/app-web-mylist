# Temas visuales

WhichNext ofrece tres temas de preferencia de usuario, persistidos en `user_profiles.theme_preference` y aplicados como `data-theme` en `<html>`.

| ID | Descripción |
|----|-------------|
| `cyberpunk` | Neón magenta/cyan/amarillo, Orbitron — **tema por defecto** |
| `terminal` | Verde fósforo, Share Tech Mono, estética consola |
| `retro-cartoon` | Neubrutalismo, Space Meatball, bordes negros gruesos |

El valor legacy `default` se normaliza a `cyberpunk` en [`appPreferences.ts`](../src/config/appPreferences.ts).

---

## Cómo se aplica el tema

1. Al arrancar: `getPersistedTheme()` → `applyThemeToDocument()`.
2. Con sesión: `useTheme` lee/escribe `theme_preference` en Supabase.
3. CSS: selectores `[data-theme="…"]` y variables en [`src/index.css`](../src/index.css).

Clases utilitarias por tema:

| Tema | Superficies / botones |
|------|------------------------|
| Cyberpunk | `.cyberpunk-surface`, `.cyberpunk-button`, `.cyberpunk-nav-link`, … |
| Terminal | `.terminal-panel`, `.terminal-button`, `.terminal-control`, `.terminal-surface` |
| Retro | Bordes negros, sombras desplazadas, `retro-fx`, componentes BEM en modales |

---

## Fondos de página animados

Montados en [`src/App.tsx`](../src/App.tsx) solo cuando el tema activo coincide:

### Cyberpunk — `CyberpunkLinesBackground`

- Canvas con líneas neón animadas (efecto tipo CodePen / Jack Rugile).
- Fondo base `#000`; sin gradiente radial ni `login-bg.webp` en este tema.
- `AppShell` y login/join usan `bg-transparent` para dejar ver el canvas.
- `prefers-reduced-motion`: capa estática negra.

### Terminal — `TerminalMatrixBackground`

- Lluvia de caracteres estilo Matrix (`#0aff0a`, ~30 FPS).
- Misma estrategia: sin imagen de login, sin orbes decorativos, shell transparente.
- `resize` reinicializa columnas del efecto.
- Paneles de lista (`list-active-header`, buscador, `hud-container`, stats) usan fondos ~50–55 % opacos + `backdrop-filter` para dejar ver la lluvia detrás.

### Retro cartoon

- Sin canvas global.
- Login: imagen `/retro-login-bg.webp`.
- Fondo crema/amarillo con variables `--color-bg-primary`, etc.

### Tema «implícito» en login (cyberpunk/terminal ya cubiertos)

Si en el futuro hubiera un cuarto estilo sin animación, usaría `login-bg.webp` y gradiente global.

---

## Capas CSS globales

```css
/* Gradiente para temas sin override (p. ej. solo si no hay data-theme específico) */
html, body, #root { radial-gradient(...); }

html[data-theme="cyberpunk"] body,
html[data-theme="terminal"] body { background: #000; }

.cyberpunk-lines-bg,
.terminal-matrix-bg { position: fixed; z-index: 0; pointer-events: none; }

.app-view-layer { position: relative; z-index: 1; }
```

---

## Retro: modales «Meep Meep»

Solo en `retro-cartoon`:

- Componente [`RetroMeepModalFrame`](../src/features/shared/components/RetroMeepModalFrame.tsx).
- Keyframes `retro-meep-*` en `index.css`.
- Usado en confirmaciones, crítica rápida, crear/invitar lista, registro.

## Cyberpunk: modal de ítem «Unfolding»

Solo en `cyberpunk`, únicamente en el **detalle de ítem** (`ItemDetailsModal` con `cyberpunkUnfold`):

- Keyframes `cyberpunk-unfold-*` en `index.css` (pack modal #one: desplegar contenedor + zoom del panel).
- Apertura: `unfoldIn` 1s + `zoomIn` 0,5s (delay 0,8s). Cierre: `zoomOut` 0,5s + `unfoldOut` 1s (delay 0,3s).

---

## HUD y componentes compartidos

- **`HudContainer`**: paneles con scanlines; overrides por tema (chamfer en default/cyberpunk, recto en terminal).
- **`TechBackground`**: rejilla + scanline CSS — **no montado** en rutas actuales; reservado o legado.
- **Navbar**: estilos inline en `AppNavbar.tsx` por `isCyberpunk` / `isTerminal` / `isRetroCartoon`.

---

## Cambiar colores o tipografías

1. Edita variables en el bloque `[data-theme="…"]` de `src/index.css`.
2. Fuentes: Google Fonts o assets en `index.html` según el tema.
3. Para un fondo nuevo: crea un componente en `features/shared/components/`, expórtalo en `features/shared/index.ts` y condiciónalo en `App.tsx` (mismo patrón que cyberpunk/terminal).

---

## Accesibilidad

- Fondos animados respetan `prefers-reduced-motion` (versión estática).
- Contraste: revisar texto sobre paneles semitransparentes en login con Matrix/líneas detrás.
