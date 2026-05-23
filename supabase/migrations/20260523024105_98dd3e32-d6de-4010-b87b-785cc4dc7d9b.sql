
REVOKE EXECUTE ON FUNCTION public.is_super_admin(UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.current_tenant_id() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
