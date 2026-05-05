-- Visto por miembro: cada usuario tiene su estado en item_user_watch.
-- items.visto queda congelado en false (deprecado) para no afectar a otros miembros.

BEGIN;

CREATE TABLE IF NOT EXISTS public.item_user_watch (
  item_id bigint NOT NULL REFERENCES public.items (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  watched boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT item_user_watch_pkey PRIMARY KEY (item_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_item_user_watch_user_id ON public.item_user_watch (user_id);
CREATE INDEX IF NOT EXISTS idx_item_user_watch_item_id ON public.item_user_watch (item_id);

COMMENT ON TABLE public.item_user_watch IS
  'Estado “visto” por usuario dentro de una lista compartida; ya no se usa items.visto por miembro.';

ALTER TABLE public.item_user_watch ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "item_user_watch_select_list_members" ON public.item_user_watch;
DROP POLICY IF EXISTS "item_user_watch_insert_member" ON public.item_user_watch;
DROP POLICY IF EXISTS "item_user_watch_update_own" ON public.item_user_watch;
DROP POLICY IF EXISTS "item_user_watch_delete_own" ON public.item_user_watch;

CREATE POLICY "item_user_watch_select_list_members"
  ON public.item_user_watch
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.items i
      JOIN public.list_members lm ON lm.list_id = i.list_id
      WHERE i.id = item_user_watch.item_id
        AND lm.user_id = auth.uid()
        AND i.deleted_at IS NULL
    )
  );

CREATE POLICY "item_user_watch_insert_member"
  ON public.item_user_watch
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.items i
      JOIN public.list_members lm ON lm.list_id = i.list_id
      WHERE i.id = item_user_watch.item_id
        AND lm.user_id = auth.uid()
        AND i.deleted_at IS NULL
    )
  );

CREATE POLICY "item_user_watch_update_own"
  ON public.item_user_watch
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "item_user_watch_delete_own"
  ON public.item_user_watch
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.item_user_watch TO authenticated;

INSERT INTO public.item_user_watch (item_id, user_id, watched, updated_at)
SELECT i.id, lm.user_id, true, now()
FROM public.items i
JOIN public.list_members lm ON lm.list_id = i.list_id
WHERE i.deleted_at IS NULL
  AND i.visto IS TRUE
ON CONFLICT (item_id, user_id) DO NOTHING;

UPDATE public.items
SET visto = false
WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_require_comment_before_watch ON public.items;

CREATE OR REPLACE FUNCTION public.check_item_comment_on_user_watch()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.watched IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND COALESCE(OLD.watched, false) IS TRUE THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NOT (
      EXISTS (
        SELECT 1
        FROM public.item_comments ic
        WHERE ic.item_id = NEW.item_id
          AND ic.user_id = NEW.user_id
          AND char_length(btrim(ic.content)) > 0
      )
      OR EXISTS (
        SELECT 1
        FROM public.item_ratings ir
        WHERE ir.item_id = NEW.item_id
          AND ir.user_id = NEW.user_id
          AND (ir.rating IS NOT NULL OR ir.liked IS NOT NULL)
      )
    ) THEN
      RAISE EXCEPTION 'No se puede marcar como visto sin reseña ni crítica rápida para este usuario';
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NOT (
      EXISTS (
        SELECT 1
        FROM public.item_comments ic
        WHERE ic.item_id = NEW.item_id
          AND ic.user_id = NEW.user_id
          AND char_length(btrim(ic.content)) > 0
      )
      OR EXISTS (
        SELECT 1
        FROM public.item_ratings ir
        WHERE ir.item_id = NEW.item_id
          AND ir.user_id = NEW.user_id
          AND (ir.rating IS NOT NULL OR ir.liked IS NOT NULL)
      )
    ) THEN
      RAISE EXCEPTION 'No se puede marcar como visto sin reseña ni crítica rápida para este usuario';
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_require_comment_item_user_watch_ins ON public.item_user_watch;
CREATE TRIGGER trg_require_comment_item_user_watch_ins
  BEFORE INSERT ON public.item_user_watch
  FOR EACH ROW
  EXECUTE FUNCTION public.check_item_comment_on_user_watch();

DROP TRIGGER IF EXISTS trg_require_comment_item_user_watch_upd ON public.item_user_watch;
CREATE TRIGGER trg_require_comment_item_user_watch_upd
  BEFORE UPDATE OF watched ON public.item_user_watch
  FOR EACH ROW
  EXECUTE FUNCTION public.check_item_comment_on_user_watch();

CREATE OR REPLACE FUNCTION public.items_freeze_legacy_visto()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.visto := false;
    RETURN NEW;
  END IF;
  NEW.visto := OLD.visto;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_items_freeze_legacy_visto ON public.items;
CREATE TRIGGER trg_items_freeze_legacy_visto
  BEFORE INSERT OR UPDATE OF visto ON public.items
  FOR EACH ROW
  EXECUTE FUNCTION public.items_freeze_legacy_visto();

DROP FUNCTION IF EXISTS public.check_item_comment_on_watch() CASCADE;

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

  INSERT INTO public.item_user_watch (item_id, user_id, watched, updated_at)
  VALUES (p_item_id, uid, true, now())
  ON CONFLICT (item_id, user_id) DO UPDATE
  SET watched = EXCLUDED.watched, updated_at = EXCLUDED.updated_at;

  RETURN json_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.save_quick_critique(bigint, integer, boolean, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_quick_critique(bigint, integer, boolean, text) TO authenticated;

COMMENT ON FUNCTION public.save_quick_critique IS
  'Marca visto para el usuario actual (item_user_watch), rating/liked y reseña opcional; ya no escribe items.visto.';

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.item_user_watch;
EXCEPTION
  WHEN SQLSTATE '42710' THEN
    NULL;
END;
$$;

COMMIT;
