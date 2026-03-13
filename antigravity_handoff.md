# Artefacto de Traspaso de Contexto Absoluto y Definitivo
**Proyecto:** app-web-mylist
**Fecha de corte técnico:** 2026-03-13

## 1) Arquitectura y Stack de Plataforma

### 1.1 Topología real auditada en repositorio
| Capa | Implementación actual | Evidencia |
| :--- | :--- | :--- |
| Frontend SPA/PWA | React 19 + TypeScript + Vite + Tailwind v4 | package.json, vite.config.ts, src/main.tsx |
| Routing y carga diferida | React Router + lazy loading de páginas críticas | src/App.tsx |
| Estado server y caché | TanStack Query + persistencia offline en localStorage | src/config/queryPersistence.ts, src/main.tsx |
| Backend BaaS | Supabase Auth + Postgres + Realtime + Storage + Edge Functions | src/supabaseClient.ts, supabase/functions |
| PWA | vite-plugin-pwa con estrategia injectManifest y SW custom | vite.config.ts, src/sw.ts |
| Observabilidad | Sentry browser tracing + replay en producción | src/main.tsx |
| Internacionalización | i18next + detector + persistencia de idioma | src/i18n.ts |
| Testing | Vitest + Playwright disponibles en scripts | package.json |

### 1.2 Contexto de ecosistema declarado por producto, fuera de este repo
| Dominio declarado | Estado de evidencia en este workspace | Implicación para traspaso |
| :--- | :--- | :--- |
| Base frontend Angular/React híbrida | No se detectaron artefactos Angular en este repo auditado | Tratar Angular como bounded context externo; no asumir estructuras internas no versionadas aquí |
| Sistema IoT con ESP32 | No se detectaron módulos firmware/telemetría IoT en este repo auditado | Documentar como dependencia de ecosistema, no como código operativo local |
| API externa corporativa | Este repo usa Supabase como backend principal directo | Mantener contrato de integración por fronteras, sin introducir acoplamientos no verificados |

### 1.3 Núcleo funcional de negocio actual
| Dominio | Estado | Evidencia |
| :--- | :--- | :--- |
| Listas colaborativas y membresías | Operativo | src/features/lists, supabase/migrations/... |
| Ítems (películas/series) + rating + like/dislike | Operativo | src/features/items, src/features/items/components/ItemCard.tsx |
| Feed de actividad por lista | Operativo funcional, pendiente de homogeneización visual final | src/features/lists/hooks/useActivityFeed.ts, src/features/lists/components/ActivityFeed.tsx... |
| Push notifications | Flujo end-to-end implementado | src/features/shared/hooks/usePushNotifications.ts, supabase/functions/send-push/index.ts, RUNBOOK_PUSH_NOTIFICATIONS.md |
| OMDB proxy seguro con rate-limit | Operativo | supabase/functions/search-omdb/index.ts |

### 1.4 Base de datos avanzada y seguridad de datos
| Activo DB | Objetivo | Evidencia |
| :--- | :--- | :--- |
| RLS y constraints | Multi-tenant seguro por membresía y ownership | README.md, supabase/migrations/04_security_rls_and_constraints.sql |
| Push subscriptions con RLS | Persistencia de endpoint por usuario y activación/desactivación | supabase/migrations/07_0_push_subscriptions.sql |
| Hotfix de dispatch por record_id textual | Compatibilidad UUID y no-UUID en auditoría | supabase/migrations/08_dispatch_push_record_id_text_match.sql |
| Activity feed materializado como vista | Lectura directa para frontend | supabase/migrations/10_activity_feed_and_member_deletion.sql |

## 2) Estado de la UI: Refactor Cyberpunk/HUD Dinámico

### 2.1 Motor de temas dinámico
| Bloque | Implementación | Evidencia |
| :--- | :--- | :--- |
| Variables semánticas base | Tokens de color, glow, fondo y texto | src/index.css |
| Tres temas soportados | cyberpunk, 2advanced, terminal | src/index.css |
| Persistencia de preferencia | user_profiles.theme_preference con query+mutation optimista | src/features/shared/hooks/useTheme.ts |
| Aplicación en DOM | data-theme sobre html | src/features/shared/hooks/useTheme.ts |
| Selector visual de tema | UI en Ajustes con 3 presets | src/features/shared/components/ThemeSwitcher.tsx, src/pages/Ajustes.tsx |

