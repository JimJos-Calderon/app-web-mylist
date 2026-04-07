-- Invoca la Edge Function push-orchestrator tras INSERT en items (Discord + Web Push + FCM Android).
-- Sin esto, la función nunca se ejecuta salvo que configures un "Database Webhook" manual en el panel.
--
-- Tras aplicar la migración, en SQL Editor (como postgres / service role):
--   UPDATE public.notify_discord_config SET
--     function_url = 'https://TU_PROJECT_REF.supabase.co/functions/v1/push-orchestrator',
--     bearer_token = 'TU_SUPABASE_ANON_KEY_O_SERVICE_ROLE',
--     is_enabled = true
--   WHERE id = 1;
--
-- Habilita la extensión pg_net en Dashboard → Database → Extensions si no existe.
-- No actives además un Database Webhook duplicado sobre la misma tabla o recibirás doble envío.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE TABLE IF NOT EXISTS public.notify_discord_config (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  function_url text NOT NULL DEFAULT '',
  bearer_token text NOT NULL DEFAULT '',
  is_enabled boolean NOT NULL DEFAULT false
);

INSERT INTO public.notify_discord_config (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE public.notify_discord_config IS
  'URL de push-orchestrator + clave anon o service_role para cabeceras Authorization/apikey. is_enabled = true para activar.';

REVOKE ALL ON public.notify_discord_config FROM PUBLIC;
GRANT ALL ON public.notify_discord_config TO service_role;

CREATE OR REPLACE FUNCTION public.invoke_notify_discord_after_item_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cfg public.notify_discord_config%ROWTYPE;
  payload jsonb;
BEGIN
  SELECT * INTO cfg FROM public.notify_discord_config WHERE id = 1;

  IF NOT FOUND OR NOT cfg.is_enabled OR length(trim(cfg.function_url)) < 12 OR length(trim(cfg.bearer_token)) < 20 THEN
    RETURN NEW;
  END IF;

  payload := jsonb_build_object(
    'type', 'INSERT',
    'table', 'items',
    'schema', 'public',
    'record', to_jsonb(NEW)
  );

  PERFORM net.http_post(
    url := trim(cfg.function_url),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || trim(cfg.bearer_token),
      'apikey', trim(cfg.bearer_token)
    ),
    body := payload
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'invoke_notify_discord_after_item_insert failed: %', SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_items_notify_discord ON public.items;
CREATE TRIGGER trg_items_notify_discord
  AFTER INSERT ON public.items
  FOR EACH ROW
  EXECUTE FUNCTION public.invoke_notify_discord_after_item_insert();

COMMIT;
