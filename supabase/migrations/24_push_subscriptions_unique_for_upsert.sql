-- PostgREST/Supabase upsert (ON CONFLICT) no infiere bien índices únicos PARCIALES.
-- Sustituimos por UNIQUE en columna: en PostgreSQL, varios NULL siguen siendo válidos
-- (filas web tienen fcm_token NULL; Android tienen endpoint NULL).

BEGIN;

DROP INDEX IF EXISTS public.uq_push_subscriptions_endpoint;
DROP INDEX IF EXISTS public.uq_push_subscriptions_fcm_token;

ALTER TABLE public.push_subscriptions DROP CONSTRAINT IF EXISTS push_subscriptions_endpoint_key;
ALTER TABLE public.push_subscriptions
  ADD CONSTRAINT push_subscriptions_endpoint_key UNIQUE (endpoint);

ALTER TABLE public.push_subscriptions DROP CONSTRAINT IF EXISTS push_subscriptions_fcm_token_key;
ALTER TABLE public.push_subscriptions
  ADD CONSTRAINT push_subscriptions_fcm_token_key UNIQUE (fcm_token);

COMMIT;
