# Auditoría rápida de `public/` (rendimiento)

## Archivos candidatos a eliminar o sacar de `public/`

| Archivo | Tamaño aprox. | Recomendación |
|---------|---------------|---------------|
| `vite.svg` | ~1.5 KB | **Eliminar** si no se referencia en el proyecto (plantilla Vite por defecto). |
| `fonts/space-meatball.zip` | ~11 KB | **Eliminar del despliegue**: el zip no debe servirse a usuarios; conservar solo en repo de diseño o fuera de `public/`. |
| `fonts/Space Meatball/Space meatball 1.png` | ~7 KB | **Opcional**: imagen de muestra de la fuente; no necesaria en runtime. |
| `fonts/Space Meatball/Space Meatball.otf` | duplicado | Mantener **una** copia de la OTF (`public/fonts/space-meatball.otf` **o** la carpeta `Space Meatball/`, no ambas si son idénticas). |

## Archivos muy pesados (no borrar sin sustituto)

| Archivo | Tamaño aprox. | Notas |
|---------|---------------|--------|
| `login-bg.png` | ~6.5 MB | Usado en `Login.tsx` (temas no retro). **Comprimir** (WebP/JPEG calidad 75–82) o bajar resolución. |
| `retro-login-bg.png` | ~7 MB | Mismo uso para tema retro. Misma acción. |

> Estos fondos **no** entran en el precache del Service Worker (`globIgnores` en `vite.config.ts`) para no inflar la instalación PWA.

## Tras clonar el repo

Ejecutar `npm run icons` para generar `public/logo-navbar.webp`, `pwa-64x64.png` y regenerar iconos PWA desde `assets/icon.png`.
