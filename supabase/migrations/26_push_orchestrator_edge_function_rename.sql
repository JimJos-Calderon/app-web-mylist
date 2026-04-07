-- La Edge Function pasó de llamarse notify-discord a push-orchestrator.
-- Si ya tenías configurado `function_url` con .../notify-discord, actualízalo:

BEGIN;

COMMENT ON TABLE public.notify_discord_config IS
  'URL de la Edge Function push-orchestrator (Discord + Web Push + FCM) + bearer anon/service_role. is_enabled = true para activar.';

-- Descomenta y ejecuta si aplica:
-- UPDATE public.notify_discord_config
-- SET function_url = replace(function_url, '/notify-discord', '/push-orchestrator')
-- WHERE function_url LIKE '%/notify-discord';

COMMIT;
