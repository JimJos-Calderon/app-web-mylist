# Reporte de Estado y Arquitectura

Proyecto: app-web-mylist  
Fecha de auditoria: 2026-03-12

## 1. Resumen Ejecutivo

El proyecto presenta una base tecnica solida para una app moderna colaborativa: arquitectura frontend por features, estado asincrono con React Query, seguridad de datos en Supabase con RLS, migraciones avanzadas (soft delete + auditoria), soporte PWA, observabilidad con Sentry y pipelines CI/CD.

Sin embargo, para alcanzar un nivel enterprise maduro, se detectan brechas clave:

- Hardcode de URL Supabase y anon key en llamadas frontend a Edge Functions.
- E2E no bloquea el pipeline principal en CI.
- Flujo Web Push incompleto en codigo fuente del Service Worker (no se detectan handlers explicitos de evento push/notificationclick).
- Bundle principal de produccion con warning por tamano de chunk.

Estado global recomendado: Bueno con riesgos controlables a corto plazo.

---

## 2. Arquitectura y Stack Actual

### 2.1 Frontend (carpeta src)

#### Estructura del proyecto

Patron observado: feature-oriented / FSD-like.

- Dominios en src/features: auth, items, lists, profile, shared.
- Capa de paginas en src/pages.
- Composicion principal en src/main.tsx y src/App.tsx.
- Barrels por feature para exponer contratos publicos.

Esto permite una separacion clara por dominio funcional, aunque App.tsx mantiene alta concentracion de responsabilidades (shell, navegacion, overlays, modales, drag logic, rutas).

#### Estado asincrono

Se usa TanStack React Query como capa principal de datos:

- QueryClient global con estrategia offlineFirst para queries.
- Mutaciones con invalidacion selectiva de cache.
- Persistencia de cache en localStorage.
- Integracion con realtime de Supabase para refresco de datos via invalidation.

Archivos clave:

- src/config/queryClient.ts
- src/config/queryPersistence.ts
- src/features/items/hooks/useItems.ts
- src/features/lists/hooks/useLists.ts

#### Enrutamiento

Se usa React Router con BrowserRouter y rutas declaradas en App:

- Rutas lazy para paginas principales (Peliculas, Series, Perfil, Ajustes, JoinList).
- Fallback de carga por Suspense.
- Navigate para rutas no reconocidas.

Esto confirma code splitting de rutas.

---

### 2.2 Backend (Supabase)

#### Estructura general

La carpeta supabase contiene:

- Migraciones SQL versionadas con seguridad y features avanzadas.
- Edge Functions para integraciones externas y push.

#### Base de datos: tablas y capacidades principales

Tablas core de negocio:

- items
- lists
- list_members
- item_ratings
- user_profiles

Tablas avanzadas:

- audit_logs
- push_subscriptions
- push_dispatch_config

#### RLS y seguridad de datos

Se confirma habilitacion de RLS y politicas por tabla en migraciones.
Hay control de pertenencia a lista y roles para operaciones sensibles.

#### RPCs

RPC detectada:

- join_list_with_code(UUID, TEXT)

Implementada como funcion SECURITY DEFINER con validacion de usuario autenticado y flujo atomico de alta de membresia.

#### Soft Delete

Implementado en items y lists via columna deleted_at + triggers BEFORE DELETE que convierten borrado fisico en logico.

#### Auditoria

Implementada con:

- Tabla generic audit_logs.
- Trigger function audit_changes_trigger().
- Triggers en items, lists, list_members, item_ratings.

Además, audit_logs queda bloqueada para acceso directo de clientes autenticados (RLS + revoke).

#### Edge Functions activas

- search-omdb: proxy seguro a OMDB con validacion + rate limiting.
- send-push: envio de notificaciones Web Push (VAPID + service role).
- notify-discord: webhook de notificaciones a Discord ante eventos de items.

---

## 3. Auditoria de Hitos (Checklist Enterprise)

### 3.1 CI/CD

Estado: Parcialmente implementado.

Hallazgos:

- Existen workflows en .github/workflows (ci.yml y playwright.yml).
- Se ejecutan lint, unit tests y build.
- Se ejecutan E2E, pero en ci.yml estan con continue-on-error: true, por lo que no bloquean merge.
- Hay duplicidad parcial de ejecucion E2E (workflow dedicado + job e2e en CI principal).

Riesgo:

- Posibles regresiones funcionales pueden pasar pipeline principal.

### 3.2 Seguridad y API (OMDB key)

Estado: Parcialmente implementado.

Positivo:

- OMDB_API_KEY se consume desde secreto en Edge Function search-omdb.

Riesgo detectado:

- En frontend hay hardcode de project URL y anon key en multiples llamadas a functions/v1/search-omdb.
- Aunque anon key no es secreto critico en Supabase, hardcodearla rompe portabilidad, complica rotacion y multiplica deuda tecnica.

### 3.3 Rendimiento (code splitting / React.lazy)

Estado: Implementado.

Positivo:

- Se usa React.lazy para rutas y componentes pesados.

Observacion:

- Build reporta chunk principal > 500 kB minificado (warning de Vite). Hay oportunidad clara de mejorar estrategia de chunking.

### 3.4 Estabilidad (Sentry + Error Boundaries)

