-- ============================================================
-- MIGRATION: Secure User Roles and Performance Indexes
-- ============================================================

BEGIN;

-- 1. Create secure roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id     uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        text NOT NULL CHECK (role IN ('client', 'tutor', 'admin')),
  admin_role  text CHECK (admin_role IN ('super_admin', 'moderator', 'monitor')),
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create SECURITY DEFINER helper function to bypass RLS recursion loops
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RLS Policies for user_roles
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
CREATE POLICY "Users can view own role" 
  ON public.user_roles FOR SELECT TO authenticated 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles" 
  ON public.user_roles FOR ALL TO authenticated 
  USING (public.is_admin());

-- 2. Backfill existing users into public.user_roles
-- Force any email like 'mock.tutor%' to be tutor, and 'admin@%' to be admin
INSERT INTO public.user_roles (user_id, role, admin_role)
SELECT 
  id,
  CASE 
    WHEN email LIKE 'admin@%' THEN 'admin'
    WHEN raw_user_meta_data->>'role' = 'client' THEN 'client'
    ELSE 'tutor'
  END as role,
  CASE 
    WHEN email LIKE 'admin@%' THEN 'super_admin'
    ELSE raw_user_meta_data->>'admin_role'
  END as admin_role
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- 3. Update auth signup trigger to force safe roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_role text;
BEGIN
  -- Force role to either client or tutor based on metadata (never admin!)
  IF NEW.raw_user_meta_data->>'role' = 'client' THEN
    v_role := 'client';
    INSERT INTO public.client_profiles (id, full_name, email)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email)
    ON CONFLICT (id) DO NOTHING;
  ELSE
    v_role := 'tutor';
    INSERT INTO public.tutor_profiles (id, full_name, email)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email)
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- Insert securely into user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Update other RLS policies to use public.is_admin()
DROP POLICY IF EXISTS "Admins can view all client profiles" ON client_profiles;
CREATE POLICY "Admins can view all client profiles" 
  ON client_profiles FOR SELECT TO authenticated 
  USING ( public.is_admin() );

DROP POLICY IF EXISTS "Admins can update all client profiles" ON client_profiles;
CREATE POLICY "Admins can update all client profiles" 
  ON client_profiles FOR UPDATE TO authenticated 
  USING ( public.is_admin() )
  WITH CHECK ( public.is_admin() );

DROP POLICY IF EXISTS "Admins can delete client profiles" ON client_profiles;
CREATE POLICY "Admins can delete client profiles" 
  ON client_profiles FOR DELETE TO authenticated 
  USING ( public.is_admin() );

DROP POLICY IF EXISTS "Admins can update all tutor profiles" ON tutor_profiles;
CREATE POLICY "Admins can update all tutor profiles" 
  ON tutor_profiles FOR UPDATE TO authenticated 
  USING ( public.is_admin() )
  WITH CHECK ( public.is_admin() );

DROP POLICY IF EXISTS "Admins can delete tutor profiles" ON tutor_profiles;
CREATE POLICY "Admins can delete tutor profiles" 
  ON tutor_profiles FOR DELETE TO authenticated 
  USING ( public.is_admin() );

DROP POLICY IF EXISTS "Admins can view all contact queries" ON contact_queries;
CREATE POLICY "Admins can view all contact queries" 
  ON contact_queries FOR SELECT TO authenticated 
  USING ( public.is_admin() );

DROP POLICY IF EXISTS "Admins can update contact queries" ON contact_queries;
CREATE POLICY "Admins can update contact queries" 
  ON contact_queries FOR UPDATE TO authenticated 
  USING ( public.is_admin() )
  WITH CHECK ( public.is_admin() );

DROP POLICY IF EXISTS "Admins can delete contact queries" ON contact_queries;
CREATE POLICY "Admins can delete contact queries" 
  ON contact_queries FOR DELETE TO authenticated 
  USING ( public.is_admin() );

-- 5. Performance Indexes on joins and filters
CREATE INDEX IF NOT EXISTS idx_children_client_id ON public.children(client_id);
CREATE INDEX IF NOT EXISTS idx_jobs_client_id ON public.jobs(client_id);
CREATE INDEX IF NOT EXISTS idx_jobs_child_id ON public.jobs(child_id);
CREATE INDEX IF NOT EXISTS idx_proposals_job_id ON public.proposals(job_id);
CREATE INDEX IF NOT EXISTS idx_proposals_tutor_id ON public.proposals(tutor_id);
CREATE INDEX IF NOT EXISTS idx_tutor_profiles_city ON public.tutor_profiles(city);
CREATE INDEX IF NOT EXISTS idx_tutor_profiles_gender ON public.tutor_profiles(gender);
CREATE INDEX IF NOT EXISTS idx_tutor_profiles_verified ON public.tutor_profiles(verified);

