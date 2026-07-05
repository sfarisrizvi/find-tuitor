-- Drop existing tables, triggers, and functions to allow clean rebuild
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user cascade;
drop table if exists public.proposals cascade;
drop table if exists public.jobs cascade;
drop table if exists public.children cascade;
drop table if exists public.profiles cascade;

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table: public.profiles
create table public.profiles (
  id uuid references auth.users not null primary key,
  role text check (role in ('client', 'tutor', 'admin')) not null,
  client_type text check (client_type in ('parent', 'student')),
  full_name text,
  city text,
  academic_route text,
  kyc_status text default 'pending' check (kyc_status in ('pending', 'approved', 'rejected')),
  connects integer default 30,
  jss_score numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: public.children
create table public.children (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  academic_route text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: public.jobs
create table public.jobs (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.profiles(id) on delete cascade not null,
  child_id uuid references public.children(id) on delete cascade,
  title text not null,
  subject text not null,
  mode text not null check (mode in ('online', 'home', 'tutor_place')),
  budget_type text not null check (budget_type in ('hourly', 'fixed')),
  budget_amount numeric not null,
  status text default 'open' check (status in ('open', 'hired', 'closed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: public.proposals
create table public.proposals (
  id uuid default uuid_generate_v4() primary key,
  job_id uuid references public.jobs(id) on delete cascade not null,
  tutor_id uuid references public.profiles(id) on delete cascade not null,
  cover_letter text,
  bid_amount numeric not null,
  status text default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.children enable row level security;
alter table public.jobs enable row level security;
alter table public.proposals enable row level security;

-- Simple RLS Policies
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

create policy "Clients can view and manage their children"
  on children for all
  using ( auth.uid() = client_id );

create policy "Jobs are viewable by everyone"
  on jobs for select
  using ( true );

create policy "Clients can manage their jobs"
  on jobs for all
  using ( auth.uid() = client_id );

create policy "Tutors can view all proposals"
  on proposals for select
  using ( true );

create policy "Tutors can insert proposals"
  on proposals for insert
  with check ( auth.uid() = tutor_id );

-- Handle new user signup trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role, client_type)
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    coalesce(new.raw_user_meta_data->>'role', 'client'),
    new.raw_user_meta_data->>'client_type'
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
