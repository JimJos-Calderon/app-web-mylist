BEGIN;

DROP POLICY IF EXISTS "items_delete_owner_or_admin" ON public.items;

CREATE POLICY "items_delete_owner_or_admin"
  ON public.items
  FOR DELETE
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM public.list_members lm
        JOIN public.lists l ON l.id = lm.list_id
        WHERE lm.list_id = items.list_id
          AND lm.user_id = auth.uid()
          AND lm.role IN ('owner', 'admin')
          AND l.deleted_at IS NULL
      )
    )
  );

CREATE OR REPLACE FUNCTION public.soft_delete_item_row()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.items
  SET deleted_at = NOW()
  WHERE id = OLD.id
    AND deleted_at IS NULL;

  RETURN NULL;
END;
$$;

COMMIT;