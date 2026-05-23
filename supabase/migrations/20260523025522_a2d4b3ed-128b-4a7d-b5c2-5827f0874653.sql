GRANT EXECUTE ON FUNCTION public.is_super_admin(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.current_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;