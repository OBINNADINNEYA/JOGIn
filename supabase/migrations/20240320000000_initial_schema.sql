-- Drop existing policies first
drop policy if exists "Public profiles are viewable by everyone" on profiles;
drop policy if exists "Users can update own profile" on profiles;
drop policy if exists "Users can insert their own profile" on profiles;
drop policy if exists "Run clubs are viewable by everyone" on run_clubs;
drop policy if exists "Leaders can create run clubs" on run_clubs;
drop policy if exists "Leaders can update own run clubs" on run_clubs;
drop policy if exists "Members can view club posts" on run_club_posts;
drop policy if exists "Leaders can create posts for their clubs" on run_club_posts;
drop policy if exists "Members can view club memberships" on run_club_memberships;
drop policy if exists "Runners can join clubs" on run_club_memberships;
drop policy if exists "Users can view their own RSVPs" on rsvps;
drop policy if exists "Users can create their own RSVPs" on rsvps;
drop policy if exists "Users can view own subscription" on subscriptions;
drop policy if exists "Users can update own subscription" on subscriptions;

-- Create profiles table first
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  role text check (role in ('runner', 'leader')) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create run_clubs table
create table if not exists run_clubs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete cascade,
  name text not null,
  description text,
  logo_url text,
  location text,
  day_of_week text,
  time_of_day text,
  season text check (season in ('summer', 'winter')),
  route_info text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create memberships table
create table if not exists run_club_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  club_id uuid references run_clubs(id) on delete cascade,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, club_id)
);

-- Create posts table
create table if not exists run_club_posts (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references run_clubs(id) on delete cascade,
  author_id uuid references profiles(id) on delete set null,
  title text not null,
  content text,
  event_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create RSVPs table
create table if not exists rsvps (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references run_club_posts(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  rsvp_date timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (post_id, user_id)
);

-- Create subscriptions table
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan_type text check (plan_type in ('free', 'pro')) not null default 'free',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table run_clubs enable row level security;
alter table run_club_memberships enable row level security;
alter table run_club_posts enable row level security;
alter table rsvps enable row level security;
alter table subscriptions enable row level security;

-- Create RLS Policies

-- Profiles policies
create policy "Public profiles are viewable by everyone"
  on profiles for select
  using (true);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- Run clubs policies
create policy "Run clubs are viewable by everyone"
  on run_clubs for select
  using (true);

create policy "Leaders can create run clubs"
  on run_clubs for insert
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'leader'
    )
  );

create policy "Leaders can update own run clubs"
  on run_clubs for update
  using (owner_id = auth.uid());

-- Run club posts policies
create policy "Members can view club posts"
  on run_club_posts for select
  using (
    exists (
      select 1 from run_club_memberships
      where club_id = run_club_posts.club_id
      and user_id = auth.uid()
    )
    OR
    exists (
      select 1 from run_clubs
      where id = run_club_posts.club_id
      and owner_id = auth.uid()
    )
  );

create policy "Leaders can create posts for their clubs"
  on run_club_posts for insert
  with check (
    exists (
      select 1 from run_clubs
      where id = club_id
      and owner_id = auth.uid()
    )
  );

-- Run club memberships policies
create policy "Members can view club memberships"
  on run_club_memberships for select
  using (
    user_id = auth.uid()
    OR
    exists (
      select 1 from run_clubs
      where id = club_id
      and owner_id = auth.uid()
    )
  );

create policy "Runners can join clubs"
  on run_club_memberships for insert
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'runner'
    )
  );

-- RSVPs policies
create policy "Users can view their own RSVPs"
  on rsvps for select
  using (user_id = auth.uid());

create policy "Users can create their own RSVPs"
  on rsvps for insert
  with check (user_id = auth.uid());

-- Subscriptions policies
create policy "Users can view own subscription"
  on subscriptions for select
  using (user_id = auth.uid());

create policy "Users can update own subscription"
  on subscriptions for update
  using (user_id = auth.uid());

-- Create function to handle new user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', coalesce(new.raw_user_meta_data->>'role', 'runner'));
  
  insert into public.subscriptions (user_id, plan_type)
  values (new.id, 'free');
  
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new user creation
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user(); 