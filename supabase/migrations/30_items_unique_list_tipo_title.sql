-- 1) Deduplicar ítems activos: misma lista + tipo + título normalizado (lower(trim)).
--    Se conserva el más antiguo (created_at, luego id); el resto se marca deleted_at.
-- 2) Índice único para impedir nuevos duplicados.

BEGIN;

WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY list_id, tipo, lower(trim(both titulo))
      ORDER BY created_at ASC NULLS LAST, id ASC
    ) AS rn
  FROM public.items
  WHERE deleted_at IS NULL
    AND list_id IS NOT NULL
)
UPDATE public.items i
SET deleted_at = NOW()
FROM ranked r
WHERE i.id = r.id
  AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS ux_items_active_list_tipo_title_norm
  ON public.items (list_id, tipo, lower(trim(both titulo)))
  WHERE deleted_at IS NULL
    AND list_id IS NOT NULL;

COMMENT ON INDEX public.ux_items_active_list_tipo_title_norm IS
  'Un título (normalizado) no puede repetirse en la misma lista y tipo mientras el ítem esté activo.';

COMMIT;
