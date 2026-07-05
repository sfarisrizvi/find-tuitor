-- Add search filter columns to profiles
alter table public.profiles 
  add column if not exists gender text,
  add column if not exists area text,
  add column if not exists verified boolean default false,
  add column if not exists rating numeric(3,2) default 0.00,
  add column if not exists immediate_hiring boolean default false,
  add column if not exists reviews_count integer default 0;

-- Drop existing function if it exists to recreate it cleanly
drop function if exists public.search_tutors;

-- Create an RPC function to perform advanced array overlapping search
create or replace function public.search_tutors(
  p_city text default null,
  p_area text default null,
  p_gender text default null,
  p_verified boolean default null,
  p_immediate_hiring boolean default null,
  p_min_price numeric default null,
  p_max_price numeric default null,
  p_min_rating numeric default null,
  p_min_experience integer default null,
  p_modes text[] default null,       -- array of teaching modes e.g., ['online', 'home']
  p_languages text[] default null,   -- array of languages e.g., ['English', 'Urdu']
  p_subjects text[] default null,    -- array of subject names
  p_levels text[] default null       -- array of levels e.g., ['O Levels', 'Class 10']
)
returns table (
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
  categories jsonb -- aggregated subjects and levels
) 
language plpgsql
security definer
as $$
begin
  return query
  with tutor_cats as (
    -- Group categories so we can filter by array overlap AND return them as JSON
    select 
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
    from public.tutor_categories t
    group by t.tutor_id
  )
  select 
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
    coalesce(tc.categories_json, '[]'::jsonb) as categories
  from public.profiles p
  left join tutor_cats tc on tc.tutor_id = p.id
  where p.role = 'tutor'
    -- Exact text matches (case-insensitive)
    and (p_city is null or lower(p.city) = lower(p_city))
    and (p_area is null or lower(p.area) ilike '%' || lower(p_area) || '%')
    and (p_gender is null or lower(p.gender) = lower(p_gender))
    
    -- Boolean exact matches
    and (p_verified is null or p.verified = p_verified)
    and (p_immediate_hiring is null or p.immediate_hiring = p_immediate_hiring)
    
    -- Numeric ranges
    and (p_min_price is null or p.hourly_rate >= p_min_price)
    and (p_max_price is null or p.hourly_rate <= p_max_price)
    and (p_min_rating is null or p.rating >= p_min_rating)
    and (p_min_experience is null or coalesce(p.experience_years, 0) >= p_min_experience)
    
    -- Array overlaps (using Postgres overlap operator && which returns true if arrays share ANY element)
    -- Or we can use "contains" @> if we want strict inclusion.
    -- For filters, overlap (&&) is usually better (e.g., "I want a tutor who teaches Math OR Physics")
    -- We will use overlap && for modes and languages
    and (p_modes is null or array_length(p_modes, 1) is null or p.teaching_modes && p_modes)
    and (p_languages is null or array_length(p_languages, 1) is null or p.languages && p_languages)
    
    -- Array overlaps for joined categories
    and (p_subjects is null or array_length(p_subjects, 1) is null or coalesce(tc.subjects_arr, '{}'::text[]) && p_subjects)
    and (p_levels is null or array_length(p_levels, 1) is null or coalesce(tc.levels_arr, '{}'::text[]) && p_levels)
    
  order by p.rating desc nulls last, p.verified desc, p.created_at desc;
end;
$$;
