-- ============================================================
-- ROLLBACK MIGRATION 10
-- Restores previous RLS policies for emergency recovery.
-- ============================================================

BEGIN;

-- 1. Rollback children
DROP POLICY IF EXISTS "Scoped select children" ON public.children;
CREATE POLICY "Allow authenticated select children"
  ON public.children FOR SELECT TO authenticated
  USING (true);

-- 2. Rollback client_profiles
DROP POLICY IF EXISTS "Scoped view client profiles" ON public.client_profiles;
CREATE POLICY "Authenticated users can view client profiles"
  ON public.client_profiles FOR SELECT TO authenticated
  USING (true);

-- 3. Rollback contracts
DROP POLICY IF EXISTS "Scoped insert contracts" ON public.contracts;
CREATE POLICY "Allow authenticated insert contracts"
  ON public.contracts FOR INSERT TO authenticated
  WITH CHECK (true);

-- 4. Rollback escrow_contracts
DROP POLICY IF EXISTS "Only admins insert escrow contracts" ON public.escrow_contracts;
DROP POLICY IF EXISTS "Only admins update escrow contracts" ON public.escrow_contracts;
CREATE POLICY "Participants and admin insert escrow contracts"
  ON public.escrow_contracts FOR INSERT TO authenticated
  WITH CHECK ( auth.uid() = client_id OR auth.uid() = tutor_id OR public.is_admin() );
CREATE POLICY "Participants and admin update escrow contracts"
  ON public.escrow_contracts FOR UPDATE TO authenticated
  USING ( auth.uid() = client_id OR auth.uid() = tutor_id OR public.is_admin() )
  WITH CHECK ( auth.uid() = client_id OR auth.uid() = tutor_id OR public.is_admin() );

-- 5. Rollback notifications
DROP POLICY IF EXISTS "Scoped insert notifications" ON public.notifications;
CREATE POLICY "Allow system insert notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (true);

COMMIT;
