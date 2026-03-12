# Runbook Operativo - PWA Push + Supabase

## 1) Objetivo
Este runbook documenta operacion, despliegue, verificacion y troubleshooting del flujo de notificaciones push para la app.

Cubre:
- Suscripcion push desde frontend PWA
- Persistencia en `public.push_subscriptions`
- Auditoria de eventos via `public.audit_logs`
- Automatizacion DB -> Edge Function con `pg_net`
- Envio real de push con `send-push`

## 2) Arquitectura
Flujo end-to-end:
1. Usuario activa push en frontend (`Ajustes` -> `Notificaciones`).
2. El navegador crea `PushSubscription` con VAPID public key.
3. Frontend guarda subscription en `public.push_subscriptions`.
4. Una accion en listas/items genera fila en `public.audit_logs`.
5. Trigger `trg_dispatch_push_from_audit` ejecuta `dispatch_push_from_audit_logs()`.
6. La funcion usa `pg_net` para llamar Edge Function `send-push`.
7. `send-push` consulta suscripciones activas y envia notificacion.

Archivos clave:
- `src/features/shared/hooks/usePushNotifications.ts`
- `src/pages/Ajustes.tsx`
- `supabase/functions/send-push/index.ts`
- `supabase/migrations/05_soft_delete_and_join_rpc.sql`
- `supabase/migrations/06_audit_logs_triggers.sql`
- `supabase/migrations/07_0_push_subscriptions.sql`
- `supabase/migrations/07_audit_logs_push_dispatch.sql`

## 3) Requisitos y secretos

### 3.1 Frontend (Render u otro host)
Variables de entorno requeridas en build:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_VAPID_PUBLIC_KEY`

Nota:
- `VITE_VAPID_PUBLIC_KEY` se inyecta en build time. Si cambia, hay que redeployar.

### 3.2 Supabase Edge Function (`send-push`)
Secrets requeridos:
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT` (ejemplo: `mailto:ops@dominio.com`)
- `PUSH_WEBHOOK_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## 4) Provisioning y despliegue

### 4.1 Base de datos (orden recomendado)
Ejecutar migraciones en este orden:
1. `05_soft_delete_and_join_rpc.sql`
2. `06_audit_logs_triggers.sql`
3. `07_0_push_subscriptions.sql`
4. `07_audit_logs_push_dispatch.sql`
5. `08_dispatch_push_record_id_text_match.sql`

### 4.2 Activar dispatcher de push
Actualizar `push_dispatch_config` con URL real y secreto real:

```sql
UPDATE public.push_dispatch_config
SET function_url = 'https://<PROJECT_REF>.supabase.co/functions/v1/send-push',
    webhook_secret = '<PUSH_WEBHOOK_SECRET>',
    is_enabled = true,
    updated_at = NOW()
WHERE id = 1;
```

### 4.3 Frontend
1. Confirmar `VITE_VAPID_PUBLIC_KEY` en host (Render).
2. Deploy con cache limpio si hubo cambios de env.
3. Verificar en UI que el boton de activar push no muestre error de env faltante.

## 5) Health checks

### 5.1 Estructura DB
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('push_subscriptions', 'audit_logs', 'push_dispatch_config');
```

### 5.2 Politicas push_subscriptions
```sql
SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'push_subscriptions'
ORDER BY policyname;
```

### 5.3 Trigger y funcion de dispatch
```sql
SELECT tgname
FROM pg_trigger
WHERE tgname = 'trg_dispatch_push_from_audit';

SELECT proname
FROM pg_proc
WHERE proname = 'dispatch_push_from_audit_logs';
```

### 5.4 Configuracion activa
```sql
SELECT id, function_url, is_enabled, updated_at
FROM public.push_dispatch_config
WHERE id = 1;
```

### 5.5 Cola HTTP de pg_net
```sql
SELECT id, status_code, created, error_msg
FROM net._http_response
ORDER BY id DESC
LIMIT 20;
```

