-- ============================================================================
-- PASO 12: CORRECCIÓN DE BUG RLS EN EL BORRADO DE LISTAS (SOFT DELETE)
-- ============================================================================
-- PROBLEMA DETECTADO:
-- Al intentar borrar una lista, un trigger ("soft_delete_list_row") aborta el DELETE
-- y lo convierte en un UPDATE, estableciendo `deleted_at = NOW()`.
-- Sin embargo, la directiva `WITH CHECK` de la política `lists_update_owner_only`
-- forzaba estrictamente que el resultado final de cualquier UPDATE tuviera `deleted_at IS NULL`.
-- Al chocar la actualización (que asignaba fecha) con la regla (que exigía IS NULL),
-- PostgreSQL arrojaba el Error 403: "new row violates row-level security policy".
--
-- SOLUCIÓN:
-- Recreamos la política retirando el candado `deleted_at IS NULL` del `WITH CHECK`.
-- El `USING` se encarga de asegurarse de que solo se modifiquen listas activas.
-- ============================================================================

BEGIN;

DROP POLICY IF EXISTS "lists_update_owner_only" ON public.lists;

CREATE POLICY "lists_update_owner_only"
  ON public.lists
  FOR UPDATE
  TO authenticated
  USING (
    owner_id = auth.uid()
    AND deleted_at IS NULL
  )
  WITH CHECK (
    owner_id = auth.uid()
    -- Ya NO exigimos deleted_at IS NULL aquí arriba, permitiendo que el trigger de borrado haga su trabajo.
  );

COMMIT;
