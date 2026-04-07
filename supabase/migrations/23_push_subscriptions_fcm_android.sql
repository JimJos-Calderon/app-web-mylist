-- Suscripciones Web Push (VAPID) vs token FCM en Android (Capacitor).
-- Web: platform = 'web', endpoint + claves + subscription JSON.
-- Android: platform = 'android', solo fcm_token (único).

BEGIN;

ALTER TABLE public.push_subscriptions DROP CONSTRAINT IF EXISTS push_subscriptions_subscription_shape;

ALTER TABLE public.push_subscriptions
  ALTER COLUMN endpoint DROP NOT NULL,
  ALTER COLUMN p256dh DROP NOT NULL,
  ALTER COLUMN auth DROP NOT NULL,
  ALTER COLUMN subscription DROP NOT NULL;

ALTER TABLE public.push_subscriptions
  ADD COLUMN IF NOT EXISTS fcm_token TEXT,
  ADD COLUMN IF NOT EXISTS platform TEXT NOT NULL DEFAULT 'web';

UPDATE public.push_subscriptions SET platform = 'web' WHERE platform IS NULL OR platform = '';

ALTER TABLE public.push_subscriptions DROP CONSTRAINT IF EXISTS push_subscriptions_platform_payload;

ALTER TABLE public.push_subscriptions
  ADD CONSTRAINT push_subscriptions_platform_payload CHECK (
    (
      platform = 'web'
      AND fcm_token IS NULL
      AND endpoint IS NOT NULL
      AND p256dh IS NOT NULL
      AND auth IS NOT NULL
      AND subscription IS NOT NULL
    )
    OR
    (
      platform = 'android'
      AND fcm_token IS NOT NULL
      AND endpoint IS NULL
      AND p256dh IS NULL
      AND auth IS NULL
      AND subscription IS NULL
    )
  );

DROP INDEX IF EXISTS uq_push_subscriptions_endpoint;
CREATE UNIQUE INDEX uq_push_subscriptions_endpoint ON public.push_subscriptions (endpoint) WHERE endpoint IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_push_subscriptions_fcm_token ON public.push_subscriptions (fcm_token) WHERE fcm_token IS NOT NULL;

COMMIT;
