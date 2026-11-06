CREATE OR REPLACE FUNCTION public.tenant_public_name(p_tenant_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT nome FROM public.tenants
  WHERE id = p_tenant_id AND status = 'ativo'
  LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.tenant_public_name(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.tenant_public_name(uuid) TO authenticated;