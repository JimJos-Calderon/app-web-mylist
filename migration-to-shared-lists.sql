-- ============================================================
-- MIGRACIÓN A SISTEMA DE LISTAS COMPARTIDAS
-- ============================================================
-- Este script migra tu sistema actual de listas individuales
-- a un sistema con listas compartidas SIN PERDER DATOS
-- ============================================================

-- PASO 1: Crear nuevas tablas
-- ============================================================

-- Tabla de listas (colecciones compartibles)
CREATE TABLE lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_private BOOLEAN DEFAULT false,
  invite_code VARCHAR(20) UNIQUE NOT NULL
);

-- Tabla de miembros de listas (relación muchos a muchos)
CREATE TABLE list_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID REFERENCES lists(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role VARCHAR(20) DEFAULT 'member', -- 'owner', 'admin', 'member'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(list_id, user_id)
);

-- Índices para optimización
CREATE INDEX idx_lists_owner ON lists(owner_id);
CREATE INDEX idx_lists_invite_code ON lists(invite_code);
CREATE INDEX idx_list_members_list ON list_members(list_id);
CREATE INDEX idx_list_members_user ON list_members(user_id);


-- PASO 2: Agregar columna list_id a tabla existente (NULLABLE por ahora)
-- ============================================================
ALTER TABLE items 
ADD COLUMN list_id UUID REFERENCES lists(id) ON DELETE CASCADE;

-- Crear índice para la nueva columna
CREATE INDEX idx_items_list_id ON items(list_id);


-- PASO 3: MIGRACIÓN DE DATOS - Crear UNA lista compartida para todos los usuarios
-- ============================================================

-- Función para generar códigos de invitación únicos
CREATE OR REPLACE FUNCTION generate_invite_code() 
RETURNS TEXT AS $$
BEGIN
  RETURN upper(substring(md5(random()::text) from 1 for 8));
END;
$$ LANGUAGE plpgsql;

-- Crear UNA lista compartida con el primer usuario como owner
DO $$
DECLARE
  first_user_id UUID;
  shared_list_id UUID;
BEGIN
  -- Obtener el primer usuario que tenga items
  SELECT user_id INTO first_user_id
  FROM items
  ORDER BY created_at ASC
  LIMIT 1;
  
  -- Crear la lista compartida
  INSERT INTO lists (name, description, owner_id, invite_code, is_private)
  VALUES (
    'Nuestra Colección',
    'Lista compartida migrada automáticamente',
    first_user_id,
    generate_invite_code(),
    false
  )
  RETURNING id INTO shared_list_id;
  
  -- Agregar a TODOS los usuarios como miembros de la lista compartida
  -- El owner con rol 'owner', los demás con rol 'member'
  INSERT INTO list_members (list_id, user_id, role)
  SELECT DISTINCT
    shared_list_id,
    user_id,
    CASE 
      WHEN user_id = first_user_id THEN 'owner'
      ELSE 'member'
    END
  FROM items;
  
  -- Asociar TODOS los items a la lista compartida
  UPDATE items
  SET list_id = shared_list_id
  WHERE list_id IS NULL;
END $$;


-- PASO 5: Verificación (ejecutar para confirmar que todo migró correctamente)
-- ============================================================
-- Verificar que todos los items tienen una lista asignada
SELECT 
  COUNT(*) as total_items,
  COUNT(list_id) as items_with_list,
  COUNT(*) - COUNT(list_id) as items_without_list
FROM items;

-- Ver estadísticas por usuario
SELECT 
  u.email,
  l.name as lista_nombre,
  COUNT(li.id) as cantidad_items
FROM auth.users u
LEFT JOIN lists l ON l.owner_id = u.id
LEFT JOIN items li ON li.list_id = l.id
GROUP BY u.email, l.name
ORDER BY cantidad_items DESC;


-- PASO 6: Actualizar Row Level Security (RLS) para nuevos accesos compartidos
-- ============================================================

