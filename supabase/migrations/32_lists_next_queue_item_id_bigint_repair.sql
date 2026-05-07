-- Reparación si lists.next_queue_item_id quedó como uuid (items.id es bigint en este proyecto).
-- Idempotente con la 31 corregida: asegura columna bigint y FK.

DO $$
DECLARE
  col_type text;
BEGIN
  SELECT c.data_type INTO col_type
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = 'lists'
    AND c.column_name = 'next_queue_item_id';

  IF col_type = 'uuid' THEN
    ALTER TABLE public.lists DROP CONSTRAINT IF EXISTS lists_next_queue_item_id_fkey;
    ALTER TABLE public.lists DROP COLUMN next_queue_item_id;
    ALTER TABLE public.lists ADD COLUMN next_queue_item_id bigint NULL;
  END IF;
END $$;

ALTER TABLE public.lists
  ADD COLUMN IF NOT EXISTS next_queue_item_id bigint NULL;

COMMENT ON COLUMN public.lists.next_queue_item_id IS 'Ítem destacado como “siguiente”; debe pertenecer a esta lista (validado en app). Referencia items.id (bigint).';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lists_next_queue_item_id_fkey'
  ) THEN
    ALTER TABLE public.lists
      ADD CONSTRAINT lists_next_queue_item_id_fkey
      FOREIGN KEY (next_queue_item_id) REFERENCES public.items (id) ON DELETE SET NULL;
  END IF;
END $$;
