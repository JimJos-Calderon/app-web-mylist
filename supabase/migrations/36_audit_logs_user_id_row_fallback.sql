-- Si auth.uid() es NULL en el trigger (p. ej. ciertos contextos), audit_logs.user_id
-- quedaba vacío aunque la fila tuviera user_id/owner_id — el feed no coincidía con la UI de ítems.

BEGIN;

CREATE OR REPLACE FUNCTION public.audit_changes_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action TEXT;
  v_record_id TEXT;
  v_user_id UUID;
  v_old_deleted_at TEXT;
  v_new_deleted_at TEXT;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    IF TG_OP = 'INSERT' THEN
      CASE TG_TABLE_NAME
        WHEN 'items' THEN
          v_user_id := (NULLIF(to_jsonb(NEW)->>'user_id', ''))::uuid;
        WHEN 'item_ratings' THEN
          v_user_id := (NULLIF(to_jsonb(NEW)->>'user_id', ''))::uuid;
        WHEN 'item_comments' THEN
          v_user_id := (NULLIF(to_jsonb(NEW)->>'user_id', ''))::uuid;
        WHEN 'lists' THEN
          v_user_id := (NULLIF(to_jsonb(NEW)->>'owner_id', ''))::uuid;
        ELSE
          NULL;
      END CASE;
    ELSIF TG_OP = 'UPDATE' THEN
      CASE TG_TABLE_NAME
        WHEN 'items' THEN
          v_user_id := (NULLIF(to_jsonb(NEW)->>'user_id', ''))::uuid;
        WHEN 'item_ratings' THEN
          v_user_id := (NULLIF(to_jsonb(NEW)->>'user_id', ''))::uuid;
        WHEN 'item_comments' THEN
          v_user_id := (NULLIF(to_jsonb(NEW)->>'user_id', ''))::uuid;
        WHEN 'lists' THEN
          v_user_id := (NULLIF(to_jsonb(NEW)->>'owner_id', ''))::uuid;
        ELSE
          NULL;
      END CASE;
    ELSIF TG_OP = 'DELETE' THEN
      CASE TG_TABLE_NAME
        WHEN 'items' THEN
          v_user_id := (NULLIF(to_jsonb(OLD)->>'user_id', ''))::uuid;
        WHEN 'item_ratings' THEN
          v_user_id := (NULLIF(to_jsonb(OLD)->>'user_id', ''))::uuid;
        WHEN 'item_comments' THEN
          v_user_id := (NULLIF(to_jsonb(OLD)->>'user_id', ''))::uuid;
        WHEN 'lists' THEN
          v_user_id := (NULLIF(to_jsonb(OLD)->>'owner_id', ''))::uuid;
        ELSE
          NULL;
      END CASE;
    END IF;
  END IF;

  IF TG_OP = 'INSERT' THEN
    v_action := 'INSERT';
    v_record_id := to_jsonb(NEW)->>'id';
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'UPDATE';
    v_record_id := COALESCE(to_jsonb(NEW)->>'id', to_jsonb(OLD)->>'id');

    v_old_deleted_at := to_jsonb(OLD)->>'deleted_at';
    v_new_deleted_at := to_jsonb(NEW)->>'deleted_at';

    IF v_old_deleted_at IS NULL AND v_new_deleted_at IS NOT NULL THEN
      v_action := 'DELETE';
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'DELETE';
    v_record_id := to_jsonb(OLD)->>'id';
  ELSE
    RAISE EXCEPTION 'Unsupported trigger operation: %', TG_OP;
  END IF;

  INSERT INTO public.audit_logs (table_name, record_id, action, user_id, created_at)
  VALUES (TG_TABLE_NAME, v_record_id, v_action, v_user_id, NOW());

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.audit_changes_trigger() IS
  'Auditoría genérica; user_id = auth.uid() o user_id/owner_id de la fila si JWT ausente.';

COMMIT;
