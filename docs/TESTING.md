# Testing y CI

Cómo ejecutar y ampliar las pruebas de **WhichNext**.

---

## Vitest (unitario / integración ligera)

```bash
npm run test              # watch en desarrollo
npm run test -- --run     # una pasada (CI)
npm run test:ui           # interfaz Vitest
npm run test:coverage     # cobertura
```

Configuración: `vitest` en `vite.config.ts`, setup en [`src/setupTests.ts`](../src/setupTests.ts).

### Áreas con tests

- Hooks: `useItems`, `useItemRating`, etc. (mocks de Supabase).
- Utils: deduplicación de títulos, import/export CSV/JSON (`listItemsImportExport.test.ts`).

Añade tests cuando corrijas lógica de negocio no trivial; evita asserts que solo repiten el código.

---

## Playwright (E2E)

```bash
npm run test:e2e
npm run test:e2e:ui
npm run test:e2e:debug
```

| Archivo | Qué hace |
|---------|----------|
| `tests/home.spec.ts` | Smoke: carga, elementos básicos |
| `tests/auth-login.spec.ts` | Login si hay `E2E_EMAIL` / `E2E_PASSWORD` |

Variables en `.env` (prefijo `E2E_`) o en el entorno de CI.

---

## CI (GitHub Actions)

Workflow típico en el repo:

- Node 18 y 20
- `npm run lint`
- `npm run test` (Vitest)
- `npm run build`
- Job E2E con artefacto de reporte Playwright

Consulta [`.github/workflows/`](../.github/workflows/) para el YAML vigente.

---

## Checklist antes de PR

1. `npm run lint`
2. `npm run test -- --run`
3. `npm run build`
4. Si tocas flujos de auth o navegación: `npm run test:e2e` en local

---

## Sentry en producción

Con `VITE_SENTRY_DSN` en el build de producción, errores de React y boundaries reportan a Sentry (`main.tsx`, `AppRoutes`).

No hace falta DSN en desarrollo.
