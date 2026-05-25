# Discord: rotar el webhook de una lista

La URL del webhook **no** va en variables `VITE_*` ni en el código: se guarda por lista en Postgres (`public.lists.discord_webhook_url`). La Edge Function `push-orchestrator` la lee con la service role y envía el embed cuando alguien inserta un ítem.

## 1. En Discord (obligatorio si el anterior pudo filtrarse)

1. Abre el canal donde estaba el webhook.
2. **Configuración del canal** → **Integraciones** → **Webhooks**.
3. Elimina el webhook antiguo (así invalidas la URL filtrada).
4. **Crear webhook** → nombre descriptivo (p. ej. `WhichNext – Películas`) → **Copiar URL del webhook**.

## 2. En la app (recomendado)

1. Inicia sesión como **propietario** de la lista.
2. Abre **Ajustes de la lista** (icono de engranaje junto a la lista activa).
3. Pega la **nueva** URL en el campo del webhook (debe empezar por `https://discord.com/api/webhooks/`).
4. Guarda. Si dejas el campo vacío, se desactivan las notificaciones Discord para esa lista.

## 3. Alternativa: SQL en Supabase (misma cuenta owner)

Solo si necesitas corregir datos sin pasar por la UI:

```sql
UPDATE public.lists
SET discord_webhook_url = 'https://discord.com/api/webhooks/TU_ID/TU_TOKEN'
WHERE id = 'UUID-DE-LA-LISTA';
```

Comprueba que el usuario que ejecuta la consulta cumpla RLS (normalmente el owner vía consola con privilegios o desde la app con sesión del owner).

## 4. Comprobar que no haya doble notificación

Si al añadir un ítem llegan **dos** mensajes al canal:

- En Supabase: **Database → Webhooks**: no debe haber un webhook de BD duplicado sobre `INSERT` en `public.items` que llame otra vez a `push-orchestrator` si ya tienes el trigger `trg_items_notify_discord` (migración `25`). Deja **un solo** disparador.

## 5. Qué no es el “webhook de Discord”

- **`notify_discord_config`** en la base de datos guarda la URL de la **Edge Function** (`.../functions/v1/push-orchestrator`) y el bearer; eso **no** se sustituye al rotar el webhook del canal: solo al rotar el webhook de **Discord** en `lists.discord_webhook_url` (pasos anteriores).
