-- Webhook de Discord configurable por lista (sin variable de entorno global para ítems).

ALTER TABLE public.lists
  ADD COLUMN IF NOT EXISTS discord_webhook_url text NULL;

COMMENT ON COLUMN public.lists.discord_webhook_url IS
  'URL del webhook de Discord para notificaciones al añadir ítems. Solo el owner debe actualizarla (RLS).';

-- Política explícita: solo el propietario puede actualizar filas de listas (incl. discord_webhook_url).
-- Ya existía lists_update_owner_only; esta política documenta el mismo criterio para el webhook.
DROP POLICY IF EXISTS "lists_owner_update_discord_webhook_url" ON public.lists;

CREATE POLICY "lists_owner_update_discord_webhook_url"
  ON public.lists
  FOR UPDATE
  TO authenticated
  USING (
    owner_id = auth.uid()
    AND deleted_at IS NULL
  )
  WITH CHECK (
    owner_id = auth.uid()
  );
