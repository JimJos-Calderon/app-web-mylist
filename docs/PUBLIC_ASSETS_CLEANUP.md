# Auditoría rápida de `public/` (rendimiento)

## Archivos candidatos a eliminar o sacar de `public/`

| Archivo | Tamaño aprox. | Recomendación |
|---------|---------------|---------------|
| `vite.svg` | ~1.5 KB | **Eliminar** si no se referencia en el proyecto (plantilla Vite por defecto). |
| `fonts/space-meatball.zip` | ~11 KB | **Eliminar del despliegue**: el zip no debe servirse a usuarios; conservar solo en repo de diseño o fuera de `public/`. |
| `fonts/Space Meatball/Space meatball 1.png` | ~7 KB | **Opcional**: imagen de muestra de la fuente; no necesaria en runtime. |
| `fonts/Space Meatball/Space Meatball.otf` | duplicado | Mantener **una** copia de la OTF (`public/fonts/space-meatball.otf` **o** la carpeta `Space Meatball/`, no ambas si son idénticas). |

## Fondos de login (WebP)

| Archivo | Notas |
|---------|--------|
| `login-bg.webp` | Fondo estándar; referenciado en `Login.tsx` e `index.html` (preload baja prioridad). |
| `retro-login-bg.webp` | Tema retro; mismo uso. |

Los PNG de ~6–7 MB (`login-bg.png`, `retro-login-bg.png`) fueron sustituidos; no deben volver a `public/`. Con el peso reducido, ambos `.webp` se incluyen en precache PWA (`vite.config.ts` + `includeAssets`).

## Tras clonar el repo

Ejecutar `npm run icons` para generar `public/logo-navbar.webp`, `pwa-64x64.png` y regenerar iconos PWA desde `assets/icon.png`.