-- Desactivar políticas antiguas
DROP POLICY IF EXISTS "Users can view own items" ON items;
DROP POLICY IF EXISTS "Users can insert own items" ON items;
DROP POLICY IF EXISTS "Users can update own items" ON items;
DROP POLICY IF EXISTS "Users can delete own items" ON items;

-- NUEVA POLÍTICA: Ver items de listas donde soy miembro
CREATE POLICY "Users can view items from their lists"
ON items FOR SELECT
TO authenticated
USING (
  list_id IN (
    SELECT list_id 
    FROM list_members 
    WHERE user_id = auth.uid()
  )
  OR user_id = auth.uid() -- Compatibilidad: items sin lista asignada
);

-- NUEVA POLÍTICA: Insertar items en listas donde soy miembro
CREATE POLICY "Users can insert items to their lists"
ON items FOR INSERT
TO authenticated
WITH CHECK (
  list_id IN (
    SELECT list_id 
    FROM list_members 
    WHERE user_id = auth.uid()
  )
);

-- NUEVA POLÍTICA: Actualizar items propios o de listas compartidas
CREATE POLICY "Users can update items in their lists"
ON items FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid() -- Solo el creador puede editar
  AND list_id IN (
    SELECT list_id 
    FROM list_members 
    WHERE user_id = auth.uid()
  )
);

-- NUEVA POLÍTICA: Eliminar solo items propios
CREATE POLICY "Users can delete their own items"
ON items FOR DELETE
TO authenticated
USING (user_id = auth.uid());


-- RLS para tabla LISTS
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view lists they belong to"
ON lists FOR SELECT
TO authenticated
USING (
  owner_id = auth.uid() 
  OR id IN (
    SELECT list_id 
    FROM list_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Owners can update their lists"
ON lists FOR UPDATE
TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY "Users can create lists"
ON lists FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can delete their lists"
ON lists FOR DELETE
TO authenticated
USING (owner_id = auth.uid());


-- RLS para tabla LIST_MEMBERS
ALTER TABLE list_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view members of their lists"
ON list_members FOR SELECT
TO authenticated
USING (
  list_id IN (
    SELECT list_id 
    FROM list_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Owners can manage members"
ON list_members FOR ALL
TO authenticated
USING (
  list_id IN (
    SELECT id 
    FROM lists 
    WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can join lists (self insert)"
ON list_members FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());


-- PASO 7: Crear función para limpiar códigos de invitación antiguos (opcional)
-- ============================================================
CREATE OR REPLACE FUNCTION regenerate_invite_code(list_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
BEGIN
  new_code := generate_invite_code();
  
  UPDATE lists 
  SET invite_code = new_code
  WHERE id = list_uuid;
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- RESULTADO ESPERADO:
-- ============================================================
-- ✅ Se crea UNA lista compartida "Nuestra Colección"
-- ✅ TODOS los usuarios existentes son miembros de esa lista
-- ✅ TODOS los items (películas/series) están en esa lista compartida
-- ✅ Ambos usuarios ven todo el contenido junto
-- ✅ Pueden seguir agregando/editando items colaborativamente
-- ✅ Pueden crear NUEVAS listas adicionales si lo desean
-- ✅ Pueden invitar a más personas con el código de invitación
-- ============================================================


-- ============================================================
-- ROLLBACK (en caso de emergencia)
-- ============================================================
/*
-- Deshacer cambios (¡CUIDADO! Esto elimina las nuevas tablas)
DROP TABLE IF EXISTS list_members CASCADE;
DROP TABLE IF EXISTS lists CASCADE;
ALTER TABLE items DROP COLUMN IF EXISTS list_id;
DROP FUNCTION IF EXISTS generate_invite_code();
DROP FUNCTION IF EXISTS regenerate_invite_code(UUID);

-- Restaurar políticas originales
CREATE POLICY "Users can view own items"
  ON items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own items"
  ON items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own items"
  ON items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own items"
  ON items FOR DELETE
  USING (auth.uid() = user_id);
*/
