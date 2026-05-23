
-- =====================================================
-- Multi-tenant: tenants (clientes do CorpMind) + super admin
-- =====================================================

-- 1) Tabela de super admins
CREATE TABLE public.super_admins (
  user_id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_super_admin(_uid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = _uid)
$$;

CREATE POLICY "Super admins can view super_admins"
  ON public.super_admins FOR SELECT
  USING (public.is_super_admin(auth.uid()));

-- 2) Status enum + tabela tenants
CREATE TYPE public.tenant_status AS ENUM ('ativo', 'bloqueado');

CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  login TEXT NOT NULL UNIQUE,
  auth_user_id UUID UNIQUE,
  valor_assinatura NUMERIC(10,2) NOT NULL DEFAULT 0,
  data_expiracao DATE NOT NULL,
  status public.tenant_status NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS UUID
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.tenants WHERE auth_user_id = auth.uid() LIMIT 1
$$;

CREATE POLICY "Super admins manage tenants"
  ON public.tenants FOR ALL
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Tenant can view own row"
  ON public.tenants FOR SELECT
  USING (auth_user_id = auth.uid());

-- 3) Adicionar tenant_id em waiters e evaluations
ALTER TABLE public.waiters ADD COLUMN tenant_id UUID;
ALTER TABLE public.evaluations ADD COLUMN tenant_id UUID;

-- 4) Criar tenant default e backfill de dados existentes
DO $$
DECLARE
  v_default_tenant UUID;
BEGIN
  INSERT INTO public.tenants (nome, login, valor_assinatura, data_expiracao, status)
  VALUES ('Restaurante Padrão', 'padrao', 0, (CURRENT_DATE + INTERVAL '1 year')::date, 'ativo')
  RETURNING id INTO v_default_tenant;

  UPDATE public.waiters SET tenant_id = v_default_tenant WHERE tenant_id IS NULL;
  UPDATE public.evaluations SET tenant_id = v_default_tenant WHERE tenant_id IS NULL;
END $$;

-- 5) Tornar tenant_id NOT NULL
ALTER TABLE public.waiters ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.evaluations ALTER COLUMN tenant_id SET NOT NULL;

CREATE INDEX idx_waiters_tenant ON public.waiters(tenant_id);
CREATE INDEX idx_evaluations_tenant ON public.evaluations(tenant_id);

-- 6) Migrar admins existentes → super_admins (todos viram super admin)
INSERT INTO public.super_admins (user_id)
SELECT DISTINCT user_id FROM public.user_roles WHERE role = 'admin'
ON CONFLICT DO NOTHING;

-- 7) RLS rewrite para waiters
DROP POLICY IF EXISTS "Admins can delete waiters" ON public.waiters;
DROP POLICY IF EXISTS "Admins can insert waiters" ON public.waiters;
DROP POLICY IF EXISTS "Admins can update waiters" ON public.waiters;
DROP POLICY IF EXISTS "Anyone can view active waiters" ON public.waiters;

CREATE POLICY "Public can view active waiters"
  ON public.waiters FOR SELECT
  USING (active = true);

CREATE POLICY "Super admin can view all waiters"
  ON public.waiters FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Tenant can view own waiters"
  ON public.waiters FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id());

CREATE POLICY "Tenant can insert own waiters"
  ON public.waiters FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.current_tenant_id() OR public.is_super_admin(auth.uid()));

CREATE POLICY "Tenant can update own waiters"
  ON public.waiters FOR UPDATE TO authenticated
  USING (tenant_id = public.current_tenant_id() OR public.is_super_admin(auth.uid()));

CREATE POLICY "Tenant can delete own waiters"
  ON public.waiters FOR DELETE TO authenticated
  USING (tenant_id = public.current_tenant_id() OR public.is_super_admin(auth.uid()));

-- 8) RLS rewrite para evaluations
DROP POLICY IF EXISTS "Admins can delete evaluations" ON public.evaluations;
DROP POLICY IF EXISTS "Admins can update evaluations" ON public.evaluations;
DROP POLICY IF EXISTS "Admins can view evaluations" ON public.evaluations;
DROP POLICY IF EXISTS "Anyone can submit an evaluation" ON public.evaluations;

CREATE POLICY "Public can insert evaluations"
  ON public.evaluations FOR INSERT
  WITH CHECK (tenant_id IS NOT NULL);

CREATE POLICY "Super admin can view all evaluations"
  ON public.evaluations FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Tenant can view own evaluations"
  ON public.evaluations FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id());

CREATE POLICY "Tenant can update own evaluations"
  ON public.evaluations FOR UPDATE TO authenticated
  USING (tenant_id = public.current_tenant_id() OR public.is_super_admin(auth.uid()));

CREATE POLICY "Tenant can delete own evaluations"
  ON public.evaluations FOR DELETE TO authenticated
  USING (tenant_id = public.current_tenant_id() OR public.is_super_admin(auth.uid()));

-- 9) trigger updated_at em tenants
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER tenants_set_updated_at
BEFORE UPDATE ON public.tenants
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
