BEGIN;

CREATE OR REPLACE FUNCTION public.check_item_comment_on_watch()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.visto IS TRUE
     AND COALESCE(OLD.visto, FALSE) IS FALSE
     AND NOT EXISTS (
       SELECT 1
       FROM public.item_comments ic
       WHERE ic.item_id = NEW.id
         AND ic.user_id = NEW.user_id
         AND char_length(btrim(ic.content)) > 0
     ) THEN
    RAISE EXCEPTION 'No se puede marcar como visto sin incluir una reseña';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_require_comment_before_watch ON public.items;

CREATE TRIGGER trg_require_comment_before_watch
BEFORE UPDATE OF visto ON public.items
FOR EACH ROW
WHEN (
  COALESCE(OLD.visto, FALSE) IS FALSE
  AND NEW.visto IS TRUE
)
EXECUTE FUNCTION public.check_item_comment_on_watch();

COMMIT;
