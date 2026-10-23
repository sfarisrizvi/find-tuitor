-- ============================================================
-- MIGRATION 10: Security Hardening for RLS Policies
-- Fixes: CV-03, CV-06, CV-07, HV-02, HV-04
-- ============================================================

BEGIN;

-- ============================================================
-- 1. SECURE PUBLIC.CHILDREN TABLE (CV-03)
-- Prevent mass scraping of minor children's PII.
-- Allows access only to parents, administrators, or tutors/clients
-- with an active conversation or contract.
-- ============================================================
DROP POLICY IF EXISTS "Allow authenticated select children" ON public.children;
DROP POLICY IF EXISTS "Scoped select children" ON public.children;

CREATE POLICY "Scoped select children" ON public.children
  FOR SELECT TO authenticated
  USING (
    auth.uid() = client_id
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.conversations conv
      WHERE (conv.client_id = public.children.client_id AND conv.tutor_id = auth.uid())
         OR (conv.client_id = auth.uid() AND conv.tutor_id = public.children.client_id)
    )
    OR EXISTS (
      SELECT 1 FROM public.contracts c
      WHERE (
        (c.client_id = public.children.client_id AND c.tutor_id = auth.uid())
        OR (c.client_id = auth.uid() AND c.tutor_id = public.children.client_id)
      )
      AND (c.child_ids IS NOT NULL AND c.child_ids ? public.children.id::text)
    )
  );

-- ============================================================
-- 2. PROTECT PARENT PII IN CLIENT_PROFILES (CV-03)
-- Restricts client profiles (phone, physical address, lat/lng)
-- to self, admins, or tutors with an active conversation/contract.
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can view client profiles" ON public.client_profiles;
DROP POLICY IF EXISTS "Scoped view client profiles" ON public.client_profiles;

CREATE POLICY "Scoped view client profiles" ON public.client_profiles
  FOR SELECT TO authenticated
  USING (
    auth.uid() = id
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.conversations conv
      WHERE (conv.client_id = public.client_profiles.id AND conv.tutor_id = auth.uid())
         OR (conv.client_id = auth.uid() AND conv.tutor_id = public.client_profiles.id)
    )
    OR EXISTS (
      SELECT 1 FROM public.contracts c
      WHERE (c.client_id = public.client_profiles.id AND c.tutor_id = auth.uid())
         OR (c.client_id = auth.uid() AND c.tutor_id = public.client_profiles.id)
    )
  );

-- ============================================================
-- 3. SECURE CONTRACTS TABLE INSERT (CV-07)
-- Disallow inserting active contracts directly without escrow funding.
-- ============================================================
DROP POLICY IF EXISTS "Allow authenticated insert contracts" ON public.contracts;
DROP POLICY IF EXISTS "Participants can insert contracts" ON public.contracts;
DROP POLICY IF EXISTS "Scoped insert contracts" ON public.contracts;

CREATE POLICY "Scoped insert contracts" ON public.contracts
  FOR INSERT TO authenticated
  WITH CHECK (
    (auth.uid() = client_id OR auth.uid() = tutor_id OR public.is_admin())
    AND status = 'pending'
  );

-- ============================================================
-- 4. RESTRICT ESCROW CONTRACTS DIRECT MANIPULATION (HV-02)
-- Revoke direct user updates/inserts on escrow_contracts.
-- State transitions must exclusively occur through verified RPCs.
-- ============================================================
DROP POLICY IF EXISTS "Participants and admin insert escrow contracts" ON public.escrow_contracts;
DROP POLICY IF EXISTS "Participants and admin update escrow contracts" ON public.escrow_contracts;
DROP POLICY IF EXISTS "Only admins insert escrow contracts" ON public.escrow_contracts;
DROP POLICY IF EXISTS "Only admins update escrow contracts" ON public.escrow_contracts;

CREATE POLICY "Only admins insert escrow contracts" ON public.escrow_contracts
  FOR INSERT TO authenticated
  WITH CHECK ( public.is_admin() );

CREATE POLICY "Only admins update escrow contracts" ON public.escrow_contracts
  FOR UPDATE TO authenticated
  USING ( public.is_admin() )
  WITH CHECK ( public.is_admin() );

-- ============================================================
-- 5. SECURE NOTIFICATIONS TABLE (CV-07)
-- Restrict direct insertion so users can only insert for themselves,
-- while system/admin can insert cross-user notifications.
-- ============================================================
DROP POLICY IF EXISTS "Allow system insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Scoped insert notifications" ON public.notifications;

CREATE POLICY "Scoped insert notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK ( auth.uid() = user_id OR public.is_admin() );

-- ============================================================
-- 6. CHAT MEDIA STORAGE BUCKET HARDENING (CV-06)
-- Ensure chat-media is private and drop public SELECT policy.
-- ============================================================
UPDATE storage.buckets SET public = false WHERE id = 'chat-media';
DROP POLICY IF EXISTS "Anyone can view chat media" ON storage.objects;

COMMIT;
