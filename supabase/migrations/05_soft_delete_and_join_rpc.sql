-- ============================================================================
-- 05_soft_delete_and_join_rpc.sql
-- Enterprise migration for:
-- 1) Soft delete on lists and items
-- 2) RLS alignment so normal SELECTs hide deleted rows
-- 3) Atomic RPC for joining lists by invite code
-- ============================================================================

BEGIN;

-- --------------------------------------------------------------------------
-- 1) Soft delete columns
-- --------------------------------------------------------------------------
ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE public.lists
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Helpful indexes for active rows
CREATE INDEX IF NOT EXISTS idx_items_deleted_at
  ON public.items (deleted_at);

CREATE INDEX IF NOT EXISTS idx_lists_deleted_at
  ON public.lists (deleted_at);

CREATE INDEX IF NOT EXISTS idx_items_active_list
  ON public.items (list_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_lists_active_owner
  ON public.lists (owner_id)
  WHERE deleted_at IS NULL;

ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------------
-- 2) RLS cleanup + recreation for items
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS "items_select_own_lists" ON public.items;
DROP POLICY IF EXISTS "items_insert_owner_or_admin" ON public.items;
DROP POLICY IF EXISTS "items_update_owner_or_admin" ON public.items;
DROP POLICY IF EXISTS "items_delete_owner_or_admin" ON public.items;

DROP POLICY IF EXISTS "Users can view items from their lists" ON public.items;
DROP POLICY IF EXISTS "Users can insert items to their lists" ON public.items;
DROP POLICY IF EXISTS "Users can update items in their lists" ON public.items;
DROP POLICY IF EXISTS "Users can delete their own items" ON public.items;

DROP POLICY IF EXISTS "insertar" ON public.items;
DROP POLICY IF EXISTS "borrar" ON public.items;
DROP POLICY IF EXISTS "full borrar" ON public.items;
DROP POLICY IF EXISTS "poder borrar" ON public.items;

CREATE POLICY "items_select_own_lists"
  ON public.items
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.list_members lm
      JOIN public.lists l ON l.id = lm.list_id
      WHERE lm.list_id = items.list_id
        AND lm.user_id = auth.uid()
        AND l.deleted_at IS NULL
    )
  );

CREATE POLICY "items_insert_owner_or_admin"
  ON public.items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    deleted_at IS NULL
    AND user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.list_members lm
      JOIN public.lists l ON l.id = lm.list_id
      WHERE lm.list_id = items.list_id
        AND lm.user_id = auth.uid()
        AND lm.role IN ('owner', 'admin', 'member')
        AND l.deleted_at IS NULL
    )
  );

CREATE POLICY "items_update_owner_or_admin"
  ON public.items
  FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.list_members lm
      JOIN public.lists l ON l.id = lm.list_id
      WHERE lm.list_id = items.list_id
        AND lm.user_id = auth.uid()
        AND lm.role IN ('owner', 'admin')
        AND l.deleted_at IS NULL
    )
  )
  WITH CHECK (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.list_members lm
      JOIN public.lists l ON l.id = lm.list_id
      WHERE lm.list_id = items.list_id
        AND lm.user_id = auth.uid()
        AND lm.role IN ('owner', 'admin')
        AND l.deleted_at IS NULL
    )
  );

CREATE POLICY "items_delete_owner_or_admin"
  ON public.items
  FOR DELETE
  TO authenticated
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.list_members lm
      JOIN public.lists l ON l.id = lm.list_id
      WHERE lm.list_id = items.list_id
        AND lm.user_id = auth.uid()
        AND lm.role IN ('owner', 'admin')
        AND l.deleted_at IS NULL
    )
  );

-- --------------------------------------------------------------------------
-- 3) RLS cleanup + recreation for lists
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS "lists_select_member" ON public.lists;
DROP POLICY IF EXISTS "lists_insert_user" ON public.lists;
DROP POLICY IF EXISTS "lists_update_owner_only" ON public.lists;
DROP POLICY IF EXISTS "lists_delete_owner_only" ON public.lists;

