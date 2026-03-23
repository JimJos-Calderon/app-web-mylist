-- ============================================================================
-- PASO 13: CORRECCIÓN DEL TRIGGER SOFT DELETE EN LISTAS
-- ============================================================================
-- CAUSA REAL DEL ERROR:
-- El trigger "soft_delete_list_row" convierte el DELETE en un UPDATE interno.
-- Ese UPDATE interno también pasa por la validación RLS, y como se ejecuta
-- con los permisos del usuario normal, el WITH CHECK lo bloquea.
--
-- SOLUCIÓN:
-- Recrear la función con SECURITY DEFINER para que el trigger en sí (no el usuario)
-- sea quien ejecute el UPDATE interno, saltándose RLS correctamente.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.soft_delete_list_row()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Soft delete the list itself
  UPDATE public.lists
  SET deleted_at = NOW()
  WHERE id = OLD.id
    AND deleted_at IS NULL;

  -- Cascade soft delete to all items in the list
  UPDATE public.items
  SET deleted_at = NOW()
  WHERE list_id = OLD.id
    AND deleted_at IS NULL;

  RETURN NULL; -- Cancels the actual DELETE
END;
$$;

-- Recreate the trigger (same as before, just updated function)
DROP TRIGGER IF EXISTS trg_soft_delete_lists ON public.lists;

CREATE TRIGGER trg_soft_delete_lists
BEFORE DELETE ON public.lists
FOR EACH ROW
EXECUTE FUNCTION public.soft_delete_list_row();
