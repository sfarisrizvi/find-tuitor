-- ============================================================
-- MIGRATION 04: Fix RLS Policies for Contracts, Children & Notifications
-- ============================================================

BEGIN;

-- 1. Fix RLS for contracts table
DROP POLICY IF EXISTS "Participants can insert contracts" ON public.contracts;
DROP POLICY IF EXISTS "Allow authenticated insert contracts" ON public.contracts;

CREATE POLICY "Allow authenticated insert contracts"
  ON public.contracts FOR INSERT TO authenticated
  WITH CHECK (true);

-- 2. Allow authenticated users (tutors/admins) to view children profiles for tuition agreements
DROP POLICY IF EXISTS "Allow authenticated select children" ON public.children;
CREATE POLICY "Allow authenticated select children"
  ON public.children FOR SELECT TO authenticated
  USING (true);

-- 3. Allow system notifications insert
DROP POLICY IF EXISTS "Allow system insert notifications" ON public.notifications;
CREATE POLICY "Allow system insert notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (true);

COMMIT;
