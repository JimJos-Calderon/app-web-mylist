-- El feed mostraba "Unknown User" cuando audit_logs.user_id era NULL pero la fila
-- de negocio (items, item_ratings, item_comments, lists) sí tenía user_id/owner_id.
-- Las tarjetas de ítem usan items.user_id; el feed debe alinearse con ese criterio.

BEGIN;

DROP VIEW IF EXISTS public.activity_feed_view CASCADE;

CREATE VIEW public.activity_feed_view AS
SELECT
  j.activity_id,
  j.created_at,
  j.effective_actor_user_id AS actor_user_id,
  COALESCE(
    NULLIF(TRIM(up.username), ''),
    public.activity_actor_email_local_part(j.effective_actor_user_id),
    'Unknown User'
  ) AS actor_name,
  up.avatar_url AS avatar_url,
  j.table_name,
  j.action,
  j.action_key,
  j.record_id,
  j.item_id,
  j.item_title,
  j.item_poster_url,
  j.list_id,
  j.list_name,
  j.rating,
  j.comment_text
FROM (
  SELECT
    al.id AS activity_id,
    al.created_at,
    CASE al.table_name
      WHEN 'items' THEN COALESCE(al.user_id, i_items_actor.user_id)
      WHEN 'item_ratings' THEN COALESCE(al.user_id, ir.user_id)
      WHEN 'item_comments' THEN COALESCE(al.user_id, ic.user_id)
      WHEN 'lists' THEN COALESCE(al.user_id, l_lists.owner_id)
      ELSE al.user_id
    END AS effective_actor_user_id,
    al.table_name,
    al.action,
    CASE
      WHEN al.action = 'INSERT' THEN 'created'
      WHEN al.action = 'UPDATE' THEN 'updated'
      WHEN al.action = 'DELETE' THEN 'deleted'
      ELSE LOWER(al.action)
    END AS action_key,
    al.record_id,
    COALESCE(i_items.id, i_rat.id, i_com.id) AS item_id,
    COALESCE(i_items.titulo, i_rat.titulo, i_com.titulo) AS item_title,
    COALESCE(i_items.poster_url, i_rat.poster_url, i_com.poster_url) AS item_poster_url,
    COALESCE(i_items.list_id, i_rat.list_id, i_com.list_id, l_lists.id) AS list_id,
    COALESCE(l_item.name, l_lists.name) AS list_name,
    ir.rating AS rating,
    ic.content AS comment_text
  FROM public.audit_logs al
  LEFT JOIN public.items i_items_actor
    ON i_items_actor.id::text = al.record_id
    AND al.table_name = 'items'
  LEFT JOIN public.items i_items
    ON i_items.id::text = al.record_id
    AND al.table_name = 'items'
    AND i_items.deleted_at IS NULL
  LEFT JOIN public.item_ratings ir
    ON ir.id::text = al.record_id
    AND al.table_name = 'item_ratings'
  LEFT JOIN public.items i_rat
    ON i_rat.id = ir.item_id
    AND i_rat.deleted_at IS NULL
  LEFT JOIN public.item_comments ic
    ON ic.id::text = al.record_id
    AND al.table_name = 'item_comments'
  LEFT JOIN public.items i_com
    ON i_com.id = ic.item_id
    AND i_com.deleted_at IS NULL
  LEFT JOIN public.lists l_lists
    ON l_lists.id::text = al.record_id
    AND al.table_name = 'lists'
  LEFT JOIN public.lists l_item
    ON l_item.id = COALESCE(i_items.list_id, i_rat.list_id, i_com.list_id)
  WHERE
    al.table_name IN ('items', 'lists', 'item_ratings', 'item_comments')
    AND (
      (
        al.table_name = 'items'
        AND i_items.id IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM public.list_members lm
          WHERE lm.user_id = auth.uid()
            AND lm.list_id = i_items.list_id
        )
      )
      OR (
        al.table_name = 'lists'
        AND l_lists.id IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM public.list_members lm
          WHERE lm.user_id = auth.uid()
            AND lm.list_id = l_lists.id
        )
      )
      OR (
        al.table_name = 'item_ratings'
        AND ir.id IS NOT NULL
        AND i_rat.id IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM public.list_members lm
          WHERE lm.user_id = auth.uid()
            AND lm.list_id = i_rat.list_id
        )
      )
      OR (
        al.table_name = 'item_comments'
        AND ic.id IS NOT NULL
        AND i_com.id IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM public.list_members lm
          WHERE lm.user_id = auth.uid()
            AND lm.list_id = i_com.list_id
        )
      )
    )
) j
LEFT JOIN public.user_profiles up ON up.user_id = j.effective_actor_user_id;

ALTER VIEW public.activity_feed_view OWNER TO postgres;

COMMENT ON VIEW public.activity_feed_view IS
  'Actividad reciente; actor_name usa audit_logs.user_id o el user_id/owner_id de la fila relacionada si el audit no guardó JWT.';

COMMIT;
