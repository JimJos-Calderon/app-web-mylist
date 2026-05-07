-- Etiquetas, orden manual (sort_index), siguiente en cola e importación coherente con listas existentes.

-- ─── items: orden manual + etiquetas ─────────────────────────────────────
ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS sort_index integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}'::text[];

COMMENT ON COLUMN public.items.sort_index IS 'Orden dentro de list_id+tipo; menor = primero cuando el cliente ordena por manual.';
COMMENT ON COLUMN public.items.tags IS 'Etiquetas libres del ítem (minúsculas recomendadas en app).';

-- Backfill: mismo orden que “fecha · más recientes” (más reciente = sort_index 0)
WITH ranked AS (
  SELECT
    id,
    (row_number() OVER (PARTITION BY list_id, tipo ORDER BY created_at DESC) - 1)::integer AS rn
  FROM public.items
)
UPDATE public.items i
SET sort_index = r.rn
FROM ranked r
WHERE i.id = r.id;

CREATE INDEX IF NOT EXISTS items_list_tipo_sort_idx
  ON public.items (list_id, tipo, sort_index);

-- ─── lists: etiquetas de lista + “siguiente en cola” ───────────────────────
ALTER TABLE public.lists
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS next_queue_item_id bigint NULL;

COMMENT ON COLUMN public.lists.tags IS 'Etiquetas sugeridas / de lista (p. ej. documentales).';
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
