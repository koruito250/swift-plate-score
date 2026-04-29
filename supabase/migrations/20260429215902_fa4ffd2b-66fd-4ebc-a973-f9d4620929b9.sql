-- Roles enum + table
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Auto-grant admin role to first user signing up (open admin signup)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Waiters
CREATE TABLE public.waiters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.waiters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active waiters"
  ON public.waiters FOR SELECT
  USING (active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert waiters"
  ON public.waiters FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update waiters"
  ON public.waiters FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete waiters"
  ON public.waiters FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Evaluations
CREATE TABLE public.evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  waiter_id UUID REFERENCES public.waiters(id) ON DELETE SET NULL,
  table_number TEXT,
  service_rating SMALLINT NOT NULL CHECK (service_rating BETWEEN 1 AND 5),
  food_time_rating SMALLINT NOT NULL CHECK (food_time_rating BETWEEN 1 AND 5),
  food_quality_rating SMALLINT NOT NULL CHECK (food_quality_rating BETWEEN 1 AND 5),
  ambience_rating SMALLINT NOT NULL CHECK (ambience_rating BETWEEN 1 AND 5),
  bill_time_rating SMALLINT NOT NULL CHECK (bill_time_rating BETWEEN 1 AND 5),
  overall_rating SMALLINT NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  comment TEXT,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit an evaluation"
  ON public.evaluations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view evaluations"
  ON public.evaluations FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update evaluations"
  ON public.evaluations FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_evaluations_created_at ON public.evaluations(created_at DESC);
CREATE INDEX idx_evaluations_waiter ON public.evaluations(waiter_id);

-- Seed example waiters
INSERT INTO public.waiters (name) VALUES ('Hiroshi'), ('Akemi'), ('Lucas'), ('Mariana');