-- 6. Update search_tutors RPC to accept limit and offset parameters
DROP FUNCTION IF EXISTS public.search_tutors(text, text, text, boolean, boolean, numeric, numeric, numeric, integer, text[], text[], text[], text[]);
CREATE OR REPLACE FUNCTION public.search_tutors(
  p_city text default null,
  p_area text default null,
  p_gender text default null,
  p_verified boolean default null,
  p_immediate_hiring boolean default null,
  p_min_price numeric default null,
  p_max_price numeric default null,
  p_min_rating numeric default null,
  p_min_experience integer default null,
  p_modes text[] default null,
  p_languages text[] default null,
  p_subjects text[] default null,
  p_levels text[] default null,
  p_limit integer default 20,
  p_offset integer default 0
)
RETURNS TABLE (
  id uuid,
  full_name text,
  avatar_url text,
  city text,
  area text,
  hourly_rate numeric,
  experience_years integer,
  gender text,
  verified boolean,
  rating numeric,
  reviews_count integer,
  immediate_hiring boolean,
  teaching_modes text[],
  languages text[],
  bio text,
  about text,
  categories jsonb,
  "current_role" text,
  current_company text,
  qualification text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH tutor_cats AS (
    SELECT 
      t.tutor_id,
      array_agg(distinct t.subject) filter (where t.subject is not null) as subjects_arr,
      array_agg(distinct t.level) filter (where t.level is not null) as levels_arr,
      jsonb_agg(
        jsonb_build_object(
          'level', t.level,
          'category', t.category,
          'subject', t.subject
        )
      ) as categories_json
    FROM public.tutor_categories t
    GROUP BY t.tutor_id
  )
  SELECT 
    p.id,
    p.full_name,
    p.avatar_url,
    p.city,
    p.area,
    p.hourly_rate,
    p.experience_years,
    p.gender,
    p.verified,
    p.rating,
    p.reviews_count,
    p.immediate_hiring,
    p.teaching_modes,
    p.languages,
    p.bio,
    p.about,
    coalesce(tc.categories_json, '[]'::jsonb) as categories,
    coalesce(exp.role, p."current_role") as "current_role",
    coalesce(exp.institution, p.current_company) as current_company,
    p.qualification
  FROM public.tutor_profiles p
  LEFT JOIN tutor_cats tc ON tc.tutor_id = p.id
  LEFT JOIN (
    SELECT DISTINCT ON (tutor_id) 
      tutor_id,
      role,
      institution
    FROM public.tutor_experience
    ORDER BY tutor_id, (year_to IS NULL) DESC, year_from DESC, sort_order ASC
  ) exp ON exp.tutor_id = p.id
  WHERE
    (p_city is null or lower(p.city) = lower(p_city))
    AND (p_area is null or lower(p.area) ilike '%' || lower(p_area) || '%')
    AND (p_gender is null or lower(p.gender) = lower(p_gender))
    AND (p_verified is null or p.verified = p_verified)
    AND (p_immediate_hiring is null or p.immediate_hiring = p_immediate_hiring)
    AND (p_min_price is null or p.hourly_rate >= p_min_price)
    AND (p_max_price is null or p.hourly_rate <= p_max_price)
    AND (p_min_rating is null or p.rating >= p_min_rating)
    AND (p_min_experience is null or coalesce(p.experience_years, 0) >= p_min_experience)
    AND (p_modes is null or array_length(p_modes, 1) is null or p.teaching_modes && p_modes)
    AND (p_languages is null or array_length(p_languages, 1) is null or p.languages && p_languages)
    AND (p_subjects is null or array_length(p_subjects, 1) is null or coalesce(tc.subjects_arr, '{}'::text[]) && p_subjects)
    AND (p_levels is null or array_length(p_levels, 1) is null or coalesce(tc.levels_arr, '{}'::text[]) && p_levels)
  ORDER BY p.rating desc nulls last, p.verified desc, p.created_at desc
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

COMMIT;
