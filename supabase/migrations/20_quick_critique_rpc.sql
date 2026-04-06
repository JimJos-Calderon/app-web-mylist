-- Crítica rápida: marcar visto + rating + liked en una transacción (RPC).
-- Amplía el trigger de "comentario obligatorio" para aceptar también item_ratings.

BEGIN;

CREATE OR REPLACE FUNCTION public.check_item_comment_on_watch()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF NEW.visto IS TRUE
     AND COALESCE(OLD.visto, FALSE) IS FALSE
  THEN
    IF NOT (
      EXISTS (
        SELECT 1
        FROM public.item_comments ic
        WHERE ic.item_id = NEW.id
          AND ic.user_id = v_uid
          AND char_length(btrim(ic.content)) > 0
      )
      OR EXISTS (
        SELECT 1
        FROM public.item_ratings ir
        WHERE ir.item_id = NEW.id
          AND ir.user_id = v_uid
          AND (ir.rating IS NOT NULL OR ir.liked IS NOT NULL)
      )
    ) THEN
      RAISE EXCEPTION 'No se puede marcar como visto sin reseña ni critica rapida';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.save_quick_critique(
  p_item_id uuid,
  p_rating integer,
  p_liked boolean
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  v_list_id uuid;
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

  UPDATE public.items
  SET visto = true
  WHERE id = p_item_id
    AND deleted_at IS NULL;

  RETURN json_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.save_quick_critique(uuid, integer, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_quick_critique(uuid, integer, boolean) TO authenticated;

COMMENT ON FUNCTION public.save_quick_critique IS
  'Marca item como visto y guarda rating/liked del usuario en una sola transacción.';

COMMIT;