DROP POLICY IF EXISTS "Users can view lists they belong to" ON public.lists;
DROP POLICY IF EXISTS "Users can create lists" ON public.lists;
DROP POLICY IF EXISTS "Owners can update their lists" ON public.lists;
DROP POLICY IF EXISTS "Owners can delete their lists" ON public.lists;

CREATE POLICY "lists_select_member"
  ON public.lists
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.list_members lm
      WHERE lm.list_id = lists.id
        AND lm.user_id = auth.uid()
    )
  );

CREATE POLICY "lists_insert_user"
  ON public.lists
  FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id = auth.uid()
    AND deleted_at IS NULL
  );

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
    AND deleted_at IS NULL
  );

CREATE POLICY "lists_delete_owner_only"
  ON public.lists
  FOR DELETE
  TO authenticated
  USING (
    owner_id = auth.uid()
    AND deleted_at IS NULL
  );

-- --------------------------------------------------------------------------
-- 4) Convert physical DELETE into soft delete
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.soft_delete_item_row()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.items
  SET deleted_at = NOW()
  WHERE id = OLD.id
    AND deleted_at IS NULL;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_soft_delete_items ON public.items;

CREATE TRIGGER trg_soft_delete_items
BEFORE DELETE ON public.items
FOR EACH ROW
EXECUTE FUNCTION public.soft_delete_item_row();

CREATE OR REPLACE FUNCTION public.soft_delete_list_row()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.lists
  SET deleted_at = NOW()
  WHERE id = OLD.id
    AND deleted_at IS NULL;

  UPDATE public.items
  SET deleted_at = NOW()
  WHERE list_id = OLD.id
    AND deleted_at IS NULL;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_soft_delete_lists ON public.lists;

CREATE TRIGGER trg_soft_delete_lists
BEFORE DELETE ON public.lists
FOR EACH ROW
EXECUTE FUNCTION public.soft_delete_list_row();

-- --------------------------------------------------------------------------
-- 5) Atomic RPC: join_list_with_code
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.join_list_with_code(
  p_user_id UUID,
  p_invite_code TEXT
)
RETURNS TABLE (
  joined BOOLEAN,
  status TEXT,
  list_id UUID,
  membership_role TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_user UUID := auth.uid();
  v_list_id UUID;
  v_role TEXT;
BEGIN
  IF v_auth_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated'
      USING ERRCODE = '42501';
  END IF;

  IF p_user_id IS NULL OR p_user_id <> v_auth_user THEN
    RAISE EXCEPTION 'Cannot join list for another user'
      USING ERRCODE = '42501';
  END IF;

  IF p_invite_code IS NULL OR btrim(p_invite_code) = '' THEN
    RETURN QUERY
    SELECT false, 'INVALID_CODE', NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;

  SELECT l.id
  INTO v_list_id
  FROM public.lists l
  WHERE upper(l.invite_code) = upper(btrim(p_invite_code))
    AND l.deleted_at IS NULL
  LIMIT 1;

  IF v_list_id IS NULL THEN
    RETURN QUERY
    SELECT false, 'LIST_NOT_FOUND', NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;

  SELECT lm.role
  INTO v_role
  FROM public.list_members lm
  WHERE lm.list_id = v_list_id
    AND lm.user_id = p_user_id
  LIMIT 1;

  IF v_role IS NOT NULL THEN
    RETURN QUERY
    SELECT true, 'ALREADY_MEMBER', v_list_id, v_role;
    RETURN;
  END IF;

  INSERT INTO public.list_members (list_id, user_id, role)
  VALUES (v_list_id, p_user_id, 'member')
  ON CONFLICT (list_id, user_id) DO NOTHING;

  SELECT lm.role
  INTO v_role
  FROM public.list_members lm
  WHERE lm.list_id = v_list_id
    AND lm.user_id = p_user_id
  LIMIT 1;

  IF v_role IS NULL THEN
    RAISE EXCEPTION 'Membership could not be created'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN QUERY
  SELECT true, 'JOINED', v_list_id, v_role;
END;
$$;

REVOKE ALL ON FUNCTION public.join_list_with_code(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_list_with_code(UUID, TEXT) TO authenticated;

COMMIT;
