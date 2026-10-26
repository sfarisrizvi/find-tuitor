const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const env = {};
fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && !key.startsWith('#')) env[key.trim()] = val.join('=').trim();
});

const DATABASE_URL = env['DATABASE_URL'];
if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL');
  process.exit(1);
}

const SQL = `
DROP FUNCTION IF EXISTS public.search_tutors(text, text, text, boolean, boolean, numeric, numeric, numeric, integer, text[], text[], text[], text[]);
DROP FUNCTION IF EXISTS public.search_tutors(text, text, text, boolean, boolean, numeric, numeric, numeric, integer, text[], text[], text[], text[], integer, integer);

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
  p_limit integer default 100,
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
  qualification text,
  created_at timestamp with time zone,
  is_dummy boolean,
  onboarding_complete boolean,
  kyc_status text
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
    p.qualification,
    p.created_at,
    coalesce(p.is_dummy, false) as is_dummy,
    coalesce(p.onboarding_complete, false) as onboarding_complete,
    p.kyc_status
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
    AND (p.suspended IS NOT TRUE)
    AND (p.onboarding_complete IS TRUE)
    AND (
      p.is_dummy IS TRUE 
      OR (p.kyc_status = 'approved')
    )
  ORDER BY 
    (CASE WHEN p.is_dummy IS TRUE OR p.full_name LIKE 'Sir %' OR p.full_name LIKE 'Miss %' OR p.id::text LIKE 'mock-%' THEN 0 ELSE 1 END) DESC,
    p.verified DESC,
    (CASE WHEN p.rating IS NOT NULL AND p.rating > 0 AND p.reviews_count > 0 THEN 1 ELSE 0 END) DESC,
    p.rating DESC NULLS LAST,
    p.reviews_count DESC NULLS LAST,
    p.created_at ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;
`;

async function main() {
  const client = new Client({ connectionString: DATABASE_URL });
  try {
    await client.connect();
    console.log('Connected to PostgreSQL database.');
    await client.query(SQL);
    console.log('✅ Successfully updated public.search_tutors RPC to enforce onboarding_complete, verified KYC, and start new profiles from bottom.');
  } catch (err) {
    console.error('Error running SQL update:', err);
  } finally {
    await client.end();
  }
}

main();
