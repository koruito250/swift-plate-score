ALTER FUNCTION public.is_super_admin(UUID) SECURITY INVOKER;
ALTER FUNCTION public.current_tenant_id() SECURITY INVOKER;

DROP POLICY IF EXISTS "Super admins can view super_admins" ON public.super_admins;
CREATE POLICY "Users can view own super_admin row"
  ON public.super_admins
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

REVOKE EXECUTE ON FUNCTION public.is_super_admin(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_tenant_id() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM anon, authenticated;