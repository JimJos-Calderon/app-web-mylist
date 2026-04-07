-- Enriquece activity_feed_view para UI social: avatar, poster del ítem,
-- valoraciones y comentarios (además de items y lists).
-- Perfiles: public.user_profiles (equivalente a "profiles" en la app).

BEGIN;

DROP VIEW IF EXISTS public.activity_feed_view CASCADE;

CREATE VIEW public.activity_feed_view AS
SELECT
  al.id AS activity_id,
  al.created_at,
  al.user_id AS actor_user_id,
  COALESCE(up.username, 'Unknown User') AS actor_name,
  up.avatar_url AS avatar_url,
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
LEFT JOIN public.user_profiles up ON up.user_id = al.user_id
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
  );

ALTER VIEW public.activity_feed_view OWNER TO postgres;

COMMENT ON VIEW public.activity_feed_view IS
  'Actividad reciente para miembros: items, lists, item_ratings, item_comments; incluye avatar_url (user_profiles) y item_poster_url.';

COMMIT;
