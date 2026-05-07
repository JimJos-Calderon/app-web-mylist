-- Valida que lists.next_queue_item_id apunte a un ítem de la misma lista (además de la FK a items).

CREATE OR REPLACE FUNCTION public.enforce_list_next_queue_item_same_list()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.next_queue_item_id IS NULL THEN
    RETURN NEW;
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM public.items i
    WHERE i.id = NEW.next_queue_item_id
      AND i.list_id = NEW.id
  ) THEN
    RAISE EXCEPTION 'next_queue_item_must_belong_to_list'
      USING DETAIL = 'next_queue_item_id must reference an item that belongs to this list';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS lists_next_queue_item_same_list ON public.lists;

CREATE TRIGGER lists_next_queue_item_same_list
  BEFORE INSERT OR UPDATE OF next_queue_item_id ON public.lists
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_list_next_queue_item_same_list();

COMMENT ON FUNCTION public.enforce_list_next_queue_item_same_list() IS
  'Raises next_queue_item_must_belong_to_list if next_queue_item_id is set but not an item of this list.';
