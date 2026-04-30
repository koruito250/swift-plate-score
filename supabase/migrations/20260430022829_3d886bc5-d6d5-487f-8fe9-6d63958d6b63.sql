CREATE POLICY "Admins can delete evaluations"
ON public.evaluations
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));