## 6) Smoke test funcional
1. Activar push desde navegador en `Ajustes`.
2. Confirmar fila activa en `push_subscriptions`:

```sql
SELECT user_id, endpoint, is_active, created_at, updated_at
FROM public.push_subscriptions
ORDER BY created_at DESC
LIMIT 10;
```

3. Ejecutar accion de negocio (crear/editar item en lista compartida).
4. Verificar nuevo evento en `audit_logs`:

```sql
SELECT id, table_name, action, record_id, user_id, created_at
FROM public.audit_logs
ORDER BY id DESC
LIMIT 10;
```

5. Verificar `status_code = 200` en `net._http_response`.
6. Confirmar notificacion visible en navegador destino.

## 7) Troubleshooting rapido

### Error: Falta VITE_VAPID_PUBLIC_KEY
Causa:
- Variable faltante en host frontend o deploy sin rebuild.
Accion:
- Agregar `VITE_VAPID_PUBLIC_KEY` y redeployar.

### Error: Permiso denegado por usuario
Causa:
- `Notification.permission = denied`.
Accion:
- Cambiar permiso del sitio a Allow y reintentar.

### Brave: push subscribe falla aunque shields off
Causa:
- Opcion global de mensajeria push deshabilitada.
Accion:
- Activar en `brave://settings/privacy` la opcion de servicios push.

### Error RLS 42501 al insertar en items
Causa:
- Politica INSERT muy restrictiva.
Accion:
- Confirmar que la politica de INSERT permite `owner/admin/member` y valida `user_id = auth.uid()`.

### `send-push` devuelve 401
Causa:
- Mismatch entre header `x-push-secret` y `PUSH_WEBHOOK_SECRET`.
Accion:
- Rotar y alinear secreto en Edge Function + `push_dispatch_config`.

### `send-push` devuelve 500
Causa comun:
- Falta algun secret VAPID o service role.
Accion:
- Revisar secrets de Edge Function.

### No hay filas nuevas en `net._http_response`
Causa:
- Trigger no creado, `is_enabled=false`, o evento no cumple condiciones.
Accion:
- Verificar trigger, funcion y `push_dispatch_config`.

### Hay fila 200 en `net._http_response` pero no llega push automatico a miembros
Causa comun:
- `audit_logs.record_id` llega en formato no UUID (por ejemplo bigint en texto), pero la funcion de dispatch intenta resolver registros con casteo UUID.
Accion:
- Aplicar migracion `08_dispatch_push_record_id_text_match.sql` para comparar `record_id` por texto (`id::text = NEW.record_id`) y soportar IDs UUID y numericos.

## 8) Operaciones de mantenimiento

### 8.1 Rotar PUSH_WEBHOOK_SECRET
1. Generar secreto nuevo.
2. Actualizar secret en Edge Function.
3. Actualizar `push_dispatch_config.webhook_secret`.
4. Verificar con smoke test.

### 8.2 Pausar envios push (kill switch)
```sql
UPDATE public.push_dispatch_config
SET is_enabled = false,
    updated_at = NOW()
WHERE id = 1;
```

### 8.3 Reanudar envios push
```sql
UPDATE public.push_dispatch_config
SET is_enabled = true,
    updated_at = NOW()
WHERE id = 1;
```

### 8.4 Retencion sugerida
- `audit_logs`: mantener 90-180 dias segun cumplimiento.
- `net._http_response`: limpiar periodicamente para evitar crecimiento.

Ejemplo para `audit_logs` (ajustar politica de negocio):
```sql
DELETE FROM public.audit_logs
WHERE created_at < NOW() - INTERVAL '180 days';
```

## 9) Estado esperado final
Checklist de cierre:
- [ ] `push_subscriptions` versionada por migracion
- [ ] `push_dispatch_config.is_enabled = true`
- [ ] Trigger `trg_dispatch_push_from_audit` activo
- [ ] `send-push` responde 200 desde `pg_net`
- [ ] Notificaciones visibles en navegador suscrito
