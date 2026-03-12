-- ============================================================================
-- 10_activity_feed_and_member_deletion.sql
-- 1. Allow any list member to delete items (not just owner/admin)
-- 2. Create activity_feed_view for easy consumption by frontend
-- ============================================================================

BEGIN;

-- --------------------------------------------------------------------------
-- 1) Update the items DELETE policy to allow any member (not just owner/admin)
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS "items_delete_owner_or_admin" ON public.items;

CREATE POLICY "items_delete_member"
  ON public.items
  FOR DELETE
  TO authenticated
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.list_members lm
      WHERE lm.list_id = items.list_id
        AND lm.user_id = auth.uid()
    )
  );

-- --------------------------------------------------------------------------
-- 2) Create activity_feed_view for frontend consumption
-- --------------------------------------------------------------------------
-- This view:
-- - Joins audit_logs with items, lists, and profiles
-- - Shows human-readable activity for list members
-- - Automatically filters based on RLS (member can only see lists they're in)
-- --------------------------------------------------------------------------

DROP VIEW IF EXISTS public.activity_feed_view CASCADE;

CREATE VIEW public.activity_feed_view AS
SELECT
  al.id AS activity_id,
  al.created_at,
  al.user_id AS actor_user_id,
  COALESCE(up.username, 'Unknown User') AS actor_name,
  al.table_name,
  al.action,
  CASE
    WHEN al.action = 'INSERT' THEN 'created'
    WHEN al.action = 'UPDATE' THEN 'updated'
    WHEN al.action = 'DELETE' THEN 'deleted'
    ELSE LOWER(al.action)
  END AS action_key,
  al.record_id,
  i.id AS item_id,
  i.titulo AS item_title,
  CASE WHEN i.id IS NOT NULL THEN i.list_id ELSE l.id END AS list_id,
  CASE WHEN l.id IS NOT NULL THEN l.name ELSE NULL END AS list_name
FROM
  public.audit_logs al
LEFT JOIN public.user_profiles up ON up.user_id = al.user_id
LEFT JOIN public.items i ON i.id::text = al.record_id AND al.table_name = 'items'
LEFT JOIN public.lists l ON l.id::text = al.record_id AND al.table_name = 'lists'
WHERE
  al.table_name IN ('items', 'lists')
  AND EXISTS (
    SELECT 1 FROM list_members lm
    WHERE lm.user_id = auth.uid()
    AND (
      (al.table_name = 'items' AND lm.list_id = i.list_id)
      OR (al.table_name = 'lists' AND lm.list_id = l.id)
    )
  )
ORDER BY al.created_at DESC;

-- Allow authenticated users to see the view
-- RLS is applied through the view definition above
ALTER TABLE public.activity_feed_view OWNER TO postgres;

COMMIT;
