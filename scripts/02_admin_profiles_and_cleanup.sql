-- ============================================================
-- MIGRATION 02: Create Dedicated admin_profiles & Database Cleanup
-- ============================================================

BEGIN;

-- 1. Create dedicated admin_profiles table
CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name    text,
  email        text,
  phone        text,
  admin_role   text DEFAULT 'super_admin' CHECK (admin_role IN ('super_admin', 'moderator', 'monitor')),
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

-- 2. Populate admin_profiles from existing user_roles & auth.users
INSERT INTO public.admin_profiles (id, full_name, email, admin_role)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', 'Admin User'),
  u.email,
  COALESCE(ur.admin_role, 'super_admin')
FROM auth.users u
JOIN public.user_roles ur ON ur.user_id = u.id
WHERE ur.role = 'admin'
ON CONFLICT (id) DO UPDATE 
SET 
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  admin_role = EXCLUDED.admin_role,
  updated_at = now();

-- 3. RLS Policies for admin_profiles
DROP POLICY IF EXISTS "Admins can manage all admin profiles" ON public.admin_profiles;
CREATE POLICY "Admins can manage all admin profiles"
  ON public.admin_profiles FOR ALL TO authenticated
  USING ( public.is_admin() )
  WITH CHECK ( public.is_admin() );

DROP POLICY IF EXISTS "Users can view own admin profile" ON public.admin_profiles;
CREATE POLICY "Users can view own admin profile"
  ON public.admin_profiles FOR SELECT TO authenticated
  USING ( auth.uid() = id );

-- 4. Safely drop legacy unreferenced profiles_archive table if present
DROP TABLE IF EXISTS public.profiles_archive CASCADE;

COMMIT;