Estado: Implementado, con mejora pendiente.

Positivo:

- Sentry.init configurado en main.
- ErrorBoundary global y boundaries por seccion.

Observacion:

- @sentry/vite-plugin esta importado en vite.config.ts pero no aplicado en el arreglo de plugins.

### 3.5 Accesibilidad (a11y) e i18n

Estado: Parcialmente implementado.

i18n:

- react-i18next + i18next-browser-languagedetector configurados.
- Locales en espanol e ingles con organizacion modular.

a11y:

- Hay uso consistente de aria-label en varios controles.
- Se observan labels sin htmlFor en formularios (mezcla de buenas y malas practicas).
- Existen textos hardcodeados fuera del sistema de traducciones (rompe consistencia i18n).

### 3.6 PWA (vite-plugin-pwa y Service Worker)

Estado: Implementado con gap funcional para push.

Positivo:

- vite-plugin-pwa configurado con generateSW.
- Se genera sw.js y registerSW.js en build.

Gap:

- No se detecto codigo fuente explicito con handlers push / notificationclick.
- El hook de push intenta registrar /sw.js, pero no hay fuente dedicada en repo para custom push handling.

### 3.7 Base de datos avanzada (Soft Delete + audit_logs)

Estado: Implementado.

- Soft delete: SI.
- Tabla de auditoria + triggers: SI.
- RLS y bloqueo de acceso directo a audit logs: SI.

### 3.8 Notificaciones Web Push

Estado: Implementacion avanzada, parcialmente dependiente de configuracion operativa.

Positivo:

- Cliente: permiso Notification + registro suscripcion en push_subscriptions.
- Backend: send-push con VAPID y desactivacion automatica de suscripciones invalidas.
- DB automation: trigger desde audit_logs con pg_net hacia send-push.
- Runbook operativo existente.

Condicion operativa:

- push_dispatch_config viene deshabilitado por defecto y requiere habilitacion explicita en entorno.

---

## 4. Analisis de Codigo y Deuda Tecnica

### 4.1 Deuda tecnica evidente

1. Integracion OMDB duplicada y acoplada

- Llamadas repetidas a la misma Edge Function en varios modulos.
- Configuracion hardcodeada en vez de centralizada.

2. Divergencia entre diseno y codigo

- useOmdb documenta uso de cache con useQuery, pero su implementacion actual es funcion async plana.

3. App.tsx con demasiadas responsabilidades

- Shell, navegacion, auth guards, modales, invitaciones, widgets, drag interactions y routing en un solo archivo.
- Incrementa costo de mantenimiento y riesgo de regresiones.

4. Pipeline CI parcialmente permisivo

- E2E no bloquea en flujo principal.

5. Riesgo de tipado en Edge Function critica

- send-push usa @ts-nocheck.

### 4.2 Linter y pruebas

Resultados validados:

- Editor diagnostics: sin errores activos.
- Unit tests: 18/18 OK.
- Build: OK, con warning de chunk grande.
- Lint: OK en ejecucion local, con warning de compatibilidad de version TypeScript vs typescript-eslint.

---

## 5. 3 Mejoras Recomendadas para Nivel Senior

### Mejora 1: Capa unica de integraciones backend/frontend

Objetivo:

- Eliminar hardcodes y duplicidad de llamadas a Edge Functions.

Accion:

- Crear modulo unico de cliente para funciones (ej: src/features/shared/lib/apiClient.ts).
- Consumir VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY solo desde supabaseClient.
- Reemplazar fetch duplicados en useOmdb, useSuggestions y ListaContenido.

Impacto:

- Seguridad operativa, menor deuda, mayor portabilidad entre entornos.

### Mejora 2: Endurecer CI/CD y elevar calidad de pruebas

Objetivo:

- Convertir CI en guardrail real de calidad.

Accion:

- Hacer E2E bloqueante en ramas principales.
- Eliminar duplicidad o definir responsabilidad clara entre workflows.
- Expandir E2E mas alla de smoke tests (auth, crear lista, unirse, agregar item, rating, push opt-in).

Impacto:

- Menor riesgo de regresion funcional en produccion.

### Mejora 3: Cerrar arquitectura PWA Push end-to-end

Objetivo:

- Garantizar recepcion y accion de notificaciones en clientes.

Accion:

- Definir estrategia SW clara: generateSW con extension controlada o migrar a injectManifest.
- Implementar handlers push y notificationclick de forma explicita y testeada.
- Agregar validaciones de contrato entre trigger DB, send-push y cliente.

Impacto:

- Confiabilidad del canal de notificaciones y menor incertidumbre operativa.

---

## 6. Conclusion

El codigo base ya incorpora varios pilares enterprise (RLS, soft delete, auditoria, React Query, PWA, observabilidad, CI), pero aun requiere una fase de endurecimiento para operar con estandar senior en produccion continua.

Prioridad recomendada de ejecucion:

1. Desacoplar integraciones y quitar hardcodes.
2. Endurecer CI y ampliar cobertura funcional E2E.
3. Completar flujo push en Service Worker y observabilidad del canal.

Con estas 3 lineas, el proyecto puede pasar de una base robusta a una plataforma mantenible y escalable de nivel consultoria enterprise.

