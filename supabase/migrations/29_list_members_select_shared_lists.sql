-- Permite a cada miembro ver todas las filas de list_members de las listas a las que pertenece
-- (necesario para contar miembros en la UI colaborativa). Evita recursión RLS con función STABLE SECURITY DEFINER.

BEGIN;

CREATE OR REPLACE FUNCTION public.auth_user_list_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lm.list_id FROM public.list_members lm WHERE lm.user_id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.auth_user_list_ids() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.auth_user_list_ids() TO authenticated;

DROP POLICY IF EXISTS "list_members_select_own" ON public.list_members;

CREATE POLICY "list_members_select_in_shared_lists"
  ON public.list_members
  FOR SELECT
  TO authenticated
  USING (list_id IN (SELECT public.auth_user_list_ids()));

COMMENT ON POLICY "list_members_select_in_shared_lists" ON public.list_members IS
  'Miembros ven el roster completo de cada lista compartida a la que pertenecen.';

COMMIT;
