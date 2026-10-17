ALTER POLICY "Public can view active waiters" ON public.waiters TO anon;
GRANT SELECT ON public.waiters TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.waiters TO authenticated;
GRANT ALL ON public.waiters TO service_role;