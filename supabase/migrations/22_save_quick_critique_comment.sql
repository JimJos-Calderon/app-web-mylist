-- Extiende save_quick_critique con comentario opcional (item_comments) en la misma transacción.

BEGIN;

DROP FUNCTION IF EXISTS public.save_quick_critique(bigint, integer, boolean);

CREATE OR REPLACE FUNCTION public.save_quick_critique(
  p_item_id bigint,
  p_rating integer,
  p_liked boolean,
  p_comment text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  v_list_id uuid;
  v_trim text;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_rating IS NULL OR p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'Invalid rating';
  END IF;

  IF p_liked IS NULL THEN
    RAISE EXCEPTION 'Invalid liked';
  END IF;

  SELECT list_id INTO v_list_id
  FROM public.items
  WHERE id = p_item_id
    AND deleted_at IS NULL;

  IF v_list_id IS NULL THEN
    RAISE EXCEPTION 'Item not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.list_members lm
    WHERE lm.list_id = v_list_id
      AND lm.user_id = uid
  ) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.item_ratings ir
    WHERE ir.item_id = p_item_id
      AND ir.user_id = uid
  ) THEN
    UPDATE public.item_ratings
    SET
      rating = p_rating,
      liked = p_liked,
      updated_at = now()
    WHERE item_id = p_item_id
      AND user_id = uid;
  ELSE
    INSERT INTO public.item_ratings (item_id, user_id, rating, liked, created_at, updated_at)
    VALUES (p_item_id, uid, p_rating, p_liked, now(), now());
  END IF;

  v_trim := nullif(btrim(coalesce(p_comment, '')), '');

  IF v_trim IS NOT NULL THEN
    IF char_length(v_trim) > 2000 THEN
      RAISE EXCEPTION 'Comment too long (max 2000)';
    END IF;

    INSERT INTO public.item_comments (item_id, user_id, content, created_at, updated_at)
    VALUES (p_item_id, uid, v_trim, now(), now())
    ON CONFLICT (item_id, user_id) DO UPDATE
    SET
      content = EXCLUDED.content,
      updated_at = now();
  END IF;

  UPDATE public.items
  SET visto = true
  WHERE id = p_item_id
    AND deleted_at IS NULL;

  RETURN json_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.save_quick_critique(bigint, integer, boolean, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_quick_critique(bigint, integer, boolean, text) TO authenticated;

COMMENT ON FUNCTION public.save_quick_critique IS
  'Marca visto, guarda rating/liked y opcionalmente reseña (item_comments) en una transacción.';

COMMIT;
