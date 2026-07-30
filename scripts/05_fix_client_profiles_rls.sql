-- Migration 05: Allow authenticated users to view client profiles and children details
-- Fixes issue where RLS blocked tutors from viewing client profile names and student/child records in chat

DROP POLICY IF EXISTS "Authenticated users can view client profiles" ON public.client_profiles;
CREATE POLICY "Authenticated users can view client profiles"
  ON public.client_profiles
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated select children" ON public.children;
CREATE POLICY "Allow authenticated select children"
  ON public.children
  FOR SELECT
  TO authenticated
  USING (true);