### 2.2 Primitivas HUD
| Primitiva | Rol | Evidencia |
| :--- | :--- | :--- |
| HudContainer | Contenedor biselado con capas decorativas y blur | src/features/shared/components/HudContainer.tsx, src/index.css |
| TechLabel | Micro-etiqueta técnica con tonos primario/secundario y blink | src/features/shared/components/TechLabel.tsx, src/index.css |
| TechBackground | Fondo de grid/scanline | src/features/shared/components/TechBackground.tsx, src/index.css |

### 2.3 Convenciones visuales consolidadas
| Regla | Decisión técnica |
| :--- | :--- |
| Colorimetría | Prohibidos hardcodes locales en componentes core; usar clases semánticas soportadas por tokens |
| Estados interactivos | Hover/focus/active con rgba de accent-primary y accent-secondary |
| Tipografía táctica | Entradas de comando y filtros con estilo terminal/mono donde aplica |
| Forma | Eliminación de rounded-full excesivo en centro de mando, migrando a biseles leves y clip-path táctico |
| Micro-datos | Etiquetas de estado en esquina superior por contexto funcional |

### 2.4 Cobertura de migración HUD en UI principal
| Componente | Estado | Evidencia clave |
| :--- | :--- | :--- |
| StatsWidget | Migrado a HudContainer + TechLabel SYS.READY + métricas semánticas | src/features/items/components/StatsWidget.tsx, src/index.css |
| ItemCard | Migrado completo en estructura visual core + estado STATUS: RATED/PENDING | src/features/items/components/ItemCard.tsx |
| RatingWidget | Migrado con variantes owner/shared en trigger/menu/stars/clear/reactions/skeleton | src/features/items/components/RatingWidget.tsx, src/index.css |
| SearchBar | Migrado como terminal de comandos + TechLabel INPUT.QUERY + dropdown en HudContainer | src/features/items/components/SearchBar.tsx, src/index.css |
| FilterPanel | Migrado a panel táctico HUD + TechLabel SYS.FILTERS + switches semánticos | src/features/items/components/FilterPanel.tsx, src/index.css |

### 2.5 Dictamen de migración visual
La UI principal del flujo operativo de listas e ítems está migrada al estilo HUD de forma completa en núcleo de interacción: comando de búsqueda, panel de filtros, tarjetas de ítems, rating y métricas.
Quedan piezas visuales secundarias y transversales fuera de la unificación final, detalladas en la sección de pendientes.

## 3) Estado Actual del Código y Salud de Build

### 3.1 Verificación de compilación
| Verificación | Resultado |
| :--- | :--- |
| Build producción | Exitoso, salida de artefactos dist generada, build en 10.57s |
| Alerta no bloqueante | Warning de chunk grande en bundle principal, no rompe build |

**Evidencia de configuración y salida:** package.json, vite.config.ts

### 3.2 Verificación de lint
| Verificación | Resultado |
| :--- | :--- |
| ESLint | Sin errores bloqueantes |
| Warning persistente | Compatibilidad de versión TypeScript con typescript-estree, no bloqueante en sesión actual |

### 3.3 Estado operativo relevante
| Área | Estado |
| :--- | :--- |
| Rutas protegidas por sesión | Operativo |
| Join route pre-auth | Operativo |
| Cache persistida offline | Operativo |
| Realtime de activity feed | Operativo |
| Push subscription + dispatch | Operativo |

**Evidencia:** src/App.tsx, src/config/queryPersistence.ts, src/features/lists/hooks/useActivityFeed.ts, supabase/functions/send-push/index.ts

## 4) Lista de Tareas Pendientes para el Próximo Agente

### 4.1 Prioridad P0: Unificación visual de confirmaciones críticas
| Tarea | Estado actual | Acción requerida |
| :--- | :--- | :--- |
| Refactor ConfirmDialog | Legacy visual rojo estático, gradientes legacy | Reescribir sobre HudContainer + TechLabel, tokens semánticos, y variantes de severidad sin hardcodes |

**Evidencia:** src/features/shared/components/ConfirmDialog.tsx

### 4.2 Prioridad P1: Modales pendientes fuera del sistema HUD unificado
| Componente | Estado actual | Acción requerida |
| :--- | :--- | :--- |
| CreateListDialog | Diseño legacy con paleta fija pink | Migrar a sistema HUD semántico y compatibilidad temática total |
| InviteDialog | Diseño legacy con paleta fija cyan | Migrar a sistema HUD semántico y compatibilidad temática total |
| UsernameSetupModal | Modal en App con estilos hardcodeados pink/red | Extraer a componente reusable y tematizar |
| PendingInviteModal | Modal en App con hardcodes cyan/red | Migrar a variante HUD y tokens semánticos |

**Evidencia:** src/features/lists/components/ListDialogs.tsx, src/App.tsx

