BEGIN;

CREATE TABLE IF NOT EXISTS public.item_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE public.item_comments
  ADD COLUMN IF NOT EXISTS item_id BIGINT,
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS content TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.item_comments
  ALTER COLUMN item_id SET NOT NULL,
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN content SET NOT NULL,
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET DEFAULT NOW();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'item_comments_item_id_fkey'
  ) THEN
    ALTER TABLE public.item_comments
      ADD CONSTRAINT item_comments_item_id_fkey
      FOREIGN KEY (item_id)
      REFERENCES public.items(id)
      ON DELETE CASCADE;
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'item_comments_user_id_fkey'
  ) THEN
    ALTER TABLE public.item_comments
      ADD CONSTRAINT item_comments_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES auth.users(id)
      ON DELETE CASCADE;
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'item_comments_content_length_check'
  ) THEN
    ALTER TABLE public.item_comments
      ADD CONSTRAINT item_comments_content_length_check
      CHECK (char_length(btrim(content)) BETWEEN 1 AND 2000);
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'item_comments_one_per_user_item'
  ) THEN
    ALTER TABLE public.item_comments
      ADD CONSTRAINT item_comments_one_per_user_item
      UNIQUE (item_id, user_id);
  END IF;
END;
$$;

ALTER TABLE public.item_comments ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_item_comments_item_id
  ON public.item_comments(item_id);

CREATE INDEX IF NOT EXISTS idx_item_comments_user_id
  ON public.item_comments(user_id);

CREATE INDEX IF NOT EXISTS idx_item_comments_item_user
  ON public.item_comments(item_id, user_id);

DROP POLICY IF EXISTS "item_comments_select_member_items" ON public.item_comments;
CREATE POLICY "item_comments_select_member_items"
  ON public.item_comments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.items i
      JOIN public.list_members lm ON lm.list_id = i.list_id
      WHERE i.id = item_comments.item_id
        AND lm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "item_comments_insert_own" ON public.item_comments;
CREATE POLICY "item_comments_insert_own"
  ON public.item_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.items i
      JOIN public.list_members lm ON lm.list_id = i.list_id
      WHERE i.id = item_comments.item_id
        AND lm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "item_comments_update_own" ON public.item_comments;
CREATE POLICY "item_comments_update_own"
  ON public.item_comments
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.items i
      JOIN public.list_members lm ON lm.list_id = i.list_id
      WHERE i.id = item_comments.item_id
        AND lm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "item_comments_delete_own" ON public.item_comments;
CREATE POLICY "item_comments_delete_own"
  ON public.item_comments
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.items i
      JOIN public.list_members lm ON lm.list_id = i.list_id
      WHERE i.id = item_comments.item_id
        AND lm.user_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.touch_item_comments_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_item_comments_updated_at ON public.item_comments;
CREATE TRIGGER trg_item_comments_updated_at
BEFORE UPDATE ON public.item_comments
FOR EACH ROW
EXECUTE FUNCTION public.touch_item_comments_updated_at();

DROP TRIGGER IF EXISTS trg_audit_item_comments ON public.item_comments;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc
    WHERE proname = 'audit_changes_trigger'
      AND pg_function_is_visible(oid)
  ) THEN
    CREATE TRIGGER trg_audit_item_comments
    AFTER INSERT OR UPDATE OR DELETE ON public.item_comments
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_changes_trigger();
  END IF;
END;
$$;

COMMIT;
