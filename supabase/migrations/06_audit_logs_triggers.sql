-- ============================================================================
-- 06_audit_logs_triggers.sql
-- Enterprise migration for:
-- 1) Generic audit table
-- 2) Generic trigger function
-- 3) Trigger attachment on critical tables
-- ============================================================================

BEGIN;

-- --------------------------------------------------------------------------
-- 1) Audit table
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id TEXT,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_table_created_at
  ON public.audit_logs (table_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created_at
  ON public.audit_logs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_record_lookup
  ON public.audit_logs (table_name, record_id);

-- --------------------------------------------------------------------------
-- 2) Generic trigger function
-- --------------------------------------------------------------------------
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

  IF TG_OP = 'INSERT' THEN
    v_action := 'INSERT';
    v_record_id := to_jsonb(NEW)->>'id';
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'UPDATE';
    v_record_id := COALESCE(to_jsonb(NEW)->>'id', to_jsonb(OLD)->>'id');

    -- Treat soft delete (deleted_at null -> value) as a DELETE action in logs.
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

-- --------------------------------------------------------------------------
-- 3) Attach triggers to critical tables
-- --------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_audit_items ON public.items;
CREATE TRIGGER trg_audit_items
AFTER INSERT OR UPDATE OR DELETE ON public.items
FOR EACH ROW
EXECUTE FUNCTION public.audit_changes_trigger();

DROP TRIGGER IF EXISTS trg_audit_lists ON public.lists;
CREATE TRIGGER trg_audit_lists
AFTER INSERT OR UPDATE OR DELETE ON public.lists
FOR EACH ROW
EXECUTE FUNCTION public.audit_changes_trigger();

DROP TRIGGER IF EXISTS trg_audit_list_members ON public.list_members;
CREATE TRIGGER trg_audit_list_members
AFTER INSERT OR UPDATE OR DELETE ON public.list_members
FOR EACH ROW
EXECUTE FUNCTION public.audit_changes_trigger();

DROP TRIGGER IF EXISTS trg_audit_item_ratings ON public.item_ratings;
CREATE TRIGGER trg_audit_item_ratings
AFTER INSERT OR UPDATE OR DELETE ON public.item_ratings
FOR EACH ROW
EXECUTE FUNCTION public.audit_changes_trigger();

-- --------------------------------------------------------------------------
-- 4) Lock down direct client access
-- --------------------------------------------------------------------------
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_logs_no_access ON public.audit_logs;
CREATE POLICY audit_logs_no_access
ON public.audit_logs
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

REVOKE ALL ON TABLE public.audit_logs FROM anon, authenticated;

COMMIT;
