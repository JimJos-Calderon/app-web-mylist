-- ============================================================================
-- PASO 4: SEGURIDAD EN BASE DE DATOS
-- Row Level Security (RLS) + Check Constraints
-- ============================================================================
-- Este script implementa seguridad a nivel de base de datos para proteger:
-- 1. Que solo usuarios autorizados vean/modifiquen sus datos
-- 2. Que los datos cumplan con validaciones de tipo y formato
-- ============================================================================

-- ============================================================================
-- 1. HABILITAR RLS EN TODAS LAS TABLAS
-- ============================================================================

ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_ratings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. POLÍTICAS RLS PARA TABLA: items
-- ============================================================================
-- Un usuario solo puede ver items de listas en las que es miembro
-- Un usuario solo puede modificar items de listas que posee o administra

CREATE POLICY "items_select_own_lists"
  ON items
  FOR SELECT
  USING (
    list_id IN (
      SELECT list_id FROM list_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "items_insert_owner_or_admin"
  ON items
  FOR INSERT
  WITH CHECK (
    list_id IN (
      SELECT list_id FROM list_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "items_update_owner_or_admin"
  ON items
  FOR UPDATE
  USING (
    list_id IN (
      SELECT list_id FROM list_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    list_id IN (
      SELECT list_id FROM list_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "items_delete_owner_or_admin"
  ON items
  FOR DELETE
  USING (
    list_id IN (
      SELECT list_id FROM list_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- 3. POLÍTICAS RLS PARA TABLA: lists
-- ============================================================================
-- Un usuario solo puede ver listas en las que es miembro
-- Un usuario solo puede modificar listas que posee

CREATE POLICY "lists_select_member"
  ON lists
  FOR SELECT
  USING (
    id IN (
      SELECT list_id FROM list_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "lists_insert_user"
  ON lists
  FOR INSERT
  WITH CHECK (
    owner_id = auth.uid()
  );

CREATE POLICY "lists_update_owner_only"
  ON lists
  FOR UPDATE
  USING (
    owner_id = auth.uid()
  )
  WITH CHECK (
    owner_id = auth.uid()
  );

CREATE POLICY "lists_delete_owner_only"
  ON lists
  FOR DELETE
  USING (
    owner_id = auth.uid()
  );

-- ============================================================================
-- 4. POLÍTICAS RLS PARA TABLA: list_members
-- ============================================================================
-- Un usuario solo puede ver sus propios registros de membresía
-- Solo el propietario puede agregar/remover miembros

CREATE POLICY "list_members_select_own"
  ON list_members
  FOR SELECT
  USING (
    user_id = auth.uid()
  );

CREATE POLICY "list_members_insert_list_owner"
  ON list_members
  FOR INSERT
  WITH CHECK (
    list_id IN (
      SELECT id FROM lists WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "list_members_delete_list_owner"
  ON list_members
  FOR DELETE
  USING (
    list_id IN (
      SELECT id FROM lists WHERE owner_id = auth.uid()
    )
  );

-- ============================================================================
-- 5. POLÍTICAS RLS PARA TABLA: item_ratings
-- ============================================================================
-- Un usuario solo puede ver/modificar sus propias calificaciones

CREATE POLICY "item_ratings_select_own"
  ON item_ratings
  FOR SELECT
  USING (
    user_id = auth.uid()
  );

CREATE POLICY "item_ratings_insert_own"
  ON item_ratings
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
  );

CREATE POLICY "item_ratings_update_own"
  ON item_ratings
  FOR UPDATE
  USING (
    user_id = auth.uid()
  )
  WITH CHECK (
    user_id = auth.uid()
  );

CREATE POLICY "item_ratings_delete_own"
  ON item_ratings
  FOR DELETE
  USING (
    user_id = auth.uid()
  );

-- ============================================================================
-- 6. CHECK CONSTRAINTS - VALIDACIÓN DE DATOS
-- ============================================================================

-- Tabla items: validar que tipo sea 'pelicula' o 'serie'
ALTER TABLE items
ADD CONSTRAINT check_tipo_valid 
  CHECK (tipo IN ('pelicula', 'serie'));

-- Tabla items: validar que visto es boolean (0 o 1)
ALTER TABLE items
ADD CONSTRAINT check_visto_boolean 
  CHECK (visto IN (true, false));

-- Tabla items: validar longitud del título
ALTER TABLE items
ADD CONSTRAINT check_titulo_length 
  CHECK (length(titulo) >= 1 AND length(titulo) <= 255);

-- Tabla items: validar que user_id no sea nulo
ALTER TABLE items
ADD CONSTRAINT check_user_id_not_null 
  CHECK (user_id IS NOT NULL);

-- Tabla items: validar que list_id no sea nulo
ALTER TABLE items
ADD CONSTRAINT check_list_id_not_null 
  CHECK (list_id IS NOT NULL);

-- Tabla lists: validar longitud del nombre
ALTER TABLE lists
ADD CONSTRAINT check_list_name_length 
  CHECK (length(name) >= 1 AND length(name) <= 100);

-- Tabla lists: validar que owner_id no sea nulo
ALTER TABLE lists
ADD CONSTRAINT check_list_owner_not_null 
  CHECK (owner_id IS NOT NULL);

-- Tabla lists: validar que is_private es boolean
ALTER TABLE lists
ADD CONSTRAINT check_is_private_boolean 
  CHECK (is_private IN (true, false));

-- Tabla lists: validar longitud del invite_code
ALTER TABLE lists
ADD CONSTRAINT check_invite_code_length 
  CHECK (length(invite_code) > 0);

-- Tabla list_members: validar que role sea uno de los valores permitidos
ALTER TABLE list_members
ADD CONSTRAINT check_role_valid 
  CHECK (role IN ('owner', 'admin', 'member'));

-- Tabla list_members: validar que user_id no sea nulo
ALTER TABLE list_members
ADD CONSTRAINT check_list_member_user_not_null 
  CHECK (user_id IS NOT NULL);

-- Tabla list_members: validar que list_id no sea nulo
ALTER TABLE list_members
ADD CONSTRAINT check_list_member_list_not_null 
  CHECK (list_id IS NOT NULL);

-- Tabla item_ratings: validar que rating está entre 0 y 5
ALTER TABLE item_ratings
ADD CONSTRAINT check_rating_range 
  CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5));

-- Tabla item_ratings: validar que liked es boolean
ALTER TABLE item_ratings
ADD CONSTRAINT check_liked_boolean 
  CHECK (liked IN (true, false) OR liked IS NULL);

-- Tabla item_ratings: validar que user_id no sea nulo
ALTER TABLE item_ratings
ADD CONSTRAINT check_rating_user_not_null 
  CHECK (user_id IS NOT NULL);

-- Tabla item_ratings: validar que item_id no sea nulo
ALTER TABLE item_ratings
ADD CONSTRAINT check_rating_item_not_null 
  CHECK (item_id IS NOT NULL);

-- ============================================================================
-- 7. ÍNDICES PARA OPTIMIZAR QUERIES CON RLS
-- ============================================================================
-- Estos índices aceleran las búsquedas que RLS hace constantemente

CREATE INDEX IF NOT EXISTS idx_list_members_user_id 
  ON list_members(user_id);

CREATE INDEX IF NOT EXISTS idx_list_members_list_id 
  ON list_members(list_id);

CREATE INDEX IF NOT EXISTS idx_items_list_id 
  ON items(list_id);

CREATE INDEX IF NOT EXISTS idx_items_user_id 
  ON items(user_id);

CREATE INDEX IF NOT EXISTS idx_item_ratings_user_id 
  ON item_ratings(user_id);

CREATE INDEX IF NOT EXISTS idx_item_ratings_item_id 
  ON item_ratings(item_id);

-- ============================================================================
-- FIN - TODO ESTÁ SEGURO AHORA ✅
-- ============================================================================
-- RLS: Cada usuario solo ve/modifica sus datos
-- Check Constraints: Los datos cumplen con el esquema esperado
-- Índices: Las queries son rápidas incluso con RLS habilitado
