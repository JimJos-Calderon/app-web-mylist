-- ============================================================================
-- PASO 11: FIX COLABORACIÓN "VISTO" PARA LISTAS COMPARTIDAS
-- ============================================================================
-- PROBLEMA DETECTADO:
-- Las políticas de lectura/escritura (RLS) en la tabla `items` bloqueaban la acción UPDATE.
-- Causaban que si un usuario intentaba marcar "Visto" en una película que no añadió él mismo,
-- o si solo era 'member' de la lista, la base de datos abortara el comando silenciosamente.
--
-- SOLUCIÓN:
-- En una app de producto colaborativa ("decidir qué ver juntos"),
-- CUALQUIER miembro de la lista debe tener permisos para marcar items como vistos.
-- ============================================================================

-- 1. Limpiamos cualquier política estricta heredada de migraciones anteriores
DROP POLICY IF EXISTS "items_update_owner_or_admin" ON items;
DROP POLICY IF EXISTS "Users can update items in their lists" ON items;
DROP POLICY IF EXISTS "Users can update own items" ON items;

-- 2. Creamos la nueva política colaborativa:
-- "Cualquier miembro verificado de la lista puede actualizar los items contenidos en ella"
CREATE POLICY "list_members_can_update_all_items"
  ON items
  FOR UPDATE
  USING (
    list_id IN (
      SELECT list_id FROM list_members 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    list_id IN (
      SELECT list_id FROM list_members 
      WHERE user_id = auth.uid()
    )
  );

-- 3. (Opcional) Soporte de retro-compatibilidad para items pre-históricos sin list_id
CREATE POLICY "fallback_update_own_unlisted_items"
  ON items
  FOR UPDATE
  USING (
    list_id IS NULL AND user_id = auth.uid()
  );
