-- ============================================================================
-- 07_audit_logs_push_dispatch.sql
-- Automation for push notifications from audit_logs using pg_net + Edge Function
-- ============================================================================

BEGIN;

-- --------------------------------------------------------------------------
-- 1) HTTP client extension for asynchronous POST calls from Postgres
-- --------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_net;

-- --------------------------------------------------------------------------
-- 2) Internal config table (single row) to avoid hardcoding secrets in code
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.push_dispatch_config (
  id SMALLINT PRIMARY KEY CHECK (id = 1),
  function_url TEXT NOT NULL,
  webhook_secret TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.push_dispatch_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS push_dispatch_config_no_access ON public.push_dispatch_config;
CREATE POLICY push_dispatch_config_no_access
ON public.push_dispatch_config
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

REVOKE ALL ON TABLE public.push_dispatch_config FROM anon, authenticated;

INSERT INTO public.push_dispatch_config (id, function_url, webhook_secret, is_enabled)
VALUES (
  1,
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-push',
  'CHANGE_ME_PUSH_WEBHOOK_SECRET',
  false
)
ON CONFLICT (id) DO NOTHING;

-- --------------------------------------------------------------------------
-- 3) Trigger function to dispatch push notifications based on audit events
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.dispatch_push_from_audit_logs()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cfg public.push_dispatch_config%ROWTYPE;
  v_actor_name TEXT;
  v_record_uuid UUID;
  v_recipient UUID;
  v_title TEXT;
  v_message TEXT;
  v_url TEXT;
  v_tag TEXT;
