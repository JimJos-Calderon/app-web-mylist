BEGIN;

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
  FROM public.lists AS l
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
  FROM public.list_members AS lm
  WHERE lm.list_id = v_list_id
    AND lm.user_id = p_user_id
  LIMIT 1;

  IF v_role IS NOT NULL THEN
    RETURN QUERY
    SELECT true, 'ALREADY_MEMBER', v_list_id, v_role;
    RETURN;
  END IF;

  INSERT INTO public.list_members (list_id, user_id, role)
  SELECT v_list_id, p_user_id, 'member'
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.list_members AS lm
    WHERE lm.list_id = v_list_id
      AND lm.user_id = p_user_id
  );

  SELECT lm.role
  INTO v_role
  FROM public.list_members AS lm
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