### 4.3 Prioridad P1: ActivityFeed visual final
| Tarea | Estado actual | Acción requerida |
| :--- | :--- | :--- |
| ActivityFeed estética HUD | Funcionalmente integrado, visual con estilos legacy cyan/zinc locales | Envolver en HudContainer y clases semánticas para loading, error, empty, timeline y cards de evento |
| Botonera/controles feed en ListaContenido | Legacy visual parcial en header de sección | Unificar con nomenclatura HUD y tokens |

**Evidencia:** src/features/lists/components/ActivityFeed.tsx, src/features/lists/components/ListaContenido.tsx

### 4.4 Prioridad P2: Hardening de shell global
| Tarea | Motivo |
| :--- | :--- |
| Revisar skeletons y widgets globales en App | Mantienen paletas hardcodeadas previas al refactor |
| Revisar ListSelector | Sigue visual gris/dark genérico no alineado con HUD |

**Evidencia:** src/App.tsx, src/features/lists/components/ListSelector.tsx

## 5) Reglas de Seguridad y Contratos de Auth/JWT para no romper seguridad

### 5.1 Implementación actual en este repo
| Regla | Implementación |
| :--- | :--- |
| Guard de sesión en capa de routing | Si no hay sesión, renderiza Login; join code se evalúa antes del guard general |
| Fuente de verdad de auth | Supabase auth.onAuthStateChange |
| Logout seguro | Supabase signOut + limpieza de query cache persistida |
| Token handling | Supabase JS administra sesión/tokens de forma interna; tipos de sesión incluyen access_token y refresh_token |
| Persistencias locales controladas | localStorage para cache de query, idioma y pendingInviteCode |

**Evidencia:** src/App.tsx, src/features/auth/context/AuthContext.tsx, src/features/shared/model/types.ts, src/config/queryPersistence.ts, src/i18n.ts

### 5.2 Recordatorio de arquitectura base de seguridad para capas externas Angular/API
| Control | Regla obligatoria de continuidad |
| :--- | :--- |
| Guards de ruta | Toda vista protegida debe resolver sesión válida antes de renderizar contenido sensible |
| Interceptor HTTP | Adjuntar Authorization Bearer en llamadas a API corporativa; centralizar renovación/invalidación de token en 401/403 |
| localStorage | Evitar proliferación de claves ad hoc; mantener naming y limpieza centralizada |
| No bypass de políticas | No mover lógica de autorización al cliente cuando ya existe RLS/claims en backend |

### 5.3 Reglas específicas para Edge Functions actuales
| Función | Regla de seguridad |
| :--- | :--- |
| send-push | Requiere secreto de webhook por header x-push-secret cuando está configurado |
| search-omdb | Usa Authorization para identificar rate-limit; no exponer OMDB_API_KEY al cliente |

**Evidencia:** supabase/functions/send-push/index.ts, supabase/functions/search-omdb/index.ts

## 6) Resumen Ejecutivo para Google Antigravity (handoff operativo inmediato)

### 6.1 Lo que está cerrado
| Entregable | Estado |
| :--- | :--- |
| Núcleo UI de listas/ítems en estética HUD dinámica | Cerrado |
| Motor de temas persistente con 3 perfiles | Cerrado |
| SearchBar y FilterPanel refactor táctico | Cerrado |
| Build de producción | Exitoso |
| Lint | Sin errores bloqueantes |

### 6.2 Lo que se retoma al abrir el nuevo IDE
| Sprint técnico recomendado | Alcance |
| :--- | :--- |
| Sprint A | ConfirmDialog como componente base HUD reutilizable |
| Sprint B | Migración de CreateListDialog, InviteDialog, UsernameSetupModal, PendingInviteModal |
| Sprint C | Homologación final de ActivityFeed y header de sección en ListaContenido |
| Sprint D | Barrido final de shell global y componentes de soporte no migrados |

### 6.3 Dependencias y runbooks que no deben perderse en la migración
| Documento o módulo | Uso crítico |
| :--- | :--- |
| RUNBOOK_PUSH_NOTIFICATIONS.md | Operación y troubleshooting de push E2E |
| README.md | Contexto funcional y setup |
| supabase/migrations | Orden y estado evolutivo de esquema/RLS/feeds |
| src/index.css | Fuente única de tokens y convenciones HUD |

## 7) Veredicto final de traspaso
El proyecto está en estado apto para migración de IDE con base técnica estable. La arquitectura productiva principal está operativa, el núcleo visual HUD de interacción principal está consolidado, y el backlog restante está claramente acotado a homogenización de modales y ActivityFeed, sin bloqueadores de compilación ni lint.