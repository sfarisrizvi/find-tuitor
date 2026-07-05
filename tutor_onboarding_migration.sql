-- ============================================================
-- MIGRATION: Tutor Onboarding Extended Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================================

-- Add tutor-specific columns to profiles
alter table public.profiles 
  add column if not exists phone text,
  add column if not exists avatar_url text,
  add column if not exists cover_url text,
  add column if not exists intro_video_url text,
  add column if not exists bio text,
  add column if not exists about text,
  add column if not exists hourly_rate numeric,
  add column if not exists experience_years integer,
  add column if not exists languages text[] default '{}',
  add column if not exists onboarding_step integer default 0,
  add column if not exists onboarding_complete boolean default false,
  add column if not exists teaching_modes text[] default '{}',
  add column if not exists own_place_address text,
  add column if not exists own_place_images text[] default '{}',
  add column if not exists service_radius_km integer,
  add column if not exists service_cities text[] default '{}',
  add column if not exists availability_days text[] default '{}',
  add column if not exists availability_slots jsonb default '{}',
  add column if not exists kyc_docs jsonb default '{}';

-- ============================================================
-- Table: tutor_categories
-- Stores which teaching levels/categories each tutor can handle.
-- Used for search filtering on the client side.
-- Storage folder note: teacher-files/{email}/kyc/ and /profile/
-- ============================================================
create table if not exists public.tutor_categories (
  id uuid default uuid_generate_v4() primary key,
  tutor_id uuid references public.profiles(id) on delete cascade not null,
  level text not null,
  category text not null,
  subject text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(tutor_id, level, category, subject)
);

-- ============================================================
-- Table: tutor_experience (timeline)
-- ============================================================
create table if not exists public.tutor_experience (
  id uuid default uuid_generate_v4() primary key,
  tutor_id uuid references public.profiles(id) on delete cascade not null,
  institution text not null,
  role text not null,
  year_from integer not null,
  year_to integer,
  description text,
  sort_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================
-- RLS Policies
-- ============================================================
alter table public.tutor_categories enable row level security;
alter table public.tutor_experience enable row level security;

create policy "Tutor categories are viewable by everyone"
  on tutor_categories for select using ( true );

create policy "Tutors can manage their own categories"
  on tutor_categories for all
  using ( auth.uid() = tutor_id );

create policy "Experience is viewable by everyone"
  on tutor_experience for select using ( true );

create policy "Tutors can manage their own experience"
  on tutor_experience for all
  using ( auth.uid() = tutor_id );

-- ============================================================
-- Storage Buckets
-- Create these in Supabase Dashboard first:
--   Storage > New Bucket > "teacher-files" (Public: false)
--   Storage > New Bucket > "client-files"  (Public: false)
--
-- Folder structure:
--   teacher-files/{email}/profile/avatar.jpg
--   teacher-files/{email}/profile/cover.jpg
--   teacher-files/{email}/profile/intro_video.mp4
--   teacher-files/{email}/profile/class_1.jpg
--   teacher-files/{email}/kyc/cnic_front.jpg
--   teacher-files/{email}/kyc/cnic_back.jpg
--   teacher-files/{email}/kyc/degree.pdf
--   teacher-files/{email}/kyc/cert_1.pdf
--
-- KYC folder is never deleted even on user data deletion.
-- To delete user data: delete root folder teacher-files/{email}/
-- ============================================================

insert into storage.buckets (id, name, public)
  values ('teacher-files', 'teacher-files', false)
  on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
  values ('client-files', 'client-files', false)
  on conflict (id) do nothing;

create policy "Tutors can upload their own files"
  on storage.objects for insert
  with check (
    bucket_id = 'teacher-files' AND
    auth.role() = 'authenticated'
  );

create policy "Authenticated users can view teacher files"
  on storage.objects for select
  using (
    bucket_id = 'teacher-files' AND
    auth.role() = 'authenticated'
  );

create policy "Tutors can delete their own files"
  on storage.objects for delete
  using (
    bucket_id = 'teacher-files' AND
    auth.role() = 'authenticated'
  );