BEGIN
  -- Only process actor-based events.
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT *
  INTO v_cfg
  FROM public.push_dispatch_config
  WHERE id = 1;

  IF NOT FOUND OR NOT v_cfg.is_enabled THEN
    RETURN NEW;
  END IF;

  IF v_cfg.function_url = 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-push'
     OR v_cfg.webhook_secret = 'CHANGE_ME_PUSH_WEBHOOK_SECRET' THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(up.username, 'Alguien')
  INTO v_actor_name
  FROM public.user_profiles up
  WHERE up.user_id = NEW.user_id
  LIMIT 1;

  v_record_uuid := NULL;
  BEGIN
    IF NEW.record_id IS NOT NULL AND btrim(NEW.record_id) <> '' THEN
      v_record_uuid := NEW.record_id::UUID;
    END IF;
  EXCEPTION WHEN invalid_text_representation THEN
    v_record_uuid := NULL;
  END;

  IF NEW.table_name = 'items' THEN
    v_title := 'Actividad en tu lista';
    v_tag := 'mylist-items';
    v_url := '/peliculas';

    IF NEW.action = 'INSERT' THEN
      v_message := format('%s agrego un item a la lista', v_actor_name);
    ELSIF NEW.action = 'UPDATE' THEN
      v_message := format('%s actualizo un item de la lista', v_actor_name);
    ELSE
      v_message := format('%s elimino un item de la lista', v_actor_name);
    END IF;

    FOR v_recipient IN
      SELECT DISTINCT lm.user_id
      FROM public.items i
      JOIN public.list_members lm ON lm.list_id = i.list_id
      WHERE i.id = v_record_uuid
        AND lm.user_id <> NEW.user_id
        AND EXISTS (
          SELECT 1
          FROM public.push_subscriptions ps
          WHERE ps.user_id = lm.user_id
            AND ps.is_active = true
        )
    LOOP
      PERFORM net.http_post(
        url := v_cfg.function_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-push-secret', v_cfg.webhook_secret
        ),
        body := jsonb_build_object(
          'user_id', v_recipient,
          'title', v_title,
          'message', v_message,
          'url', v_url,
          'tag', v_tag,
          'data', jsonb_build_object(
            'table_name', NEW.table_name,
            'record_id', NEW.record_id,
            'action', NEW.action,
            'actor_user_id', NEW.user_id
          )
        )
      );
    END LOOP;

  ELSIF NEW.table_name = 'lists' THEN
    v_title := 'Actividad en tu lista';
    v_tag := 'mylist-lists';
    v_url := '/peliculas';

    IF NEW.action = 'INSERT' THEN
      v_message := format('%s creo una lista nueva', v_actor_name);
    ELSIF NEW.action = 'UPDATE' THEN
      v_message := format('%s actualizo una lista compartida', v_actor_name);
    ELSE
      v_message := format('%s elimino una lista', v_actor_name);
    END IF;

    FOR v_recipient IN
      SELECT DISTINCT lm.user_id
      FROM public.list_members lm
      WHERE lm.list_id = v_record_uuid
        AND lm.user_id <> NEW.user_id
        AND EXISTS (
          SELECT 1
          FROM public.push_subscriptions ps
          WHERE ps.user_id = lm.user_id
            AND ps.is_active = true
        )
    LOOP
      PERFORM net.http_post(
        url := v_cfg.function_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-push-secret', v_cfg.webhook_secret
        ),
        body := jsonb_build_object(
          'user_id', v_recipient,
          'title', v_title,
          'message', v_message,
          'url', v_url,
          'tag', v_tag,
          'data', jsonb_build_object(
            'table_name', NEW.table_name,
            'record_id', NEW.record_id,
            'action', NEW.action,
            'actor_user_id', NEW.user_id
          )
        )
      );
    END LOOP;

  ELSIF NEW.table_name = 'item_ratings' THEN
    v_title := 'Actividad en tu lista';
    v_tag := 'mylist-ratings';
    v_url := '/peliculas';

    IF NEW.action = 'INSERT' THEN
      v_message := format('%s califico un item', v_actor_name);
    ELSIF NEW.action = 'UPDATE' THEN
      v_message := format('%s actualizo su calificacion', v_actor_name);
    ELSE
      v_message := format('%s elimino su calificacion', v_actor_name);
    END IF;

    FOR v_recipient IN
      SELECT DISTINCT lm.user_id
      FROM public.item_ratings ir
      JOIN public.items i ON i.id = ir.item_id
      JOIN public.list_members lm ON lm.list_id = i.list_id
      WHERE ir.id = v_record_uuid
        AND lm.user_id <> NEW.user_id
        AND EXISTS (
          SELECT 1
          FROM public.push_subscriptions ps
          WHERE ps.user_id = lm.user_id
            AND ps.is_active = true
        )
    LOOP
      PERFORM net.http_post(
        url := v_cfg.function_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-push-secret', v_cfg.webhook_secret
        ),
        body := jsonb_build_object(
          'user_id', v_recipient,
          'title', v_title,
          'message', v_message,
          'url', v_url,
          'tag', v_tag,
          'data', jsonb_build_object(
            'table_name', NEW.table_name,
            'record_id', NEW.record_id,
            'action', NEW.action,
            'actor_user_id', NEW.user_id
          )
        )
      );
    END LOOP;

  ELSIF NEW.table_name = 'list_members' THEN
    -- On INSERT/UPDATE, the row still exists and we can resolve list recipients.
    -- On DELETE, the row no longer exists and we skip.
    IF NEW.action = 'DELETE' THEN
      RETURN NEW;
    END IF;

    v_title := 'Actividad en tu lista';
    v_tag := 'mylist-members';
    v_url := '/peliculas';

    IF NEW.action = 'INSERT' THEN
      v_message := format('%s agrego un miembro a la lista', v_actor_name);
    ELSE
      v_message := format('%s actualizo los permisos de un miembro', v_actor_name);
    END IF;

    FOR v_recipient IN
      SELECT DISTINCT lm_target.user_id
      FROM public.list_members lm_source
      JOIN public.list_members lm_target ON lm_target.list_id = lm_source.list_id
      WHERE lm_source.id = v_record_uuid
        AND lm_target.user_id <> NEW.user_id
        AND EXISTS (
          SELECT 1
          FROM public.push_subscriptions ps
          WHERE ps.user_id = lm_target.user_id
            AND ps.is_active = true
        )
    LOOP
      PERFORM net.http_post(
        url := v_cfg.function_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-push-secret', v_cfg.webhook_secret
        ),
        body := jsonb_build_object(
          'user_id', v_recipient,
          'title', v_title,
          'message', v_message,
          'url', v_url,
          'tag', v_tag,
          'data', jsonb_build_object(
            'table_name', NEW.table_name,
            'record_id', NEW.record_id,
            'action', NEW.action,
            'actor_user_id', NEW.user_id
          )
        )
      );
    END LOOP;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Never block business writes because notification dispatch failed.
    RAISE LOG 'dispatch_push_from_audit_logs failed: %', SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_dispatch_push_from_audit ON public.audit_logs;
CREATE TRIGGER trg_dispatch_push_from_audit
AFTER INSERT ON public.audit_logs
FOR EACH ROW
EXECUTE FUNCTION public.dispatch_push_from_audit_logs();

COMMIT;
